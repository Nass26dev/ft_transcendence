"""Étape 8 : modification du profil depuis les paramètres."""
from helpers import (
    assert_page_healthy,
    button,
    css,
    click,
    fill,
    screenshot,
    visit,
    wait,
    wait_present,
    wait_text,
)


def test_settings_edit_bio(driver, logged_in):
    visit(driver, "/settings")
    bio = wait_present(driver, css("textarea[placeholder='Quelques mots sur toi…']"))
    assert_page_healthy(driver)

    # Le formulaire est monté avant que le profil ne soit chargé, et se remplit
    # à l'arrivée des données. On attend donc que le pseudo soit renseigné :
    # taper avant reviendrait à courir contre le chargement.
    wait(driver).until(
        lambda d: bool(
            d.find_element(*css("input[placeholder='pseudo']")).get_attribute("value")
        )
    )

    fill(driver, bio, "Compte créé par la suite E2E Selenium.", clear=True)
    screenshot(driver, "08_settings_form")

    click(driver, button("Enregistrer"))

    wait_text(driver, "Profil mis à jour", timeout=10)
    screenshot(driver, "08_settings_saved")
