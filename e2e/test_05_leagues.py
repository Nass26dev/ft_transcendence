import uuid

from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

from conftest import BASE_URL, assert_page_healthy, screenshot


def test_create_league(driver):
    league_name = f"E2E-{uuid.uuid4().hex[:8]}"

    driver.get(f"{BASE_URL}/leagues")
    WebDriverWait(driver, 15).until(
        EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Créer une ligue')]"))
    ).click()
    assert_page_healthy(driver)

    name_input = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "input[maxlength='20']"))
    )
    screenshot(driver, "05_league_modal")
    name_input.send_keys(league_name)
    driver.find_element(By.CSS_SELECTOR, "textarea[maxlength='100']").send_keys(
        "Ligue créée par le test E2E."
    )
    driver.find_element(By.XPATH, "//button[normalize-space()='Créer']").click()

    WebDriverWait(driver, 15).until(
        EC.text_to_be_present_in_element((By.TAG_NAME, "body"), league_name)
    )
    screenshot(driver, "05_league_created")
