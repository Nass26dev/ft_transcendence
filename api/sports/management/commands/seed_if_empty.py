from django.core.management.base import BaseCommand

from sports.models import Match


class Command(BaseCommand):
    help = (
        "Si la base ne contient aucun match, enchaîne les tâches de scraping "
        "historique (J-1000→J-1) puis à venir (J+1→J+7) dans Celery. "
        "À appeler au démarrage du conteneur : la base fraîche se peuple seule."
    )

    def handle(self, *args, **options):
        if Match.objects.exists():
            self.stdout.write("Matchs déjà présents — seed ignoré.")
            return

        # Import tardif : évite de charger Celery si la base n'est pas vide.
        from celery import chain
        from sports.tasks import scrape_history, scrape_upcoming

        try:
            # On enchaîne history PUIS upcoming. scrape_upcoming calcule les cotes
            # des matchs à venir à partir de la « forme » (les 10 derniers matchs
            # terminés de chaque équipe). Il faut donc que TOUT l'historique soit
            # chargé avant, sinon les équipes sont vues comme inconnues (force
            # neutre) et les cotes sortent génériques. chain() ne lance upcoming
            # que si history s'est terminé sans erreur ; .si() (signature
            # immuable) évite que upcoming reçoive le retour de history.
            chain(scrape_history.s(), scrape_upcoming.si())()
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
                "Base vide → scrape_history puis scrape_upcoming enchaînées dans Celery "
                "(upcoming attend la fin de history pour des cotes correctes)."
            )
        )
