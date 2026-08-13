"""Étape 5 : création d'une ligue privée."""
import uuid

from helpers import (
    assert_page_healthy,
    button,
    button_containing,
    css,
    click,
    fill,
    screenshot,
    visit,
    wait_present,
    wait_text,
)


def test_create_league(driver, logged_in):
    league_name = f"E2E-{uuid.uuid4().hex[:8]}"

    visit(driver, "/leagues")
    assert_page_healthy(driver)
    click(driver, button_containing("Créer une ligue"))

    name_input = wait_present(driver, css("input[maxlength='20']"), timeout=10)
    screenshot(driver, "05_league_modal")
    fill(driver, name_input, league_name)
    fill(driver, css("textarea[maxlength='100']"), "Ligue créée par le test E2E.")
    click(driver, button("Créer"))

    wait_text(driver, league_name)
    screenshot(driver, "05_league_created")
