import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

from conftest import BASE_URL, assert_page_healthy, screenshot


def test_live_page_loads(driver):
    driver.get(f"{BASE_URL}/live")
    WebDriverWait(driver, 15).until(lambda d: d.execute_script("return document.readyState") == "complete")
    assert_page_healthy(driver)
    screenshot(driver, "04_live")


def test_matches_page_loads(driver):
    driver.get(f"{BASE_URL}/matches")
    WebDriverWait(driver, 15).until(lambda d: d.execute_script("return document.readyState") == "complete")
    assert_page_healthy(driver)
    screenshot(driver, "04_matches")


def _first_priced_odd(driver):
    """Premier <div data-odd-pill> dont la cote est un vrai nombre (pas "-")."""
    for pill in driver.find_elements(By.CSS_SELECTOR, "[data-odd-pill]"):
        value = pill.find_element(By.CSS_SELECTOR, ".tnum").text.strip()
        if value and value != "-":
            return pill
    return None


def test_place_a_bet(driver, credentials):
    """Place un pari réel si des cotes sont disponibles dans les données seed
    actuelles (scraping externe, non garanti) ; sinon le test est explicitement
    skippé plutôt que de simuler un faux succès.
    """
    driver.get(f"{BASE_URL}/matches")
    WebDriverWait(driver, 15).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "main"))
    )

    pill = _first_priced_odd(driver)
    if pill is None:
        pytest.skip("Aucune cote disponible dans les données seed actuelles.")

    pill.click()

    confirm = WebDriverWait(driver, 10).until(
        EC.element_to_be_clickable(
            (By.XPATH, "//button[starts-with(normalize-space(), 'Placer le pari')]")
        )
    )
    screenshot(driver, "04_bet_slip_open")
    confirm.click()

    toast = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'placé')]"))
    )
    assert "placé" in toast.text
    screenshot(driver, "04_bet_placed")
