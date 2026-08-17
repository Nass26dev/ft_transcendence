"""Étape 2 : connexion en deux temps (mot de passe puis code 2FA).

La vérification du code lui-même n'est pas rejouable en test (voir
`helpers.sign_in`) : on couvre la 2FA jusqu'à l'écran de saisie du code, puis
on ouvre la session directement.
"""
from helpers import (
    BASE_URL,
    assert_page_healthy,
    button,
    css,
    click,
    fill,
    screenshot,
    sign_in,
    visit,
    wait_present,
    wait_url_matches,
)


def test_login_asks_for_two_factor_code(driver, account):
    # On enchaîne depuis la redirection de l'inscription (/login?email=...) ;
    # si ce test est relancé seul, on y va directement.
    if "/login" not in driver.current_url:
        visit(driver, f"/login?email={account['email']}")

    wait_present(driver, css("input[type=password]"))
    assert_page_healthy(driver)

    email_field = driver.find_element(*css("input[type=email]"))
    if email_field.get_attribute("value") != account["email"]:
        fill(driver, email_field, account["email"], clear=True)
    fill(driver, css("input[type=password]"), account["password"])
    screenshot(driver, "02_login_step1")

    click(driver, button("Recevoir le code"))

    # Mot de passe accepté : le front passe à l'étape du code à 6 chiffres.
    wait_present(driver, css("input[maxlength='6']"))
    screenshot(driver, "02_login_step2")


def test_session_opens_on_home(driver, account):
    sign_in(driver, account["email"])

    visit(driver, "/")
    wait_url_matches(driver, rf"{BASE_URL}/?$")
    assert_page_healthy(driver)
    screenshot(driver, "02_login_success")

    cookie_names = {c["name"] for c in driver.get_cookies()}
    assert "access_token" in cookie_names
    assert "refresh_token" in cookie_names
