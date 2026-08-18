"""Recupere logos et couleurs officielles d'equipes depuis TheSportsDB.

API publique gratuite (cle de test "3", documentee et destinee aux projets
hobby/perso : https://www.thesportsdb.com/free_sports_api). On ne prend que
des donnees fournies par cette API sous licence pour cet usage, jamais du
scraping d'un site tiers (ex. operateur de paris) dont les logos de clubs
seraient utilises sans autorisation.

La recherche par nom de TheSportsDB est approximative (elle peut renvoyer un
club sans rapport en premiere position, ex. "Paris SG" -> "Torcy") : on ne
retient un resultat que si son nom (ou un de ses noms alternatifs) correspond
exactement, a la casse/accents pres, au nom cherche. Un club non trouve reste
avec logo_url vide, et le frontend retombe sur un maillot colore avec les
couleurs officielles si on les a, sinon un visuel generique : mieux vaut
moins d'infos qu'une info fausse.

La fiche club renvoyee par l'API contient aussi ses couleurs (strColour1/2) :
on les recupere dans la meme requete que le logo, sans cout supplementaire
de quota.

Les resultats sont mis en cache en base (logo_checked_at) : on ne re-interroge
que les equipes jamais verifiees, ou verifiees il y a plus de RECHECK_AFTER
(les clubs introuvables cote source ne le deviennent pas du jour au
lendemain, inutile de retenter a chaque passage).
"""
import logging
import time
import unicodedata
from datetime import timedelta

import requests
from django.db.models import Q
from django.utils import timezone

from sports.models import Match, Team

logger = logging.getLogger(__name__)

BASE_URL = "https://www.thesportsdb.com/api/v1/json/3"
HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; KopLogoFetcher/1.0)"}

REQUEST_DELAY = 1.2
BATCH_SIZE = 300
RECHECK_AFTER = timedelta(days=30)
RELEVANT_WINDOW = timedelta(days=14)


def _normalize(name: str) -> str:
    """Casse/accents/ponctuation insensible, pour comparer des noms de club
    (ex. "Paris Saint-Germain" vs "Paris Saint Germain")."""
    decomposed = unicodedata.normalize("NFKD", name)
    ascii_only = decomposed.encode("ascii", "ignore").decode()
    for sep in ("-", ".", "'"):
        ascii_only = ascii_only.replace(sep, " ")
    return " ".join(ascii_only.lower().split())


def _search_team(name: str) -> dict | None:
    """Cherche un club par nom sur TheSportsDB, ne retient que les correspondances exactes.

    Renvoie {"badge": str|None, "color1": str, "color2": str} pour le club
    trouve, ou None si aucune correspondance exacte.

    La recherche cote API echoue souvent sur un nom contenant un tiret (ex.
    "Paris Saint-Germain" ne renvoie rien, "Paris Saint Germain" oui) : on
    interroge avec les tirets remplaces par des espaces.

    Leve requests.RequestException si l'API est indisponible/rate-limitee,
    pour que l'appelant distingue « pas trouve » (a ne pas retenter tout de
    suite) de « on n'a pas pu verifier » (a retenter au prochain passage).
    """
    query = name.replace("-", " ")
    resp = requests.get(f"{BASE_URL}/searchteams.php", params={"t": query}, headers=HEADERS, timeout=10)
    resp.raise_for_status()
    data = resp.json() or {}

    target = _normalize(name)
    for team in data.get("teams") or []:
        candidates = [team.get("strTeam", "")] + (team.get("strTeamAlternate") or "").split(",")
        if any(_normalize(c) == target for c in candidates if c):
            return {
                "badge": team.get("strBadge") or None,
                "color1": team.get("strColour1") or "",
                "color2": team.get("strColour2") or "",
            }
    return None


def _relevant_team_ids() -> set[int]:
    """Equipes dont un match se joue dans la fenetre recente/a venir (RELEVANT_WINDOW)."""
    now = timezone.now()
    matches = Match.objects.filter(kickoff_at__range=(now - RELEVANT_WINDOW, now + RELEVANT_WINDOW))
    return set(matches.values_list("home_team_id", flat=True)) | set(
        matches.values_list("away_team_id", flat=True)
    )


def fetch_team_logos() -> int:
    """Renseigne logo_url pour les equipes dues pour verification. Renvoie le nombre trouve.

    Priorise les equipes dont un match est affiche maintenant (RELEVANT_WINDOW =
    fenetre de 14 jours autour d'aujourd'hui), puis complete le lot (BATCH_SIZE =
    300 equipes par passage, le scheduler repassant chaque nuit) avec les autres
    equipes dues (le fond d'historique, qui peut monter a plusieurs milliers
    d'equipes jamais affichees). REQUEST_DELAY espace les requetes par politesse
    envers l'API gratuite. RECHECK_AFTER (30 jours) evite de retenter a chaque
    passage les clubs introuvables cote source. Si l'API devient
    indisponible/rate-limitee en cours de lot, le passage s'arrete
    immediatement sans marquer logo_checked_at pour l'equipe en cours (ni les
    suivantes) : elles restent dues et seront reverifiees au prochain passage,
    a la difference d'une equipe reellement introuvable cote source.
    """
    now = timezone.now()
    due = Team.objects.filter(
        Q(logo_url="")
        & (Q(logo_checked_at__isnull=True) | Q(logo_checked_at__lt=now - RECHECK_AFTER))
    )

    relevant_ids = _relevant_team_ids()
    teams = list(due.filter(id__in=relevant_ids).order_by("logo_checked_at")[:BATCH_SIZE])
    if len(teams) < BATCH_SIZE:
        seen_ids = {t.id for t in teams}
        remaining = BATCH_SIZE - len(teams)
        teams += list(
            due.exclude(id__in=seen_ids).order_by("logo_checked_at")[:remaining]
        )

    found = 0
    for i, team in enumerate(teams):
        try:
            result = _search_team(team.name)
        except requests.RequestException as exc:
            logger.warning("TheSportsDB indisponible pour %r : %s, arret du passage", team.name, exc)
            break

        team.logo_checked_at = timezone.now()
        if result:
            team.color_primary = result["color1"]
            team.color_secondary = result["color2"]
            if result["badge"]:
                team.logo_url = result["badge"]
                found += 1
        team.save(update_fields=["logo_url", "logo_checked_at", "color_primary", "color_secondary"])
        if i < len(teams) - 1:
            time.sleep(REQUEST_DELAY)

    if teams:
        logger.info("Logos d'equipes : %s/%s trouves", found, len(teams))
    return found
