from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

from conftest import BASE_URL, assert_page_healthy, screenshot


def test_friends_search(driver):
    driver.get(f"{BASE_URL}/friends")
    search = WebDriverWait(driver, 15).until(
        EC.presence_of_element_located(
            (By.CSS_SELECTOR, "input[placeholder='Rechercher par pseudo ou email…']")
        )
    )
    assert_page_healthy(driver)
    search.send_keys("kop")
    screenshot(driver, "07_friends_search")


def test_chat_page_loads(driver):
    driver.get(f"{BASE_URL}/chat")
    WebDriverWait(driver, 15).until(lambda d: d.execute_script("return document.readyState") == "complete")
    assert_page_healthy(driver)
    screenshot(driver, "07_chat")
