import pytest
from django.core.cache import cache


@pytest.fixture(autouse=True)
def _clear_throttle_cache():
    """The login/password-reset/2FA views are rate-limited via DRF's
    ScopedRateThrottle, which is backed by Django's cache -- not the DB, so
    it isn't reset by pytest-django's per-test transaction rollback. Without
    this, running e.g. 6+ login tests in one session would make the later
    ones fail with 429 regardless of whether the credentials are correct."""
    cache.clear()
    yield
