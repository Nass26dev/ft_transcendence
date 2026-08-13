"""Étape 1 : création du compte utilisé par tout le reste du parcours."""
from urllib.parse import parse_qs, urlparse

from helpers import (
    assert_page_healthy,
    button,
    css,
    click,
    fill,
    screenshot,
    visit,
    wait_present,
    wait_text,
    wait_url_contains,
)


def test_register_creates_account(driver, credentials):
    visit(driver, "/register")
    wait_present(driver, css("input[type=email]"))
    assert_page_healthy(driver)
    screenshot(driver, "01_register_form")

    fill(driver, css("input[type=email]"), credentials["email"])

    passwords = driver.find_elements(*css("input[type=password]"))
    assert len(passwords) == 2, "Formulaire d'inscription : 2 champs mot de passe attendus"
    fill(driver, passwords[0], credentials["password"])
    fill(driver, passwords[1], credentials["password"])

    click(driver, button("S'inscrire"))

    wait_text(driver, "Compte créé")
    screenshot(driver, "01_register_success")

    # Le front redirige vers /login avec l'email pré-rempli (URL-encodé :
    # le « @ » devient %40, d'où la comparaison sur la query décodée).
    wait_url_contains(driver, "/login")
    query = parse_qs(urlparse(driver.current_url).query)
    assert query.get("email") == [credentials["email"]]
