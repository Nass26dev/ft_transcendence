from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

from conftest import BASE_URL, assert_page_healthy, screenshot


def test_settings_edit_bio(driver):
    driver.get(f"{BASE_URL}/settings")
    bio = WebDriverWait(driver, 15).until(
        EC.presence_of_element_located(
            (By.CSS_SELECTOR, "textarea[placeholder='Quelques mots sur toi…']")
        )
    )
    assert_page_healthy(driver)
    bio.clear()
    bio.send_keys("Compte créé par la suite E2E Selenium.")
    screenshot(driver, "08_settings_form")

    driver.find_element(By.XPATH, "//button[normalize-space()='Enregistrer']").click()

    WebDriverWait(driver, 10).until(
        EC.text_to_be_present_in_element((By.TAG_NAME, "body"), "Profil mis à jour")
    )
    screenshot(driver, "08_settings_saved")
