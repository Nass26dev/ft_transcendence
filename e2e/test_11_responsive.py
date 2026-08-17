"""Étape 11 : la mise en page tient sur toutes les tailles d'écran.

Le sujet demande un frontend « clear, responsive, and accessible across all
devices ». Le symptôme le plus visible d'un responsive cassé est le
débordement horizontal : la page devient plus large que la fenêtre et
l'utilisateur doit scroller latéralement. C'est ce qu'on mesure ici.
"""
import pytest

from helpers import assert_page_healthy, visit

VIEWPORTS = {
    "mobile": (390, 844),      # iPhone 14
    "tablette": (768, 1024),   # iPad portrait
    "desktop": (1440, 900),
}

PAGES = ["/login", "/", "/matches", "/leagues", "/friends", "/settings"]

# Marge d'un pixel : les arrondis sub-pixel du navigateur peuvent produire un
# scrollWidth supérieur d'une fraction de pixel sans débordement réel.
TOLERANCE_PX = 1


@pytest.fixture
def viewport(driver):
    """Restaure la taille de fenêtre par défaut après le test."""
    yield
    driver.set_window_size(1440, 1000)


@pytest.mark.parametrize("size_name", list(VIEWPORTS))
def test_no_horizontal_overflow(driver, logged_in, viewport, size_name):
    width, height = VIEWPORTS[size_name]
    driver.set_window_size(width, height)

    overflowing = []
    for path in PAGES:
        visit(driver, path)
        assert_page_healthy(driver)
        scroll_width, inner_width = driver.execute_script(
            "return [document.documentElement.scrollWidth, window.innerWidth]"
        )
        if scroll_width > inner_width + TOLERANCE_PX:
            overflowing.append(f"{path} : {scroll_width}px de contenu pour {inner_width}px de fenêtre")

    assert not overflowing, f"Débordement horizontal en {size_name} :\n" + "\n".join(overflowing)
