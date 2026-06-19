# sports/services/odds.py
import logging
from decimal import Decimal
from math import exp

from django.db.models import Q

from sports.models import Match, Odds

logger = logging.getLogger(__name__)

# ── Paramètres de l'algo ──────────────────────────────────────────
FORM_WINDOW = 10        # nombre de derniers matchs analysés par équipe
HOME_ADVANTAGE = 0.15   # bonus de force pour l'équipe à domicile
MARGIN = 0.07           # overround bookmaker (~7 %)
MIN_PROB = 0.05         # plancher de proba par issue (évite cotes absurdes)

# ── Ajustement live (cotes en direct selon le score) ──────────────
LIVE_GOAL_SENSITIVITY = 0.55  # plus c'est haut, plus un but d'écart bouge la cote
LIVE_DRAW_BOOST = 0.25        # à égalité, prime au nul en fin de match


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


def _live_time_factor(minute) -> float:
    """Poids du score selon l'avancement : ~0.4 en début de match, 1.0 à la fin.
    Un but encaissé tôt est moins décisif qu'un but en fin de partie."""
    progress = min(max((minute or 0) / 90.0, 0.0), 1.0)
    return 0.4 + 0.6 * progress


def _apply_live_adjustment(probs: dict, home_score: int, away_score: int, minute) -> dict:
    """Réajuste les probabilités 1N2 d'un match EN COURS selon le score.
    Plus l'écart de buts est fort, plus la cote de l'équipe qui mène baisse
    (et celles du nul / de l'adversaire montent)."""
    diff = home_score - away_score
    t = _live_time_factor(minute)

    if diff == 0:
        # Match nul en cours : le nul devient plus probable au fil du temps.
        # On utilise l'avancement brut (≈0 en début de match) pour ne quasiment
        # rien bouger tant que le score est vierge tôt.
        progress = min(max((minute or 0) / 90.0, 0.0), 1.0)
        boost = LIVE_DRAW_BOOST * progress
        draw = probs["draw"] + boost * (1 - probs["draw"])
        rest = (probs["home"] + probs["away"]) or 1.0
        scale = (1 - draw) / rest
        adjusted = {"home": probs["home"] * scale, "draw": draw, "away": probs["away"] * scale}
    else:
        # Une équipe mène : elle absorbe une fraction de la proba (nul + adversaire),
        # d'autant plus grande que l'écart |diff| et le temps écoulé sont importants.
        strength = 1 - exp(-LIVE_GOAL_SENSITIVITY * abs(diff) * t)  # 0 → 1
        leader = "home" if diff > 0 else "away"
        other = "away" if diff > 0 else "home"

        transferred = strength * (probs["draw"] + probs[other])
        adjusted = {
            leader: probs[leader] + transferred,
            "draw": probs["draw"] * (1 - strength),
            other: probs[other] * (1 - strength),
        }

    # Plancher par issue + renormalisation (somme = 1).
    adjusted = {k: max(MIN_PROB, v) for k, v in adjusted.items()}
    s = sum(adjusted.values())
    return {k: v / s for k, v in adjusted.items()}


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

    # En direct : le score en cours fait bouger les cotes (plus l'écart est fort,
    # plus la cote de l'équipe qui mène baisse).
    if (
        match.status == "live"
        and match.home_score is not None
        and match.away_score is not None
    ):
        probs = _apply_live_adjustment(
            probs, match.home_score, match.away_score, match.current_minute
        )

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