"""Étape 9 : déconnexion et purge des cookies de session."""
from helpers import (
    assert_page_healthy,
    button,
    click,
    screenshot,
    visit,
    wait_clickable,
    wait_url_contains,
)


def test_logout_clears_session(driver, logged_in):
    visit(driver, "/settings")
    logout = button("Se déconnecter")
    wait_clickable(driver, logout)
    click(driver, logout)

    wait_url_contains(driver, "/login")
    assert_page_healthy(driver)
    screenshot(driver, "09_logged_out")

    cookie_names = {c["name"] for c in driver.get_cookies()}
    assert "access_token" not in cookie_names
