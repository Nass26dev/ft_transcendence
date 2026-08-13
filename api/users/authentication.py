from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from drf_spectacular.extensions import OpenApiAuthenticationExtension

class CookieJWTAuthentication(JWTAuthentication):
    """Authentifie via le JWT stocké dans le cookie httpOnly `access_token`."""

    def authenticate(self, request):
        """Valide le token du cookie ; retourne None (pas d'erreur) s'il est absent ou invalide."""
        access_token = request.COOKIES.get('access_token')

        if access_token is None:
            return None

        try:
            validated_token = self.get_validated_token(access_token)
            return self.get_user(validated_token), validated_token
        except (InvalidToken, TokenError):
            return None


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