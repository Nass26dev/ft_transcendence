import requests
import os
from django.core.management.base import BaseCommand
from datetime import datetime, timedelta
from matches.models import Match

class Command(BaseCommand):
    help = 'Récupère les matchs de la semaine depuis l\'API'

    # def handle(self, *args, **options):
    #     today = datetime.now().date()
    #     next_week = today + timedelta(days=30)
        
    #     url = "https://api.football-data.org/v4/competitions/CL/matches"
    #     params = {
    #         'dateFrom': today.strftime('%Y-%m-%d'),
    #         'dateTo': next_week.strftime('%Y-%m-%d')
    #     }
    #     headers = { 'X-Auth-Token': os.getenv('FOOTBALL_DATA_API') }

    def handle(self, *args, **options):
        today = datetime.now().date()
        past_week = today - timedelta(days=30)
        
        url = "https://api.football-data.org/v4/competitions/CL/matches"
        params = {
            'dateFrom': past_week.strftime('%Y-%m-%d'),
            'dateTo': today.strftime('%Y-%m-%d'),
        }
        headers = { 'X-Auth-Token': os.getenv('FOOTBALL_DATA_API') }

        self.stdout.write("Connexion à l'API...")
        
        try:
            response = requests.get(url, headers=headers, params=params)
            data = response.json()
            matches = data.get('matches', [])

            count = 0
            for m in matches:
                obj, created = Match.objects.update_or_create(
                    id_api=m['id'],
                    defaults={
                        'competition': m['competition']['name'],
                        'status': m['status'].lower(),
                        'time': m['utcDate'],
                        'home_team': m['homeTeam']['name'],
                        'away_team': m['awayTeam']['name'],
                        'home_score': m['score']['fullTime']['home'],
                        'away_score': m['score']['fullTime']['away'],
                    }
                )
                count += 1

            self.stdout.write(self.style.SUCCESS(f"Terminé : {count} matchs mis à jour."))

        except Exception as e:
            self.stderr.write(self.style.ERROR(f"Erreur : {e}"))