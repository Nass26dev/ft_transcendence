from django.core.management.base import BaseCommand

from sports.models import Match


class Command(BaseCommand):
    """Amorce la base au démarrage si elle est vide de tout match.

    Si la base ne contient aucun match, enchaîne les tâches de scraping
    historique (J-1000→J-1) puis à venir (J+1→J+7) dans Celery.
    À appeler au démarrage du conteneur : la base fraîche se peuple seule.
    """

    help = (
        "Si la base ne contient aucun match, enchaîne les tâches de scraping "
        "historique (J-1000→J-1) puis à venir (J+1→J+7) dans Celery. "
        "À appeler au démarrage du conteneur : la base fraîche se peuple seule."
    )

    def handle(self, *args, **options):
        """Lance la chaîne history → upcoming si la base est vide.

        Import de Celery/tasks différé pour éviter de le charger si la base
        n'est pas vide. history doit impérativement précéder upcoming : ce
        dernier calcule les cotes à partir de la « forme » (10 derniers matchs
        terminés de chaque équipe), donc tant que l'historique n'est pas
        complet les équipes sont vues comme inconnues (force neutre) et les
        cotes sortent génériques. chain() ne lance upcoming que si history
        s'est terminé sans erreur ; .si() (signature immuable) évite que
        upcoming reçoive le retour de history. Si le broker est indisponible,
        l'échec est loggé sans faire échouer le démarrage du conteneur.
        """
        if Match.objects.exists():
            self.stdout.write("Matchs déjà présents : seed ignoré.")
            return

        from celery import chain
        from sports.tasks import scrape_history, scrape_upcoming

        try:
            chain(scrape_history.s(), scrape_upcoming.si())()
        except Exception as exc:
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
