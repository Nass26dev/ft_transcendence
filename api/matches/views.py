from django.shortcuts import render


from django.http import JsonResponse
from .models import Match

def get_matches(request):
    matches = Match.objects.all().order_by('time')
    data = []
    for m in matches:
        data.append({
            "id": m.id_api,
            "competition": m.competition,
            "status": m.status,
            "time": m.time.strftime('%H:%M'),
            "homeTeam": m.home_team,
            "awayTeam": m.away_team,
            "homeScore": m.home_score,
            "awayScore": m.away_score,
            "odds": [
                {"label": m.home_team, "value": "1.85"},
                {"label": "Match nul", "value": "3.40"},
                {"label": m.away_team, "value": "2.10", "hot": True},
            ]
        })
    return JsonResponse(data, safe=False)