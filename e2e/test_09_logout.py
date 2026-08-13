from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

from conftest import BASE_URL, assert_page_healthy, screenshot


def test_logout_clears_session(driver):
    driver.get(f"{BASE_URL}/settings")
    WebDriverWait(driver, 15).until(
        EC.element_to_be_clickable((By.XPATH, "//button[normalize-space()='Se déconnecter']"))
    ).click()

    WebDriverWait(driver, 15).until(lambda d: "/login" in d.current_url)
    assert_page_healthy(driver)
    screenshot(driver, "09_logged_out")

    cookie_names = {c["name"] for c in driver.get_cookies()}
    assert "access_token" not in cookie_names
