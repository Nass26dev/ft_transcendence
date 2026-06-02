import os
from urllib.parse import parse_qs
from http.cookies import SimpleCookie

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser

from channels.db import database_sync_to_async

# On essaie d'utiliser SimpleJWT (standard pour DRF), sinon on se rabat sur PyJWT
try:
    from rest_framework_simplejwt.tokens import AccessToken
    USE_SIMPLE_JWT = True
except ImportError:
    import jwt
    USE_SIMPLE_JWT = False

User = get_user_model()

@database_sync_to_async
def get_user_from_jwt(token_key):
    try:
        if USE_SIMPLE_JWT:
            # Décodage automatique via la config SimpleJWT de ton Django
            validated_token = AccessToken(token_key)
            user_id = validated_token["user_id"]
        else:
            # Décodage manuel classique via PyJWT
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
        self.inner = inner

    async def __call__(self, scope, receive, send):
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