"""Étape 3 : arrivée sur l'accueil, onboarding du premier login et navigation."""
from selenium.common.exceptions import TimeoutException

from helpers import (
    assert_page_healthy,
    button,
    css,
    click,
    screenshot,
    visit,
    wait_clickable,
    wait_gone,
)

NAV_ROUTES = ("/live", "/matches", "/tickets", "/chat", "/friends", "/leagues")


def test_home_dismisses_onboarding_and_loads(driver, logged_in):
    visit(driver, "/")
    assert_page_healthy(driver)

    # Premier login : la modale d'onboarding s'affiche (bouton "Passer"
    # toujours visible, quelle que soit l'étape). On la ferme si présente.
    skip = button("Passer")
    try:
        wait_clickable(driver, skip, timeout=8)
        screenshot(driver, "03_home_onboarding")
        click(driver, skip)
    except TimeoutException:
        pass

    wait_gone(driver, skip, timeout=10)
    screenshot(driver, "03_home")

    for href in NAV_ROUTES:
        assert driver.find_elements(*css(f"a[href='{href}']")), f"lien {href} introuvable dans la nav"
