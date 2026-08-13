"""Étape 8 : modification du profil depuis les paramètres."""
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
)


def test_settings_edit_bio(driver, logged_in):
    visit(driver, "/settings")
    bio = wait_present(driver, css("textarea[placeholder='Quelques mots sur toi…']"))
    assert_page_healthy(driver)

    fill(driver, bio, "Compte créé par la suite E2E Selenium.", clear=True)
    screenshot(driver, "08_settings_form")

    click(driver, button("Enregistrer"))

    wait_text(driver, "Profil mis à jour", timeout=10)
    screenshot(driver, "08_settings_saved")
