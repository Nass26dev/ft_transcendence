from django.db import migrations
from django.db.models import Count


def merge_duplicate_teams(apps, schema_editor):
    """Fusionne les équipes en double sur (competition, name).

    Des tâches de scraping concurrentes pouvaient créer plusieurs Team
    identiques (get_or_create sans contrainte d'unicité). On garde la plus
    ancienne (plus petit id), on y rattache ses matchs, puis on supprime les
    doublons — préalable indispensable à la contrainte d'unicité (0005).
    """
    Team = apps.get_model("sports", "Team")
    Match = apps.get_model("sports", "Match")

    dups = (
        Team.objects.values("competition_id", "name")
        .annotate(n=Count("id"))
        .filter(n__gt=1)
    )
    for d in dups:
        rows = list(
            Team.objects.filter(
                competition_id=d["competition_id"], name=d["name"]
            ).order_by("id")
        )
        canonical, extras = rows[0], rows[1:]
        extra_ids = [t.id for t in extras]
        Match.objects.filter(home_team_id__in=extra_ids).update(home_team=canonical)
        Match.objects.filter(away_team_id__in=extra_ids).update(away_team=canonical)
        Team.objects.filter(id__in=extra_ids).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("sports", "0003_match_detail_url_match_details_fetched_at_and_more"),
    ]

    operations = [
        migrations.RunPython(merge_duplicate_teams, migrations.RunPython.noop),
    ]
