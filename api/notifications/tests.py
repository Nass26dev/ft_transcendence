import pytest
from django.urls import reverse

from notifications.models import Notification
from notifications.services import notify


# ── Modèle ───────────────────────────────────────────────────────────

@pytest.mark.django_db
def test_notification_str(user):
    notif = Notification.objects.create(recipient=user, type="dm", message="Salut !")
    assert str(notif) == f"[dm] -> {user.id}: Salut !"


@pytest.mark.django_db
def test_notifications_ordered_most_recent_first(user):
    first = Notification.objects.create(recipient=user, type="dm", message="1")
    second = Notification.objects.create(recipient=user, type="dm", message="2")
    ids = list(Notification.objects.filter(recipient=user).values_list("id", flat=True))
    assert ids == [second.id, first.id]


# ── services.notify ──────────────────────────────────────────────────

@pytest.mark.django_db
def test_notify_creates_notification(user, other_user):
    notif = notify(user.id, "friend_request", "Demande reçue", url="/friends", actor=other_user)
    assert notif is not None
    assert notif.recipient_id == user.id
    assert notif.actor_id == other_user.id
    assert notif.message == "Demande reçue"
    assert notif.url == "/friends"
    assert notif.is_read is False


@pytest.mark.django_db
def test_notify_skips_self_notification(user):
    result = notify(user.id, "friend_request", "Auto", actor=user)
    assert result is None
    assert not Notification.objects.filter(recipient=user).exists()


@pytest.mark.django_db
def test_notify_allows_actorless_notification(user):
    notif = notify(user.id, "bet_settled", "Pari réglé")
    assert notif is not None
    assert notif.actor is None


# ── NotificationListView ─────────────────────────────────────────────

@pytest.mark.django_db
def test_list_requires_auth(api_client):
    resp = api_client.get(reverse("notification-list"))
    assert resp.status_code == 401


@pytest.mark.django_db
def test_list_only_own_notifications(auth_client, user, other_user):
    Notification.objects.create(recipient=user, type="dm", message="mine")
    Notification.objects.create(recipient=other_user, type="dm", message="theirs")

    resp = auth_client.get(reverse("notification-list"))
    assert resp.status_code == 200
    assert len(resp.data["results"]) == 1
    assert resp.data["results"][0]["message"] == "mine"


@pytest.mark.django_db
def test_list_reports_unread_count(auth_client, user):
    Notification.objects.create(recipient=user, type="dm", message="a", is_read=False)
    Notification.objects.create(recipient=user, type="dm", message="b", is_read=True)

    resp = auth_client.get(reverse("notification-list"))
    assert resp.data["unread"] == 1


@pytest.mark.django_db
def test_list_limited_to_30(auth_client, user):
    for i in range(35):
        Notification.objects.create(recipient=user, type="dm", message=f"n{i}")
    resp = auth_client.get(reverse("notification-list"))
    assert len(resp.data["results"]) == 30
    assert resp.data["unread"] == 35


# ── MarkAllReadView ──────────────────────────────────────────────────

@pytest.mark.django_db
def test_mark_all_read_requires_auth(api_client):
    resp = api_client.post(reverse("notification-read-all"))
    assert resp.status_code == 401


@pytest.mark.django_db
def test_mark_all_read_updates_only_own(auth_client, user, other_user):
    Notification.objects.create(recipient=user, type="dm", message="a")
    theirs = Notification.objects.create(recipient=other_user, type="dm", message="b")

    resp = auth_client.post(reverse("notification-read-all"))
    assert resp.status_code == 200
    assert resp.data["unread"] == 0
    assert not Notification.objects.filter(recipient=user, is_read=False).exists()
    theirs.refresh_from_db()
    assert theirs.is_read is False


# ── MarkReadView ─────────────────────────────────────────────────────

@pytest.mark.django_db
def test_mark_read_success(auth_client, user):
    notif = Notification.objects.create(recipient=user, type="dm", message="a")
    resp = auth_client.post(reverse("notification-read", args=[notif.id]))
    assert resp.status_code == 200
    assert resp.data["updated"] == 1
    assert resp.data["unread"] == 0
    notif.refresh_from_db()
    assert notif.is_read is True


@pytest.mark.django_db
def test_mark_read_other_users_notification_not_updated(auth_client, other_user):
    notif = Notification.objects.create(recipient=other_user, type="dm", message="a")
    resp = auth_client.post(reverse("notification-read", args=[notif.id]))
    assert resp.status_code == 200
    assert resp.data["updated"] == 0
    notif.refresh_from_db()
    assert notif.is_read is False


@pytest.mark.django_db
def test_mark_read_already_read_is_noop(auth_client, user):
    notif = Notification.objects.create(recipient=user, type="dm", message="a", is_read=True)
    resp = auth_client.post(reverse("notification-read", args=[notif.id]))
    assert resp.data["updated"] == 0
