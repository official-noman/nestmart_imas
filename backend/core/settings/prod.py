"""Production settings: everything security-sensitive is strictly env-driven.

ALLOWED_HOSTS and CORS_ALLOWED_ORIGINS must be set explicitly via the
environment (no hardcoded defaults, no wildcard fallback).
"""

from .base import *  # noqa: F401,F403
from .base import env

DEBUG = False

if not ALLOWED_HOSTS:  # noqa: F405
    raise Exception('ALLOWED_HOSTS must be set via environment in production')

if not CORS_ALLOWED_ORIGINS:  # noqa: F405
    raise Exception('CORS_ALLOWED_ORIGINS must be set via environment in production')

DATABASES = {
    'default': {
        'ENGINE': env('DB_ENGINE', default='django.db.backends.postgresql'),
        'NAME': env('DB_NAME'),
        'USER': env('DB_USER'),
        'PASSWORD': env('DB_PASSWORD'),
        'HOST': env('DB_HOST'),
        'PORT': env('DB_PORT', default='5432'),
    }
}

SECURE_SSL_REDIRECT = env.bool('SECURE_SSL_REDIRECT', default=True)
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = env.int('SECURE_HSTS_SECONDS', default=31536000)
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
