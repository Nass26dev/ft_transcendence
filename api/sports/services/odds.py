# sports/services/odds.py
import logging
from decimal import Decimal

from django.db.models import Q

from sports.models import Match, Odds

logger = logging.getLogger(__name__)

# ── Paramètres de l'algo ──────────────────────────────────────────
FORM_WINDOW = 10        # nombre de derniers matchs analysés par équipe
HOME_ADVANTAGE = 0.15   # bonus de force pour l'équipe à domicile
MARGIN = 0.07           # overround bookmaker (~7 %)
MIN_PROB = 0.05         # plancher de proba par issue (évite cotes absurdes)


def _team_strength(team, before) -> float:
    """Force d'une équipe sur ses FORM_WINDOW derniers matchs terminés
    avant la date `before`. Renvoie une moyenne de points par match (0–3)."""
    recent = (
        Match.objects
        .filter(status="finished")
        .filter(Q(home_team=team) | Q(away_team=team))
        .filter(kickoff_at__lt=before)
        .order_by("-kickoff_at")[:FORM_WINDOW]
    )

    points, played = 0, 0
    for m in recent:
        if m.home_score is None or m.away_score is None:
            continue
        played += 1
        is_home = m.home_team_id == team.id
        gf = m.home_score if is_home else m.away_score
        ga = m.away_score if is_home else m.home_score
        if gf > ga:
            points += 3
        elif gf == ga:
            points += 1

    if played == 0:
        return 1.0  # équipe inconnue → force neutre
    return points / played


def _probabilities(home_strength: float, away_strength: float) -> dict:
    """Convertit deux forces en probabilités 1 / N / 2."""
    h = home_strength + HOME_ADVANTAGE
    a = away_strength
    total = h + a

    p_home = h / total
    p_away = a / total

    # le nul : d'autant plus probable que les deux forces sont proches
    gap = abs(h - a) / (total or 1)
    p_draw = max(0.18, 0.30 - gap)

    # renormalisation pour que la somme fasse 1
    p_home *= (1 - p_draw)
    p_away *= (1 - p_draw)

    probs = {"home": p_home, "draw": p_draw, "away": p_away}
    # plancher + renormalisation finale
    probs = {k: max(MIN_PROB, v) for k, v in probs.items()}
    s = sum(probs.values())
    return {k: v / s for k, v in probs.items()}


def _to_odds(prob: float) -> Decimal:
    """Probabilité → cote décimale, marge bookmaker appliquée."""
    fair = 1 / prob
    with_margin = fair / (1 + MARGIN)
    return Decimal(str(round(with_margin, 2)))


def compute_match_odds(match: Match) -> dict:
    """Calcule et upsert les cotes 1N2 d'un match. Renvoie les cotes."""
    home_s = _team_strength(match.home_team, match.kickoff_at)
    away_s = _team_strength(match.away_team, match.kickoff_at)

    probs = _probabilities(home_s, away_s)
    odds = {sel: _to_odds(p) for sel, p in probs.items()}

    for selection, value in odds.items():
        Odds.objects.update_or_create(
            match=match,
            market="1N2",
            selection=selection,
            defaults={"value": value},
        )

    # logger.info(
    #     "Cotes %s — %s/%s/%s",
    #     match, odds["home"], odds["draw"], odds["away"],
    # )
    return odds


def compute_odds_for_queryset(qs) -> int:
    """Calcule les cotes pour un ensemble de matchs. Renvoie le nombre traité."""
    count = 0
    for match in qs.select_related("home_team", "away_team"):
        compute_match_odds(match)
        count += 1
    return count