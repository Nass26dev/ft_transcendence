"""Étape 10 : la console du navigateur doit rester silencieuse.

Le sujet l'exige explicitement (« No warnings or errors about the Javascript
code should appear in the browser console »), et c'est le genre de régression
qui passe inaperçue jusqu'au jour de la soutenance.
"""
import pytest

from helpers import assert_page_healthy, visit

# Pages parcourues : les deux publiques (avant login) et les principales pages
# authentifiées. La fixture `logged_in` ouvre la session pour ces dernières.
PUBLIC_PAGES = ["/login", "/register", "/privacy", "/terms"]
APP_PAGES = ["/", "/live", "/matches", "/leagues", "/friends", "/chat", "/settings"]

# Bruits que le navigateur émet sans que le code du projet soit en cause.
IGNORED = (
    "favicon",
    "net::ERR_CERT",          # certificat auto-signé de Caddy en dev
    "Autofocus processing",   # avertissement Chrome sur les iframes tierces
)


def _console_problems(driver):
    """Entrées de niveau WARNING ou SEVERE de la console, hors bruit connu."""
    problems = []
    for entry in driver.get_log("browser"):
        if entry["level"] not in ("WARNING", "SEVERE"):
            continue
        if any(noise in entry["message"] for noise in IGNORED):
            continue
        problems.append(f"[{entry['level']}] {entry['message'][:300]}")
    return problems


@pytest.mark.parametrize("path", PUBLIC_PAGES)
def test_public_page_console_is_clean(driver, path):
    visit(driver, path)
    assert_page_healthy(driver)
    problems = _console_problems(driver)
    assert not problems, f"Console non vide sur {path} :\n" + "\n".join(problems)


@pytest.mark.parametrize("path", APP_PAGES)
def test_app_page_console_is_clean(driver, logged_in, path):
    visit(driver, path)
    assert_page_healthy(driver)
    problems = _console_problems(driver)
    assert not problems, f"Console non vide sur {path} :\n" + "\n".join(problems)
