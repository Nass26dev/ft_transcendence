from django.db import migrations


CHALLENGES = [
    # Quotidiens
    dict(code="daily-place-3", kind="daily", icon="🎯", title="Place 3 paris aujourd'hui",
         description="Toutes ligues confondues", metric="bets_today", target=3, reward=500, order=1),
    dict(code="daily-win-1", kind="daily", icon="✅", title="Gagne un pari aujourd'hui",
         description="Un pari réglé gagnant", metric="wins_today", target=1, reward=800, order=2),
    dict(code="daily-streak-5", kind="daily", icon="🔥", title="Streak de 5",
         description="5 victoires d'affilée", metric="current_streak", target=5, reward=1500, order=3),
    # Saison
    dict(code="season-first-win", kind="season", icon="🌟", title="Premier pari gagnant",
         description="Gagne ton tout premier pari", metric="wins_total", target=1, reward=5000, order=1),
    dict(code="season-streak-10", kind="season", icon="🔥", title="Streak hot",
         description="10 victoires d'affilée", metric="current_streak", target=10, reward=10000, order=2),
    dict(code="season-veteran", kind="season", icon="🏆", title="Parieur assidu",
         description="Place 50 paris au total", metric="bets_total", target=50, reward=25000, order=3),
]

BADGES = [
    dict(code="first-bet", emoji="🎲", name="Premier pari", description="Place ton premier pari",
         metric="bets_total", threshold=1, order=1),
    dict(code="sniper", emoji="🎯", name="Sniper", description="10 paris gagnés",
         metric="wins_total", threshold=10, order=2),
    dict(code="on-fire", emoji="🔥", name="En feu", description="Streak de 5",
         metric="current_streak", threshold=5, order=3),
    dict(code="big-hit", emoji="💥", name="Gros coup", description="Un gain à une cote ≥ 5",
         metric="biggest_win_odd", threshold=5, order=4),
    dict(code="veteran", emoji="🦅", name="Vétéran", description="50 paris placés",
         metric="bets_total", threshold=50, order=5),
    dict(code="legend", emoji="🔒", name="Légende", description="À débloquer…",
         metric="wins_total", threshold=1000, order=6),
]


def seed(apps, schema_editor):
    Challenge = apps.get_model("challenges", "Challenge")
    Badge = apps.get_model("challenges", "Badge")
    for c in CHALLENGES:
        Challenge.objects.update_or_create(code=c["code"], defaults=c)
    for b in BADGES:
        Badge.objects.update_or_create(code=b["code"], defaults=b)


def unseed(apps, schema_editor):
    apps.get_model("challenges", "Challenge").objects.all().delete()
    apps.get_model("challenges", "Badge").objects.all().delete()


class Migration(migrations.Migration):
    dependencies = [("challenges", "0001_initial")]
    operations = [migrations.RunPython(seed, unseed)]
