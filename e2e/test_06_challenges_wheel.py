from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

from conftest import BASE_URL, assert_page_healthy, screenshot


def test_challenges_page_loads(driver):
    driver.get(f"{BASE_URL}/challenges")
    WebDriverWait(driver, 15).until(lambda d: d.execute_script("return document.readyState") == "complete")
    assert_page_healthy(driver)
    screenshot(driver, "06_challenges")


def test_wheel_spin(driver):
    driver.get(f"{BASE_URL}/wheel")
    spin_button = WebDriverWait(driver, 15).until(
        EC.element_to_be_clickable((By.XPATH, "//button[normalize-space()='Tourner la roue']"))
    )
    assert_page_healthy(driver)
    screenshot(driver, "06_wheel_before")

    spin_button.click()
    WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.XPATH, "//button[normalize-space()='La roue tourne…']"))
    )
    # SPIN_MS = 5200 côté front : on attend que la roue s'arrête et que le
    # bouton repasse en état final ("Reviens demain", spin quotidien consommé).
    WebDriverWait(driver, 15).until(
        EC.presence_of_element_located((By.XPATH, "//button[normalize-space()='Reviens demain']"))
    )
    screenshot(driver, "06_wheel_after")
