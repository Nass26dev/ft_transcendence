import asyncio

import pytest
from channels.testing import WebsocketCommunicator
from django.contrib.auth.models import AnonymousUser

from chat.consumers import ChatConsumer, DMConsumer
from chat.models import Conversation, DirectMessage, Message
from league.models import League
from notifications.models import Notification

# chat/urls.py ne nomme aucune route (pas de `name=`) : chemins en dur.


@pytest.fixture
def league(user):
    league = League.objects.create(name="Kop Legends", description="d", creator=user)
    league.members.add(user)
    return league


@pytest.fixture
def conversation(user, other_user):
    return Conversation.get_or_create_between(user, other_user)


# ── Modèles ──────────────────────────────────────────────────────────

@pytest.mark.django_db
def test_message_str(league, user):
    msg = Message.objects.create(league=league, sender=user, content="Salut la ligue")
    assert str(msg) == f"{user} : Salut la ligue"


@pytest.mark.django_db
def test_conversation_get_or_create_is_symmetric(user, other_user):
    conv1 = Conversation.get_or_create_between(user, other_user)
    conv2 = Conversation.get_or_create_between(other_user, user)
    assert conv1.id == conv2.id


@pytest.mark.django_db
def test_conversation_orders_users_by_id(user, other_user):
    conv = Conversation.get_or_create_between(other_user, user)
    low, high = sorted([user, other_user], key=lambda u: u.id)
    assert conv.user_a_id == low.id
    assert conv.user_b_id == high.id


@pytest.mark.django_db
def test_conversation_has_participant(conversation, user, other_user):
    assert conversation.has_participant(user)
    assert conversation.has_participant(other_user)


@pytest.mark.django_db
def test_conversation_other_user(conversation, user, other_user):
    assert conversation.other_user(user).id == other_user.id
    assert conversation.other_user(other_user).id == user.id


# ── LeagueMessageHistory ─────────────────────────────────────────────

@pytest.mark.django_db
def test_league_history_requires_auth(api_client, league):
    resp = api_client.get(f"/api/chat/leagues/{league.id}/messages/")
    assert resp.status_code == 401


@pytest.mark.django_db
def test_league_history_404_unknown_league(auth_client):
    resp = auth_client.get("/api/chat/leagues/999999/messages/")
    assert resp.status_code == 404


@pytest.mark.django_db
def test_league_history_403_non_member(auth_client, other_user):
    other_league = League.objects.create(name="Autre", description="d", creator=other_user)
    resp = auth_client.get(f"/api/chat/leagues/{other_league.id}/messages/")
    assert resp.status_code == 403


@pytest.mark.django_db
def test_league_history_returns_messages_in_order(auth_client, league, user):
    first = Message.objects.create(league=league, sender=user, content="1")
    second = Message.objects.create(league=league, sender=user, content="2")

    resp = auth_client.get(f"/api/chat/leagues/{league.id}/messages/")
    assert resp.status_code == 200
    assert [m["content"] for m in resp.data] == ["1", "2"]


# ── ConversationList ─────────────────────────────────────────────────

@pytest.mark.django_db
def test_conversation_list_get_requires_auth(api_client):
    resp = api_client.get("/api/chat/conversations/")
    assert resp.status_code == 401


@pytest.mark.django_db
def test_conversation_list_get_only_own(auth_client, user, other_user):
    from django.contrib.auth import get_user_model

    User = get_user_model()
    third = User.objects.create_user(email="third@example.com", username="third", password="Testpassword123")

    mine = Conversation.get_or_create_between(user, other_user)
    Conversation.get_or_create_between(other_user, third)

    resp = auth_client.get("/api/chat/conversations/")
    assert resp.status_code == 200
    ids = [c["id"] for c in resp.data]
    assert ids == [mine.id]


@pytest.mark.django_db
def test_conversation_list_post_missing_user_id(auth_client):
    resp = auth_client.post("/api/chat/conversations/", {})
    assert resp.status_code == 400


@pytest.mark.django_db
def test_conversation_list_post_self_rejected(auth_client, user):
    resp = auth_client.post("/api/chat/conversations/", {"user_id": user.id})
    assert resp.status_code == 400


