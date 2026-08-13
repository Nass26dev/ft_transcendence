from selenium.common.exceptions import TimeoutException
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

from conftest import BASE_URL, assert_page_healthy, screenshot


def test_home_dismisses_onboarding_and_loads(driver):
    driver.get(f"{BASE_URL}/")
    assert_page_healthy(driver)

    # Premier login : la modale d'onboarding s'affiche (bouton "Passer"
    # toujours visible, quelle que soit l'étape). On la ferme si présente.
    try:
        skip = WebDriverWait(driver, 8).until(
            EC.element_to_be_clickable((By.XPATH, "//button[normalize-space()='Passer']"))
        )
        screenshot(driver, "03_home_onboarding")
        skip.click()
    except TimeoutException:
        pass

    WebDriverWait(driver, 10).until(
        EC.invisibility_of_element_located((By.XPATH, "//button[normalize-space()='Passer']"))
    )
    screenshot(driver, "03_home")

    # Nav principale : les routes clés doivent être présentes dans le DOM.
    for href in ("/live", "/matches", "/tickets", "/chat", "/friends", "/leagues"):
        assert driver.find_elements(By.CSS_SELECTOR, f"a[href='{href}']"), f"lien {href} introuvable dans la nav"
