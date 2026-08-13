import os
from urllib.parse import parse_qs
from http.cookies import SimpleCookie

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser

from channels.db import database_sync_to_async

try:
    from rest_framework_simplejwt.tokens import AccessToken
    USE_SIMPLE_JWT = True
except ImportError:
    import jwt
    USE_SIMPLE_JWT = False

User = get_user_model()

@database_sync_to_async
def get_user_from_jwt(token_key):
    """Résout l'utilisateur correspondant à un token JWT.

    Utilise SimpleJWT si disponible (décodage + validation via la config
    Django), sinon se rabat sur un décodage manuel avec PyJWT. Renvoie
    AnonymousUser si le token est invalide, expiré ou ne correspond à
    aucun utilisateur.
    """
    try:
        if USE_SIMPLE_JWT:
            validated_token = AccessToken(token_key)
            user_id = validated_token["user_id"]
        else:
            payload = jwt.decode(token_key, settings.SECRET_KEY, algorithms=["HS256"])
            user_id = payload.get("user_id")

        return User.objects.get(id=user_id)
    except Exception as e:
        print(f"--- ERREUR DÉCODAGE JWT --- : {e}")
        return AnonymousUser()


class CookieJWTAuthMiddleware:
    """
    Middleware Channels pour authentifier un utilisateur via son JWT 
    stocké dans les cookies du navigateur.
    """
    def __init__(self, inner):
        """Enveloppe l'application ASGI suivante (`inner`) dans la chaîne de middlewares."""
        self.inner = inner

    async def __call__(self, scope, receive, send):
        """Extrait le JWT des cookies de la requête et peuple `scope['user']` en conséquence."""
        headers = dict(scope.get("headers", {}))
        cookie_header = headers.get(b"cookie", b"").decode()

        cookies = SimpleCookie()
        cookies.load(cookie_header)
        token_cookie = cookies.get("access_token") or cookies.get("access") or cookies.get("jwt-auth")
        
        if token_cookie:
            scope["user"] = await get_user_from_jwt(token_cookie.value)
        else:
            scope["user"] = AnonymousUser()

        return await self.inner(scope, receive, send)