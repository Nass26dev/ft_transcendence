from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from drf_spectacular.extensions import OpenApiAuthenticationExtension

class CookieJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
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
        return {
            'type': 'apiKey',
            'in': 'cookie',
            'name': 'access_token',
        }