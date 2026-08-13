from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

from conftest import BASE_URL, assert_page_healthy, get_otp_code, screenshot


def test_login_with_two_factor_code(driver, credentials):
    # On enchaîne depuis la redirection de l'inscription (/login?email=...) ;
    # si ce test est relancé seul, on y va directement.
    if "/login" not in driver.current_url:
        driver.get(f"{BASE_URL}/login?email={credentials['email']}")

    WebDriverWait(driver, 15).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "input[type=password]"))
    )
    assert_page_healthy(driver)

    email_field = driver.find_element(By.CSS_SELECTOR, "input[type=email]")
    if email_field.get_attribute("value") != credentials["email"]:
        email_field.clear()
        email_field.send_keys(credentials["email"])
    driver.find_element(By.CSS_SELECTOR, "input[type=password]").send_keys(credentials["password"])
    screenshot(driver, "02_login_step1")

    driver.find_element(By.XPATH, "//button[normalize-space()='Recevoir le code']").click()

    otp_input = WebDriverWait(driver, 15).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "input[maxlength='6']"))
    )
    screenshot(driver, "02_login_step2")

    code = get_otp_code(credentials["email"])
    otp_input.send_keys(code)
    driver.find_element(By.XPATH, "//button[normalize-space()='Vérifier le code']").click()

    WebDriverWait(driver, 15).until(EC.url_matches(rf"{BASE_URL}/?$"))
    assert_page_healthy(driver)
    screenshot(driver, "02_login_success")

    cookie_names = {c["name"] for c in driver.get_cookies()}
    assert "access_token" in cookie_names
    assert "refresh_token" in cookie_names
