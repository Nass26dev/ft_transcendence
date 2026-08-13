"""Briques partagées des tests E2E : URL de la stack, attentes et interactions.

Les tests décrivent un parcours utilisateur ; tout le bruit Selenium
(`WebDriverWait(...).until(EC....)`, scroll, retries de clic) est isolé ici.

Deux modes d'interaction, pilotés par variables d'environnement :

- normal : les clics/saisies vont au plus court (suite CI, rapide) ;
- démo (`E2E_DEMO=1`) : un curseur rouge est injecté dans la page et se
  déplace vers chaque élément avant de cliquer, avec une pause entre
  chaque action — c'est ce qu'on regarde quand on veut *voir* le test
  jouer (fenêtre Chrome locale ou noVNC du conteneur).

Variables reconnues :
    E2E_BASE_URL  URL de la stack testée (défaut https://localhost:8443)
    E2E_DEMO      "1" pour activer curseur visible + ralenti
    E2E_SLOWMO    pause en secondes entre deux actions (défaut 0.35 en démo)
"""
import os
import re
import subprocess
import time
from pathlib import Path

from selenium.common.exceptions import (
    ElementClickInterceptedException,
    NoSuchElementException,
    StaleElementReferenceException,
    WebDriverException,
)
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webelement import WebElement
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

REPO_ROOT = Path(__file__).resolve().parent.parent
SCREENSHOT_DIR = Path(__file__).resolve().parent / "screenshots"

# Le conteneur `selenium` partage le netns de `caddy_dev` (network_mode:
# service:caddy_dev, cf. docker-compose.override.yml) et les ports de
# caddy_dev sont publiés sur l'hôte : "localhost:8443" désigne donc la même
# stack depuis le conteneur ET depuis un Chrome local. C'est ce qui compte,
# puisque le frontend a NEXT_PUBLIC_API_URL=https://localhost:8443 inlinée en
# dur au build et l'utilise pour TOUS les appels API du SPA.
BASE_URL = os.getenv("E2E_BASE_URL", "https://localhost:8443")

DEMO = os.getenv("E2E_DEMO") == "1"
SLOWMO = float(os.getenv("E2E_SLOWMO", "0.35" if DEMO else "0"))

DEFAULT_TIMEOUT = 15


# --------------------------------------------------------------------------
# Locators : les tests écrivent `button("S'inscrire")` plutôt qu'un XPath brut
# --------------------------------------------------------------------------

def _xpath_literal(value: str) -> str:
    """Encode une chaîne en littéral XPath (les libellés contiennent des ')."""
    if "'" not in value:
        return f"'{value}'"
    if '"' not in value:
        return f'"{value}"'
    parts = "', \"'\", '".join(value.split("'"))
    return f"concat('{parts}')"


def css(selector: str):
    return (By.CSS_SELECTOR, selector)


def button(label: str):
    """Bouton dont le texte est exactement `label`."""
    return (By.XPATH, f"//button[normalize-space()={_xpath_literal(label)}]")


def button_containing(fragment: str):
    """Bouton dont le texte contient `fragment` (libellés dynamiques)."""
    return (By.XPATH, f"//button[contains(normalize-space(), {_xpath_literal(fragment)})]")


# --------------------------------------------------------------------------
# Navigation et attentes
# --------------------------------------------------------------------------

def wait(driver, timeout: int = DEFAULT_TIMEOUT) -> WebDriverWait:
    """WebDriverWait tolérant aux re-rendus de React.

    Par défaut `WebDriverWait` n'ignore que NoSuchElementException : si le
    nœud est remplacé entre le find et la vérification (ce qui arrive tout le
    temps ici — scores live, toasts, hydratation), la condition remonte une
    StaleElementReferenceException au lieu de simplement retenter. On l'ignore
    donc explicitement, c'est le sens même d'un « until ».
    """
    return WebDriverWait(
        driver,
        timeout,
        ignored_exceptions=(NoSuchElementException, StaleElementReferenceException),
    )


