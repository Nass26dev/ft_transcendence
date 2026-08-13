"""Fixtures des tests E2E Selenium.

Ces tests pilotent un vrai Chrome contre la stack dev réelle
(https://localhost:8443 via Caddy) : aucun mock, aucune base dédiée. Un seul
navigateur est réutilisé pour toute la session (fixture `driver`
session-scoped) et les fichiers test_01_*.py, test_02_*.py... s'exécutent
dans l'ordre alphabétique : ils partagent donc la même session connectée,
exactement comme un utilisateur qui parcourt le site du début à la fin.

Deux navigateurs possibles (E2E_BROWSER) :

- `remote` (défaut) : le conteneur `selenium` (profil e2e du compose). Rien à
  installer, et on peut regarder l'écran du conteneur via noVNC sur
  http://localhost:7900 (mot de passe : secret).
- `local` : un Chrome installé sur la machine, fenêtre visible sur le bureau.

Lancer la suite : `./e2e/run.sh` (voir `./e2e/run.sh --help` pour les modes
démo/fenêtre visible).
"""
import os
import ssl
import time
import urllib.request
import uuid

import pytest
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

from helpers import BASE_URL, ensure_account, has_session, screenshot, sign_in

SELENIUM_URL = os.getenv("E2E_SELENIUM_URL", "http://localhost:4444")
BROWSER = os.getenv("E2E_BROWSER", "remote")
WINDOW_SIZE = os.getenv("E2E_WINDOW_SIZE", "1440,1000")


def _wait_for_server(url: str, timeout: int = 90) -> None:
    """Attend qu'une URL réponde (le temps que Next.js/Django/selenium démarrent)."""
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    deadline = time.time() + timeout
    last_error = None
    while time.time() < deadline:
        try:
            urllib.request.urlopen(url, timeout=3, context=ctx)
            return
        except Exception as exc:  # noqa: BLE001 - on retente jusqu'au timeout
            last_error = exc
            time.sleep(2)
    raise RuntimeError(f"{url} injoignable après {timeout}s : {last_error}")


def _chrome_options() -> Options:
    options = Options()
    options.set_capability("acceptInsecureCerts", True)
    options.add_argument(f"--window-size={WINDOW_SIZE}")
    # Certificat auto-signé de Caddy en dev + écrans de premier lancement de
    # Chrome, qui voleraient le focus au démarrage d'une fenêtre locale.
    options.add_argument("--ignore-certificate-errors")
    options.add_argument("--no-first-run")
    options.add_argument("--no-default-browser-check")
    options.add_argument("--disable-search-engine-choice-screen")
    return options


def _remote_driver() -> webdriver.Remote:
    """Chrome du conteneur `selenium` (docker compose --profile e2e up -d selenium)."""
    _wait_for_server(f"{SELENIUM_URL}/status", timeout=120)

    deadline = time.time() + 60
    last_error = None
    while time.time() < deadline:
        try:
            return webdriver.Remote(command_executor=SELENIUM_URL, options=_chrome_options())
        except Exception as exc:  # noqa: BLE001 - le conteneur peut démarrer lentement
            last_error = exc
            time.sleep(2)
    raise RuntimeError(f"Impossible de joindre selenium ({SELENIUM_URL}) : {last_error}")


def _local_driver() -> webdriver.Chrome:
    """Chrome de la machine, fenêtre visible (chromedriver géré par Selenium Manager)."""
    return webdriver.Chrome(options=_chrome_options())


@pytest.fixture(scope="session", autouse=True)
def _server_ready():
    """S'assure que Caddy/Next/Django répondent avant de lancer le premier test."""
    _wait_for_server(BASE_URL)


@pytest.fixture(scope="session")
def driver():
    """Un unique navigateur pour toute la session (le parcours est continu)."""
    if BROWSER not in ("remote", "local"):
        raise RuntimeError(f"E2E_BROWSER doit valoir 'remote' ou 'local', pas '{BROWSER}'")

    browser = _local_driver() if BROWSER == "local" else _remote_driver()
    try:
        yield browser
    finally:
        browser.quit()


@pytest.fixture(scope="session")
def credentials():
    """Identifiants d'un compte unique généré pour toute la session E2E."""
    token = uuid.uuid4().hex[:10]
    return {
        "email": f"e2e_{token}@example.com",
        "username": f"e2e_{token}",
        "password": "E2eTestPass123!",
    }


@pytest.fixture
def logged_in(driver, credentials):
    """Garantit une session ouverte avant le test.

    Dans le parcours complet elle vient déjà de test_01/test_02 et cette
    fixture ne fait rien. Elle n'agit que si l'on rejoue un fichier isolément
    (`./e2e/run.sh test_05_leagues.py`) : elle crée alors le compte et pose
    les cookies, pour que chaque étape reste jouable seule.
    """
    if has_session(driver):
        return
    ensure_account(**credentials)
    sign_in(driver, credentials["email"])


@pytest.hookimpl(hookwrapper=True)
def pytest_runtest_makereport(item, call):
    """Capture l'écran au moment précis où un test échoue (e2e/screenshots/echec_*)."""
    report = yield
    result = report.get_result()
    if result.when != "call" or not result.failed:
        return
    browser = item.funcargs.get("driver")
    if browser is not None:
        try:
            screenshot(browser, f"echec_{item.name}")
        except Exception:  # noqa: BLE001 - ne jamais masquer l'échec d'origine
            pass
