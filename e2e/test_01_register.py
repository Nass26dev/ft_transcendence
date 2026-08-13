from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

from conftest import BASE_URL, assert_page_healthy, screenshot


def test_register_creates_account(driver, credentials):
    driver.get(f"{BASE_URL}/register")
    WebDriverWait(driver, 15).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "input[type=email]"))
    )
    assert_page_healthy(driver)
    screenshot(driver, "01_register_form")

    driver.find_element(By.CSS_SELECTOR, "input[type=email]").send_keys(credentials["email"])
    passwords = driver.find_elements(By.CSS_SELECTOR, "input[type=password]")
    assert len(passwords) == 2, "Formulaire d'inscription : 2 champs mot de passe attendus"
    passwords[0].send_keys(credentials["password"])
    passwords[1].send_keys(credentials["password"])

    driver.find_element(By.XPATH, "//button[normalize-space()=\"S'inscrire\"]").click()

    WebDriverWait(driver, 15).until(
        EC.text_to_be_present_in_element((By.TAG_NAME, "body"), "Compte créé")
    )
    screenshot(driver, "01_register_success")

    WebDriverWait(driver, 15).until(lambda d: "/login" in d.current_url)
    assert credentials["email"] in driver.current_url
