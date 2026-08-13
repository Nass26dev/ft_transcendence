"""Infrastructure partagée des tests E2E Selenium.

Ces tests pilotent un vrai Chrome (conteneur `selenium`, cf.
docker-compose.override.yml) contre la stack dev réelle
(https://localhost:8443 via Caddy). Un seul navigateur est réutilisé pour
toute la session (fixture `driver` session-scoped) : les fichiers
test_01_*.py, test_02_*.py... s'exécutent dans l'ordre alphabétique et
partagent la même session connectée, exactement comme un utilisateur qui
parcourt le site.

Lancer la suite : `./e2e/run.sh` (démarre selenium, installe les deps dans
un venv local, exécute pytest, affiche où sont les screenshots).
"""
import re
import ssl
import subprocess
import time
import urllib.request
import uuid
from pathlib import Path

import pytest
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

REPO_ROOT = Path(__file__).resolve().parent.parent
SCREENSHOT_DIR = Path(__file__).resolve().parent / "screenshots"

# Le conteneur `selenium` partage le netns de `caddy_dev` (network_mode:
# service:caddy_dev, cf. docker-compose.override.yml) : "localhost" y
# désigne donc caddy_dev, exactement comme dans un navigateur normal — ce
# qui compte puisque le frontend a NEXT_PUBLIC_API_URL=https://localhost:8443
# inlinée en dur au build (le SPA l'utilise pour TOUS ses appels API, pas
# seulement la page chargée au départ).
BASE_URL = "https://localhost:8443"
SELENIUM_URL = "http://localhost:4444"


def _wait_for_server(url: str, timeout: int = 90) -> None:
    """Attend que la stack dev réponde (le temps que Next.js/Django démarrent)."""
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


@pytest.fixture(scope="session", autouse=True)
def _server_ready():
    """S'assure que Caddy/Next/Django répondent avant de lancer le premier test."""
    _wait_for_server(BASE_URL)


@pytest.fixture(scope="session")
def driver():
    """Un unique navigateur distant (conteneur selenium) pour toute la session."""
    options = Options()
    options.set_capability("acceptInsecureCerts", True)
    options.add_argument("--window-size=1440,1000")

    _wait_for_server(f"{SELENIUM_URL}/status", timeout=120)

    deadline = time.time() + 60
    last_error = None
    remote = None
    while time.time() < deadline:
        try:
            remote = webdriver.Remote(command_executor=SELENIUM_URL, options=options)
            break
        except Exception as exc:  # noqa: BLE001 - le conteneur selenium peut démarrer lentement
            last_error = exc
            time.sleep(2)
    if remote is None:
        raise RuntimeError(f"Impossible de joindre selenium ({SELENIUM_URL}) : {last_error}")

    yield remote
    remote.quit()


@pytest.fixture(scope="session")
def credentials():
    """Identifiants d'un compte unique généré pour toute la session E2E."""
    token = uuid.uuid4().hex[:10]
    return {
        "email": f"e2e_{token}@example.com",
        "username": f"e2e_{token}",
        "password": "E2eTestPass123!",
    }


def screenshot(driver, name: str) -> Path:
    """Sauvegarde une capture d'écran horodatée dans e2e/screenshots/."""
    SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)
    path = SCREENSHOT_DIR / f"{name}.png"
    driver.save_screenshot(str(path))
    return path


def assert_page_healthy(driver) -> None:
    """Vérifie l'absence des marqueurs d'erreur Next.js/Django dans le texte VISIBLE.

    `driver.page_source` contient aussi les payloads RSC (`<script>
    self.__next_f.push(...)</script>`) des routes préchargées par Next (liens
    de la nav) : ces payloads peuvent légitimement embarquer le JSON d'un
    boundary not-found pour une autre route, donc on ne scanne que le texte
    du <body> réellement affiché, pas le HTML brut.
    """
    text = driver.find_element("tag name", "body").text
    for marker in ("Application error", "This page could not be found", "Server Error (500)"):
        assert marker not in text, f"« {marker} » détecté (visible) sur {driver.current_url}"


def get_otp_code(email: str, timeout: int = 20) -> str:
    """Récupère le code 2FA depuis le cache Django, via `docker compose exec`.

    Le code part par email (Brevo) en conditions réelles ; en test on n'a pas
    de boîte mail à lire, donc on va le chercher là où LoginStep1View l'a
    posé (cache `otp_<user_id>`, 5 min de TTL) en interrogeant directement le
    conteneur backend.
    """
    script = (
        "from django.contrib.auth import get_user_model;"
        "from django.core.cache import cache;"
        f"u = get_user_model().objects.get(email='{email}');"
        "print(cache.get(f'otp_{u.id}') or '')"
    )
    deadline = time.time() + timeout
    last_output = ""
    while time.time() < deadline:
        result = subprocess.run(
            ["docker", "compose", "exec", "-T", "backend", "python3", "manage.py", "shell", "-c", script],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
        )
        last_output = (result.stdout or "") + (result.stderr or "")
        match = re.search(r"^\d{6}$", result.stdout.strip(), re.MULTILINE)
        if match:
            return match.group(0)
        time.sleep(1)
    raise RuntimeError(f"Code OTP introuvable pour {email} après {timeout}s.\nSortie : {last_output}")
