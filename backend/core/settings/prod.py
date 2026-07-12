"""Production settings: everything security-sensitive is strictly env-driven.

ALLOWED_HOSTS and CORS_ALLOWED_ORIGINS must be set explicitly via the
environment (no hardcoded defaults, no wildcard fallback).
"""

import os

from .base import *  # noqa: F401,F403
from .base import BASE_DIR, env

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

# Logging: console always (so platform log collectors like Heroku/Render/
# CloudWatch pick it up), plus a rotating file for anything that isn't
# tailing stdout. LOG_DIR is overridable via env for platforms with
# read-only/ephemeral filesystems where local file logging isn't wanted.
LOG_DIR = env('LOG_DIR', default=str(BASE_DIR / 'logs'))
os.makedirs(LOG_DIR, exist_ok=True)

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{asctime} {levelname} {name} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
        'error_file': {
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': os.path.join(LOG_DIR, 'django-error.log'),
            'maxBytes': 5 * 1024 * 1024,  # 5 MB
            'backupCount': 5,
            'level': 'ERROR',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'WARNING',
    },
    'loggers': {
        # Unhandled view exceptions (5xx) -- the errors most worth alerting on.
        'django.request': {
            'handlers': ['console', 'error_file'],
            'level': 'ERROR',
            'propagate': False,
        },
        # Suspicious-request warnings (bad host header, disallowed redirect, etc).
        'django.security': {
            'handlers': ['console', 'error_file'],
            'level': 'WARNING',
            'propagate': False,
        },
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}
