"""Accès simultanés : le sujet exige qu'aucune course ne corrompe les données.

Ces tests lancent de vrais threads contre la vraie base (pas de mock, pas de
transaction de test enveloppante, d'où `transaction=True`) pour vérifier que
les verrous `select_for_update()` tiennent réellement leur promesse.

Sans ces verrous, chaque scénario ci-dessous produit le bug classique du
read-modify-write : deux requêtes lisent le même solde, chacune calcule à
partir de cette valeur périmée, et la seconde écriture écrase la première.
"""
import threading
from decimal import Decimal

import pytest
from django.db import connection

from users.models import User


def _run_in_parallel(target, count):
    """Exécute `target` dans `count` threads lancés ensemble, et renvoie les résultats.

    Chaque thread ferme sa connexion en sortant : Django en ouvre une par
    thread, et une connexion laissée ouverte bloquerait la destruction de la
    base de test.
    """
    results = []
    lock = threading.Lock()
    ready = threading.Barrier(count)

    def wrapper(index):
        try:
            ready.wait()  # maximise le recouvrement réel des requêtes
            outcome = target(index)
            with lock:
                results.append(outcome)
        finally:
            connection.close()

    threads = [threading.Thread(target=wrapper, args=(i,)) for i in range(count)]
    for t in threads:
        t.start()
    for t in threads:
        t.join(timeout=30)
    return results


@pytest.mark.django_db(transaction=True)
def test_daily_bonus_cannot_be_claimed_twice_simultaneously():
    """Deux clics simultanés sur le bonus quotidien ne créditent qu'une fois."""
    from rest_framework.test import APIClient

    user = User.objects.create_user(
        email="race1@example.com", username="race1", password="Testpassword123"
    )
    user.refresh_from_db()  # le defaut du modele est un float tant qu'il n'a pas fait l'aller-retour
    start = user.wallet

    def claim(_):
        client = APIClient()
        client.force_authenticate(user=user)
        return client.post("/api/daily-bonus/").status_code

    codes = _run_in_parallel(claim, 4)

    assert sorted(codes) == [200, 400, 400, 400], f"statuts obtenus : {codes}"
    user.refresh_from_db()
    assert user.wallet == start + Decimal("500")


@pytest.mark.django_db(transaction=True)
def test_wheel_cannot_be_spun_twice_simultaneously():
    """La roue quotidienne ne part qu'une fois, même sur double requête."""
    from rest_framework.test import APIClient

    user = User.objects.create_user(
        email="race2@example.com", username="race2", password="Testpassword123"
    )

    def spin(_):
        client = APIClient()
        client.force_authenticate(user=user)
        return client.post("/api/wheel/spin/").status_code

    codes = _run_in_parallel(spin, 4)

    assert codes.count(200) == 1, f"statuts obtenus : {codes}"
    user.refresh_from_db()
    assert user.last_wheel_spin is not None


@pytest.mark.django_db(transaction=True)
def test_concurrent_bets_cannot_overspend_the_wallet():
    """Le solde ne peut jamais passer sous zéro, même sur paris simultanés.

    L'utilisateur a 100 Kops et tente quatre paris de 40 en parallèle : au
    plus deux peuvent aboutir, et le solde final doit rester cohérent avec le
    nombre exact de paris acceptés.
    """
    from django.utils import timezone
    from datetime import timedelta

    from betting.models import Bet
    from betting.serializers import BetSerializer
    from sports.models import Competition, Match, Odds, Sport, Team

    sport = Sport.objects.create(name="Football", slug="football")
    comp = Competition.objects.create(
        sport=sport, name="Ligue 1", slug="ligue-1", season="2025"
    )
    home = Team.objects.create(competition=comp, name="Paris SG")
    away = Team.objects.create(competition=comp, name="Marseille")
    match = Match.objects.create(
        competition=comp,
        home_team=home,
        away_team=away,
        kickoff_at=timezone.now() + timedelta(days=1),
        status="scheduled",
        external_id="ext-race-1",
    )
    Odds.objects.create(match=match, market="1N2", selection="home", value=Decimal("2.00"))

    user = User.objects.create_user(
        email="race3@example.com", username="race3", password="Testpassword123"
    )
    User.objects.filter(pk=user.pk).update(wallet=Decimal("100.00"))

    payload = {
        "stake": "40.00",
        "legs": [{"match": match.id, "selection": "home"}],
    }

    def place(_):
        serializer = BetSerializer(data=payload)
        if not serializer.is_valid():
            return "invalid"
        try:
            serializer.save(user=user)
            return "ok"
        except Exception:
            return "refused"

    outcomes = _run_in_parallel(place, 4)

    accepted = outcomes.count("ok")
    user.refresh_from_db()

    assert accepted <= 2, f"trop de paris acceptés : {outcomes}"
    assert user.wallet >= 0, "le solde est passé sous zéro"
    assert user.wallet == Decimal("100.00") - Decimal("40.00") * accepted
    assert Bet.objects.filter(user=user).count() == accepted