@pytest.mark.django_db
def test_conversation_list_post_404_unknown_peer(auth_client):
    resp = auth_client.post("/api/chat/conversations/", {"user_id": 999999})
    assert resp.status_code == 404


@pytest.mark.django_db
def test_conversation_list_post_creates_conversation(auth_client, user, other_user):
    resp = auth_client.post("/api/chat/conversations/", {"user_id": other_user.id})
    assert resp.status_code == 200
    assert Conversation.objects.filter(id=resp.data["id"]).exists()
    assert resp.data["peer"]["id"] == other_user.id


@pytest.mark.django_db
def test_conversation_list_post_is_idempotent(auth_client, user, other_user):
    resp1 = auth_client.post("/api/chat/conversations/", {"user_id": other_user.id})
    resp2 = auth_client.post("/api/chat/conversations/", {"user_id": other_user.id})
    assert resp1.data["id"] == resp2.data["id"]


# ── DirectMessageHistory ─────────────────────────────────────────────

@pytest.mark.django_db
def test_dm_history_requires_auth(api_client, conversation):
    resp = api_client.get(f"/api/chat/conversations/{conversation.id}/messages/")
    assert resp.status_code == 401


@pytest.mark.django_db
def test_dm_history_404_unknown_conversation(auth_client):
    resp = auth_client.get("/api/chat/conversations/999999/messages/")
    assert resp.status_code == 404


@pytest.mark.django_db
def test_dm_history_403_non_participant(auth_client, other_user):
    from django.contrib.auth import get_user_model

    User = get_user_model()
    third = User.objects.create_user(email="third@example.com", username="third", password="Testpassword123")
    conv = Conversation.get_or_create_between(other_user, third)

    resp = auth_client.get(f"/api/chat/conversations/{conv.id}/messages/")
    assert resp.status_code == 403


@pytest.mark.django_db
def test_dm_history_returns_messages(auth_client, conversation, user):
    DirectMessage.objects.create(conversation=conversation, sender=user, content="Yo")
    resp = auth_client.get(f"/api/chat/conversations/{conversation.id}/messages/")
    assert resp.status_code == 200
    assert resp.data[0]["content"] == "Yo"


# ── ChatConsumer (WebSocket) ─────────────────────────────────────────

@pytest.mark.django_db(transaction=True)
def test_chat_consumer_rejects_anonymous():
    league_obj = League.objects.create(
        name="Anon League", description="d",
        creator=_make_user("creator1@example.com", "creator1"),
    )

    async def scenario():
        communicator = WebsocketCommunicator(ChatConsumer.as_asgi(), f"/ws/chat/{league_obj.id}/")
        communicator.scope["url_route"] = {"kwargs": {"league_id": str(league_obj.id)}}
        communicator.scope["user"] = AnonymousUser()
        connected, _ = await communicator.connect()
        assert connected is False
        await communicator.disconnect()

    asyncio.run(scenario())


@pytest.mark.django_db(transaction=True)
def test_chat_consumer_rejects_non_member():
    creator = _make_user("creator2@example.com", "creator2")
    outsider = _make_user("outsider@example.com", "outsider")
    league_obj = League.objects.create(name="Members Only", description="d", creator=creator)
    league_obj.members.add(creator)

    async def scenario():
        communicator = WebsocketCommunicator(ChatConsumer.as_asgi(), f"/ws/chat/{league_obj.id}/")
        communicator.scope["url_route"] = {"kwargs": {"league_id": str(league_obj.id)}}
        communicator.scope["user"] = outsider
        connected, _ = await communicator.connect()
        assert connected is False
        await communicator.disconnect()

    asyncio.run(scenario())


@pytest.mark.django_db(transaction=True)
def test_chat_consumer_member_sends_and_broadcasts():
    member = _make_user("member1@example.com", "member1")
    league_obj = League.objects.create(name="Broadcast League", description="d", creator=member)
    league_obj.members.add(member)

    async def scenario():
        communicator = WebsocketCommunicator(ChatConsumer.as_asgi(), f"/ws/chat/{league_obj.id}/")
        communicator.scope["url_route"] = {"kwargs": {"league_id": str(league_obj.id)}}
        communicator.scope["user"] = member
        connected, _ = await communicator.connect()
        assert connected is True

        await communicator.send_json_to({"content": "Allez le Kop !"})
        response = await communicator.receive_json_from()
        assert response["message"] == "Allez le Kop !"
        assert response["username"] == member.username

        await communicator.disconnect()

    asyncio.run(scenario())
    assert Message.objects.filter(league=league_obj, content="Allez le Kop !").exists()