def visit(driver, path: str, timeout: int = DEFAULT_TIMEOUT, wait_data: bool = True):
    """Ouvre une page de la stack et attend qu'elle soit réellement affichée."""
    driver.get(f"{BASE_URL}{path}")
    wait_loaded(driver, timeout)
    if wait_data:
        wait_data_loaded(driver, timeout)


def wait_loaded(driver, timeout: int = DEFAULT_TIMEOUT):
    """Attend document.readyState === "complete"."""
    wait(driver, timeout).until(
        lambda d: d.execute_script("return document.readyState") == "complete"
    )


def wait_data_loaded(driver, timeout: int = DEFAULT_TIMEOUT):
    """Attend la disparition des squelettes de chargement.

    `readyState === "complete"` ne veut dire ici que « le bundle JS est là » :
    le SPA affiche alors des <Skeleton> pulsés et va chercher ses données.
    Sans cette attente, on teste (et on screenshote) une page vide.
    """
    wait(driver, timeout).until(
        lambda d: d.execute_script(
            "return document.querySelectorAll('.animate-pulse').length === 0"
        )
    )


def wait_present(driver, locator, timeout: int = DEFAULT_TIMEOUT) -> WebElement:
    return wait(driver, timeout).until(EC.presence_of_element_located(locator))


def wait_clickable(driver, locator, timeout: int = DEFAULT_TIMEOUT) -> WebElement:
    return wait(driver, timeout).until(EC.element_to_be_clickable(locator))


def wait_gone(driver, locator, timeout: int = DEFAULT_TIMEOUT):
    """Attend qu'un élément disparaisse (fermeture de modale, par exemple)."""
    wait(driver, timeout).until(EC.invisibility_of_element_located(locator))


def wait_text(driver, text: str, timeout: int = DEFAULT_TIMEOUT):
    """Attend qu'un texte apparaisse dans la page (toasts, confirmations)."""
    wait(driver, timeout).until(EC.text_to_be_present_in_element((By.TAG_NAME, "body"), text))


def wait_url_contains(driver, fragment: str, timeout: int = DEFAULT_TIMEOUT):
    wait(driver, timeout).until(lambda d: fragment in d.current_url)


def wait_url_matches(driver, pattern: str, timeout: int = DEFAULT_TIMEOUT):
    wait(driver, timeout).until(EC.url_matches(pattern))


# --------------------------------------------------------------------------
# Interactions
# --------------------------------------------------------------------------

def _element(driver, target, timeout: int) -> WebElement:
    """Accepte indifféremment un WebElement déjà résolu ou un locator."""
    if isinstance(target, WebElement):
        return target
    return wait_present(driver, target, timeout)


def click(driver, target, timeout: int = DEFAULT_TIMEOUT) -> WebElement:
    """Clique un élément : scroll, curseur de démo, puis clic."""

    def do_click(element):
        _perform_click(driver, element)
        _click_effect(driver, element)

    return _interact(driver, target, do_click, timeout)


def fill(driver, target, text: str, clear: bool = False, timeout: int = DEFAULT_TIMEOUT) -> WebElement:
    """Saisit du texte dans un champ (frappe lettre par lettre en démo)."""

    def do_fill(element):
        if clear:
            element.clear()
        if DEMO:
            for char in text:
                element.send_keys(char)
                time.sleep(0.03)
        else:
            element.send_keys(text)

    return _interact(driver, target, do_fill, timeout)


def _interact(driver, target, action, timeout: int) -> WebElement:
    """Amène l'élément à l'écran, joue le curseur de démo, puis exécute `action`.

    React re-rend en permanence (données live, toasts, hydratation) : entre le
    moment où on résout l'élément et celui où on agit dessus, le nœud peut
    avoir été remplacé — d'autant plus en mode démo, où l'on s'attarde. Tant
    qu'on a un locator (et pas un WebElement déjà résolu par le test), on le
    re-résout et on rejoue l'action au lieu d'échouer.
    """
    deadline = time.time() + timeout
    while True:
        element = _element(driver, target, timeout)
        try:
            _scroll_into_view(driver, element)
            _show_cursor_at(driver, element)
            _pause()
            action(element)
            _pause()
            return element
        except StaleElementReferenceException:
            if isinstance(target, WebElement) or time.time() > deadline:
                raise
            time.sleep(0.2)


