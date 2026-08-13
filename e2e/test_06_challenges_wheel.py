"""Étape 6 : page défis et spin quotidien de la roue."""
from helpers import (
    assert_page_healthy,
    button,
    click,
    screenshot,
    visit,
    wait_clickable,
    wait_present,
)


def test_challenges_page_loads(driver, logged_in):
    visit(driver, "/challenges")
    assert_page_healthy(driver)
    screenshot(driver, "06_challenges")


def test_wheel_spin(driver, logged_in):
    visit(driver, "/wheel")
    spin_button = button("Tourner la roue")
    wait_clickable(driver, spin_button)
    assert_page_healthy(driver)
    screenshot(driver, "06_wheel_before")

    click(driver, spin_button)
    wait_present(driver, button("La roue tourne…"), timeout=10)

    # SPIN_MS = 5200 côté front : on attend que la roue s'arrête et que le
    # bouton repasse en état final ("Reviens demain", spin quotidien consommé).
    wait_present(driver, button("Reviens demain"))
    screenshot(driver, "06_wheel_after")