@pytest.mark.django_db(transaction=True)
def test_chat_consumer_ignores_empty_message():
    member = _make_user("member2@example.com", "member2")
    league_obj = League.objects.create(name="Empty League", description="d", creator=member)
    league_obj.members.add(member)

    async def scenario():
        communicator = WebsocketCommunicator(ChatConsumer.as_asgi(), f"/ws/chat/{league_obj.id}/")
        communicator.scope["url_route"] = {"kwargs": {"league_id": str(league_obj.id)}}
        communicator.scope["user"] = member
        await communicator.connect()
        await communicator.send_json_to({"content": "   "})
        assert await communicator.receive_nothing(timeout=0.3) is True
        await communicator.disconnect()

    asyncio.run(scenario())
    assert not Message.objects.filter(league=league_obj).exists()


# ── DMConsumer (WebSocket) ───────────────────────────────────────────

@pytest.mark.django_db(transaction=True)
def test_dm_consumer_rejects_non_participant():
    a = _make_user("dm_a@example.com", "dm_a")
    b = _make_user("dm_b@example.com", "dm_b")
    stranger = _make_user("dm_stranger@example.com", "dm_stranger")
    conv = Conversation.get_or_create_between(a, b)

    async def scenario():
        communicator = WebsocketCommunicator(DMConsumer.as_asgi(), f"/ws/dm/{conv.id}/")
        communicator.scope["url_route"] = {"kwargs": {"conversation_id": str(conv.id)}}
        communicator.scope["user"] = stranger
        connected, _ = await communicator.connect()
        assert connected is False
        await communicator.disconnect()

    asyncio.run(scenario())


@pytest.mark.django_db(transaction=True)
def test_dm_consumer_participant_sends_persists_and_notifies():
    a = _make_user("dm_c@example.com", "dm_c")
    b = _make_user("dm_d@example.com", "dm_d")
    conv = Conversation.get_or_create_between(a, b)

    async def scenario():
        communicator = WebsocketCommunicator(DMConsumer.as_asgi(), f"/ws/dm/{conv.id}/")
        communicator.scope["url_route"] = {"kwargs": {"conversation_id": str(conv.id)}}
        communicator.scope["user"] = a
        connected, _ = await communicator.connect()
        assert connected is True

        await communicator.send_json_to({"content": "Hey toi"})
        response = await communicator.receive_json_from()
        assert response["message"] == "Hey toi"
        assert response["sender_id"] == a.id

        await communicator.disconnect()

    asyncio.run(scenario())
    assert DirectMessage.objects.filter(conversation=conv, content="Hey toi").exists()
    assert Notification.objects.filter(recipient=b, type="dm").exists()


def _make_user(email, username):
    from django.contrib.auth import get_user_model

    return get_user_model().objects.create_user(email=email, username=username, password="Testpassword123")


# ── Historique : les 50 PLUS RÉCENTS ─────────────────────────────────

@pytest.mark.django_db
def test_league_history_returns_the_50_most_recent(auth_client, league, user):
    """Passé 50 messages, l'historique doit suivre, sans rester bloqué au début."""
    for i in range(60):
        Message.objects.create(league=league, sender=user, content=str(i))

    resp = auth_client.get(f"/api/chat/leagues/{league.id}/messages/")

    assert resp.status_code == 200
    contents = [m["content"] for m in resp.data]
    assert len(contents) == 50
    # Les 50 derniers (10 à 59), et toujours du plus ancien au plus récent.
    assert contents[0] == "10"
    assert contents[-1] == "59"


@pytest.mark.django_db
def test_dm_history_returns_the_50_most_recent(auth_client, conversation, user):
    for i in range(60):
        DirectMessage.objects.create(conversation=conversation, sender=user, content=str(i))

    resp = auth_client.get(f"/api/chat/conversations/{conversation.id}/messages/")

    assert resp.status_code == 200
    contents = [m["content"] for m in resp.data]
    assert len(contents) == 50
    assert contents[0] == "10"
    assert contents[-1] == "59"
