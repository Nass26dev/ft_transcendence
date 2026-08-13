"""Roue de la chance — configuration et tirage.

Une seule source de vérité pour les lots : l'ordre des cases (rendu visuel
côté front) ET les probabilités (poids) sont définis ici. Le backend renvoie
l'index de la case gagnante ; le front se contente d'animer la roue jusqu'à
cet index.

Les `weight` somment à 100 → ils se lisent directement en pourcentage.
Espérance de gain ≈ +314 Kops : la roue est légèrement favorable au joueur
(c'est un bonus quotidien ludique), avec un risque réel de perte et un
jackpot rare (1 %).
"""

WHEEL_SEGMENTS = [
    {"label": "JACKPOT", "amount": 10000, "weight": 1,  "kind": "jackpot"},
    {"label": "−250",    "amount": -250,  "weight": 8,  "kind": "loss"},
    {"label": "+500",    "amount": 500,   "weight": 14, "kind": "win"},
    {"label": "−100",    "amount": -100,  "weight": 12, "kind": "loss"},
    {"label": "+1000",   "amount": 1000,  "weight": 8,  "kind": "win"},
    {"label": "Rien",    "amount": 0,     "weight": 12, "kind": "neutral"},
    {"label": "+250",    "amount": 250,   "weight": 18, "kind": "win"},
    {"label": "−500",    "amount": -500,  "weight": 5,  "kind": "loss"},
    {"label": "+2000",   "amount": 2000,  "weight": 4,  "kind": "win"},
    {"label": "−1000",   "amount": -1000, "weight": 2,  "kind": "loss"},
    {"label": "+100",    "amount": 100,   "weight": 16, "kind": "win"},
]


def public_segments():
    """Cases telles qu'exposées au front (sans les poids, secret métier)."""
    return [
        {"label": s["label"], "amount": s["amount"], "kind": s["kind"]}
        for s in WHEEL_SEGMENTS
    ]


def spin():
    """Tire une case au hasard selon les poids. Renvoie (index, segment)."""
    import random

    weights = [s["weight"] for s in WHEEL_SEGMENTS]
    index = random.choices(range(len(WHEEL_SEGMENTS)), weights=weights, k=1)[0]
    return index, WHEEL_SEGMENTS[index]
