from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from drf_spectacular.extensions import OpenApiAuthenticationExtension

class CookieJWTAuthentication(JWTAuthentication):
    """Authentifie via le JWT stocké dans le cookie httpOnly `access_token`."""

    def authenticate(self, request):
        """Valide le token du cookie ; retourne None (pas d'erreur) s'il est absent ou invalide.

        Note au passage l'activité de l'utilisateur (`last_seen`), qui alimente
        le statut en ligne affiché dans la liste d'amis. C'est le seul endroit
        traversé par *toutes* les requêtes authentifiées : un middleware Django
        classique n'y suffirait pas, car il s'exécute avant que DRF n'ait
        résolu l'utilisateur depuis le JWT.
        """
        access_token = request.COOKIES.get('access_token')

        if access_token is None:
            return None

        try:
            validated_token = self.get_validated_token(access_token)
            user = self.get_user(validated_token)
        except (InvalidToken, TokenError):
            return None

        user.touch_last_seen()
        return user, validated_token


class CookieJWTAuthenticationScheme(OpenApiAuthenticationExtension):
    """Declare le schema de securite Swagger pour l'auth JWT en cookie httpOnly."""
    target_class = 'users.authentication.CookieJWTAuthentication'
    name = 'cookieAuth'

    def get_security_definition(self, auto_schema):
        """Décrit le schéma de sécurité `cookieAuth` pour la doc Swagger/OpenAPI."""
        return {
            'type': 'apiKey',
            'in': 'cookie',
            'name': 'access_token',
        }