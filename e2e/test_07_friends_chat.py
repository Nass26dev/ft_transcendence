"""Étape 7 : recherche d'amis et messagerie."""
from helpers import assert_page_healthy, css, fill, screenshot, visit, wait_present


def test_friends_search(driver, logged_in):
    visit(driver, "/friends")
    search = wait_present(driver, css("input[placeholder='Rechercher par pseudo ou email…']"))
    assert_page_healthy(driver)
    fill(driver, search, "kop")
    screenshot(driver, "07_friends_search")


def test_chat_page_loads(driver, logged_in):
    visit(driver, "/chat")
    assert_page_healthy(driver)
    screenshot(driver, "07_chat")