def _perform_click(driver, element: WebElement) -> None:
    """Clic ActionChains (survol réel), avec repli si un overlay intercepte."""
    try:
        ActionChains(driver).move_to_element(element).click(element).perform()
        return
    except StaleElementReferenceException:
        raise
    except (ElementClickInterceptedException, WebDriverException):
        pass

    try:
        element.click()
    except StaleElementReferenceException:
        raise
    except WebDriverException:
        driver.execute_script("arguments[0].click()", element)


def _scroll_into_view(driver, element: WebElement) -> None:
    driver.execute_script(
        "arguments[0].scrollIntoView({block: 'center', inline: 'center'})", element
    )


def _pause() -> None:
    if SLOWMO:
        time.sleep(SLOWMO)


# --------------------------------------------------------------------------
# Curseur de démonstration
# --------------------------------------------------------------------------
# Selenium ne bouge pas le pointeur de la souris de l'OS : les clics sont
# synthétisés dans le navigateur. Pour *voir* ce que fait le test, on dessine
# donc notre propre curseur dans la page (overlay position:fixed) et on
# l'anime vers l'élément visé avant chaque interaction.

_CURSOR_JS = """
const el = arguments[0];
const box = el.getBoundingClientRect();
const x = box.left + box.width / 2;
const y = box.top + box.height / 2;
let cursor = document.getElementById('e2e-cursor');
if (!cursor) {
  cursor = document.createElement('div');
  cursor.id = 'e2e-cursor';
  cursor.style.cssText = `position:fixed;left:0;top:0;width:20px;height:20px;
    margin:-10px 0 0 -10px;border-radius:50%;background:rgba(239,68,68,.35);
    border:2px solid #ef4444;box-shadow:0 0 14px rgba(239,68,68,.7);
    z-index:2147483647;pointer-events:none;
    transition:transform .35s cubic-bezier(.4,0,.2,1);
    transform:translate(${window.innerWidth / 2}px, ${window.innerHeight - 40}px);`;
  document.body.appendChild(cursor);
  cursor.getBoundingClientRect();
}
cursor.style.transform = `translate(${x}px, ${y}px)`;
el.style.outline = '2px solid rgba(239,68,68,.9)';
el.style.outlineOffset = '2px';
setTimeout(() => { el.style.outline = ''; el.style.outlineOffset = ''; }, 900);
"""

_CLICK_JS = """
const el = arguments[0];
const box = el.getBoundingClientRect();
const ripple = document.createElement('div');
ripple.style.cssText = `position:fixed;left:0;top:0;width:20px;height:20px;
  margin:-10px 0 0 -10px;border-radius:50%;border:2px solid #ef4444;
  z-index:2147483647;pointer-events:none;
  transform:translate(${box.left + box.width / 2}px, ${box.top + box.height / 2}px);`;
document.body.appendChild(ripple);
ripple.animate(
  [{opacity: 1, scale: '1'}, {opacity: 0, scale: '3'}],
  {duration: 450, easing: 'ease-out'}
).onfinish = () => ripple.remove();
"""


def _show_cursor_at(driver, element: WebElement) -> None:
    if not DEMO:
        return
    try:
        driver.execute_script(_CURSOR_JS, element)
        time.sleep(0.35)  # durée de la transition CSS
    except StaleElementReferenceException:
        raise  # laisse `_interact` re-résoudre l'élément
    except WebDriverException:
        pass  # l'overlay reste cosmétique : jamais une cause d'échec


def _click_effect(driver, element: WebElement) -> None:
    """Onde au point de clic. Après le clic, l'élément a souvent déjà été
    remplacé par le re-rendu React : toute erreur est ignorée ici."""
    if not DEMO:
        return
    try:
        driver.execute_script(_CLICK_JS, element)
    except WebDriverException:
        pass


