from django.core.management.base import BaseCommand

from sports.models import Match


class Command(BaseCommand):
    help = (
        "Si la base ne contient aucun match, enfile les tâches de scraping "
        "historique (J-180→J-1) et à venir (J+1→J+7) dans Celery. "
        "À appeler au démarrage du conteneur : la base fraîche se peuple seule."
    )

    def handle(self, *args, **options):
        if Match.objects.exists():
            self.stdout.write("Matchs déjà présents — seed ignoré.")
            return

        # Import tardif : évite de charger Celery si la base n'est pas vide.
        from sports.tasks import scrape_history, scrape_upcoming

        try:
            # .delay() pousse simplement le message dans Redis ; le celery_worker
            # traite le scraping en arrière-plan (scrape_history est long, ~6 min).
            scrape_history.delay()
            scrape_upcoming.delay()
        except Exception as exc:  # broker indisponible : on ne casse pas le boot
            self.stderr.write(
                self.style.WARNING(
                    f"Base vide mais impossible d'enfiler les tâches de seed "
                    f"(broker indisponible ?) : {exc}"
                )
            )
            return

        self.stdout.write(
            self.style.SUCCESS(
                "Base vide → scrape_history et scrape_upcoming enfilées dans Celery."
            )
        )
