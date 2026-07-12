"""Development settings: local SQLite, permissive CORS for local frontend."""

from .base import *  # noqa: F401,F403
from .base import BASE_DIR, env

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
        # SQLite serializes writers at the file level (no real row locking).
        # 'immediate' avoids the deferred-BEGIN lock-upgrade conflict where two
        # connections both hold a SHARED read lock and can't both become the
        # writer; 'timeout' makes a blocked writer wait instead of failing
        # immediately with "database is locked".
        'OPTIONS': {'timeout': 20, 'transaction_mode': 'IMMEDIATE'},
    }
}

# Convenience default for local development only; still overridable via .env.
if not ALLOWED_HOSTS:  # noqa: F405
    ALLOWED_HOSTS = ['localhost', '127.0.0.1']

CORS_ALLOWED_ORIGINS = env.list(
    'CORS_ALLOWED_ORIGINS',
    default=['http://localhost:3000', 'http://127.0.0.1:3000'],
)