# --------------------------------------------------------------------------
# Assertions et outillage
# --------------------------------------------------------------------------

def screenshot(driver, name: str) -> Path:
    """Sauvegarde une capture d'écran dans e2e/screenshots/."""
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
    text = driver.find_element(By.TAG_NAME, "body").text
    for marker in ("Application error", "This page could not be found", "Server Error (500)"):
        assert marker not in text, f"« {marker} » détecté (visible) sur {driver.current_url}"


# --------------------------------------------------------------------------
# Session : ouverture sans passer par le code 2FA
# --------------------------------------------------------------------------
# Le second facteur ne peut pas être automatisé de bout en bout : le code part
# par email (Brevo) vers une adresse jetable qu'on ne relève pas, et il est
# stocké dans le cache Django — un LocMemCache, donc propre au process qui
# sert l'application. Un `manage.py shell` lancé à côté ouvre son PROPRE cache,
# vide : le code y est structurellement introuvable.
#
# Les tests couvrent donc la 2FA jusqu'à l'écran de saisie du code (c'est là
# que se joue le comportement du front), puis ouvrent la session comme le
# ferait la vérification du code : en posant les mêmes cookies JWT, générés
# côté backend pour le même utilisateur.

def _django_shell(script: str) -> subprocess.CompletedProcess:
    return subprocess.run(
        ["docker", "compose", "exec", "-T", "backend", "python3", "manage.py", "shell", "-c", script],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
    )


def ensure_account(email: str, username: str, password: str) -> None:
    """Crée le compte s'il n'existe pas encore.

    Dans le parcours complet, c'est test_01 qui le crée via le formulaire.
    Cette fonction n'existe que pour pouvoir rejouer n'importe quel fichier
    isolément (`./run.sh test_05_leagues.py`) sans rejouer l'inscription.
    """
    script = (
        "from django.contrib.auth import get_user_model;"
        "U = get_user_model();"
        f"U.objects.filter(email='{email}').exists() or "
        f"U.objects.create_user(email='{email}', username='{username}', password='{password}')"
    )
    result = _django_shell(script)
    if result.returncode != 0:
        raise RuntimeError(f"Création du compte {email} impossible.\n{result.stderr}")


def has_session(driver) -> bool:
    """Le navigateur porte-t-il déjà des cookies de session ?"""
    if not driver.current_url.startswith(BASE_URL):
        driver.get(f"{BASE_URL}/login")
    return any(cookie["name"] == "access_token" for cookie in driver.get_cookies())


def issue_session_tokens(email: str) -> dict:
    """Génère une paire de JWT (access/refresh) pour cet utilisateur."""
    script = (
        "from django.contrib.auth import get_user_model;"
        "from rest_framework_simplejwt.tokens import RefreshToken;"
        f"u = get_user_model().objects.get(email='{email}');"
        "r = RefreshToken.for_user(u);"
        "print('ACCESS=' + str(r.access_token));"
        "print('REFRESH=' + str(r))"
    )
    result = _django_shell(script)
    output = (result.stdout or "") + (result.stderr or "")
    access = re.search(r"^ACCESS=(\S+)$", result.stdout, re.MULTILINE)
    refresh = re.search(r"^REFRESH=(\S+)$", result.stdout, re.MULTILINE)
    if not access or not refresh:
        raise RuntimeError(f"Impossible de générer les JWT de {email}.\nSortie : {output}")
    return {"access_token": access.group(1), "refresh_token": refresh.group(1)}


def sign_in(driver, email: str) -> None:
    """Ouvre une session authentifiée en posant les cookies JWT (2FA court-circuitée)."""
    tokens = issue_session_tokens(email)
    # Un cookie ne peut être posé que depuis le domaine concerné : on charge
    # d'abord une page du site (publique) avant d'appeler add_cookie.
    driver.get(f"{BASE_URL}/login")
    for name, value in tokens.items():
        driver.add_cookie(
            {"name": name, "value": value, "path": "/", "httpOnly": True, "sameSite": "Lax"}
        )
