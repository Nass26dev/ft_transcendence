"""Étape 4 : pages live/matchs et placement d'un pari réel."""
import time

import pytest
from selenium.common.exceptions import NoSuchElementException, StaleElementReferenceException

from helpers import (
    assert_page_healthy,
    button_containing,
    css,
    click,
    screenshot,
    visit,
    wait_clickable,
    wait_present,
    wait_text,
)


def test_live_page_loads(driver, logged_in):
    visit(driver, "/live")
    assert_page_healthy(driver)
    screenshot(driver, "04_live")


def test_matches_page_loads(driver, logged_in):
    visit(driver, "/matches")
    assert_page_healthy(driver)
    screenshot(driver, "04_matches")


def _first_priced_odd(driver):
    """Première cote cliquable affichant un vrai nombre (et non "-")."""
    for pill in driver.find_elements(*css("[data-odd-pill]")):
        try:
            value = pill.find_element(*css(".tnum")).text.strip()
        except (NoSuchElementException, StaleElementReferenceException):
            continue
        if value and value != "-":
            return pill
    return None


def test_place_a_bet(driver, logged_in):
    """Place un pari réel si des cotes sont disponibles dans les données
    actuelles (scraping externe, non garanti) ; sinon le test est explicitement
    skippé plutôt que de simuler un faux succès.
    """
    visit(driver, "/matches")
    wait_present(driver, css("main"))

    # Les cotes arrivent match par match : on laisse le temps qu'au moins une
    # soit affichée avant de conclure qu'il n'y en a aucune.
    pill = None
    deadline = time.time() + 15
    while pill is None and time.time() < deadline:
        pill = _first_priced_odd(driver)
        if pill is None:
            time.sleep(0.5)
    if pill is None:
        pytest.skip("Aucune cote disponible dans les données actuelles.")

    click(driver, pill)

    confirm = button_containing("Placer le pari")
    wait_clickable(driver, confirm, timeout=10)
    screenshot(driver, "04_bet_slip_open")
    click(driver, confirm)

    wait_text(driver, "placé", timeout=10)
    screenshot(driver, "04_bet_placed")
