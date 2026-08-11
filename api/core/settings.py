from pathlib import Path
from dotenv import load_dotenv
import os
from datetime import timedelta
from celery.schedules import crontab

BASE_DIR = Path(__file__).resolve().parent.parent

load_dotenv()

SECRET_KEY = os.getenv('DJANGO_SECRET_KEY')

# Seule variable d'environnement de bascule dev/prod (définie dans .env).
# Défaut prod (False) si non défini → on échoue côté sûr.
DEBUG = os.getenv('DJANGO_DEBUG', 'False') == 'True'

# Hôtes et origines autorisés : définis ici, PAS via l'environnement.
# Dev (DEBUG) = permissif / localhost ; prod = domaines kop.life.
if DEBUG:
    ALLOWED_HOSTS = ['*']
    # En dev le navigateur passe par nginx en HTTPS (https://localhost).
    # http://localhost:3000 reste toléré pour un front lancé hors Docker.
    CSRF_TRUSTED_ORIGINS = ['https://localhost:8443']
    CORS_ALLOWED_ORIGINS = ['https://localhost:8443', 'http://localhost:3000']
else:
    ALLOWED_HOSTS = ['kop.life', 'www.kop.life', 'api.kop.life']
    CSRF_TRUSTED_ORIGINS = [
        'https://kop.life',
        'https://www.kop.life',
        'https://api.kop.life',
    ]
    CORS_ALLOWED_ORIGINS = [
        'https://kop.life',
        'https://www.kop.life',
    ]

CORS_ALLOW_CREDENTIALS = True

AUTH_USER_MODEL = 'users.User'

INSTALLED_APPS = [
    'daphne',
    'users',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.sites',
    'corsheaders',
    'rest_framework',
    'rest_framework.authtoken',
    'django_filters',
    'allauth',
    'allauth.account',
    'allauth.socialaccount',
    'allauth.socialaccount.providers.google',
    'dj_rest_auth',
    'dj_rest_auth.registration',
    'django_celery_beat',
    'django_celery_results',
    'friends',
    'chat',
    'league',
    'sports',
    'betting',
    'challenges',
    'notifications',
    'channels',
]

SITE_ID = 1
ASGI_APPLICATION = "core.asgi.application"
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [("redis", 6379)],
        },
    },
}
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    # Sert les fichiers statiques en prod (inerte en dev quand DEBUG=True).
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'allauth.account.middleware.AccountMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'core.urls'

AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',
    'allauth.account.auth_backends.AuthenticationBackend',
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'users.authentication.CookieJWTAuthentication',
    )
}

# Durées des tokens JWT. La durée du refresh doit couvrir celle du cookie
# refresh_token (7 jours) côté login, sinon le token meurt avant le cookie.
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=5),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
}

REST_AUTH = {
    'USE_JWT': True,
    'JWT_AUTH_COOKIE': 'access_token',
    'JWT_AUTH_REFRESH_COOKIE': 'refresh_token',
    'JWT_AUTH_HTTPONLY': True,
    # Cohérent avec le login custom : pas de Secure en dev (http localhost),
    # SameSite=Lax pour que les cookies passent en cross-origin same-site.
    'JWT_AUTH_SECURE': not DEBUG,
    'JWT_AUTH_SAMESITE': 'Lax',
    'REGISTER_SERIALIZER': 'users.serializers.RegisterSerializer',
}

ACCOUNT_LOGIN_METHODS = {'email'}
ACCOUNT_SIGNUP_FIELDS = ['email*', 'password1*', 'password2*']
ACCOUNT_EMAIL_VERIFICATION = 'none'

SOCIALACCOUNT_PROVIDERS = {
    'google': {
        'APP': {
            'client_id': os.getenv("GOOGLE_CLIENT_ID"),
            'secret': os.getenv("GOOGLE_CLIENT_SECRET"),
            'key': ''
        }
    }
}

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'core.wsgi.application'

SITE_ID = 1

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.getenv("POSTGRES_DB"),
        "USER": os.getenv("POSTGRES_USER"),
        "PASSWORD": os.getenv("POSTGRES_PASSWORD"),
        "HOST": os.getenv("POSTGRES_HOST", "db"),
        "PORT": os.getenv("POSTGRES_PORT", "5432"),
    },
}

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'Europe/Paris'

USE_I18N = True

USE_TZ = True

STATIC_URL = 'static/'

# Destination de `collectstatic` en prod (servi par WhiteNoise).
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Médias uploadés par les utilisateurs (photos de profil).
# En dev, servis par Django (cf. core/urls.py). En prod, par nginx
# (bloc `location /media/` + volume partagé — voir doc déploiement).
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

CELERY_BROKER_URL = "redis://redis:6379/0"
CELERY_RESULT_BACKEND = "django-db"
CELERY_CACHE_BACKEND = "default"
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TIMEZONE = "Europe/Paris"
CELERY_TASK_TRACK_STARTED = True
CELERY_BEAT_SCHEDULER = "django_celery_beat.schedulers:DatabaseScheduler"
CELERY_BEAT_SCHEDULE = {
    "scrape-live": {
        "task": "sports.scrape_live",
        "schedule": 30.0,  # toutes les 30 secondes
    },
    "scrape-upcoming": {
        "task": "sports.scrape_upcoming",
        "schedule": crontab(hour=0, minute=0),  # minuit
    },
}