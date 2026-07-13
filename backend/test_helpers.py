"""Shared, cross-app pytest utilities.

`conftest.py` holds fixtures and model factories (auto-discovered by
pytest). This module holds plain helper *functions* -- things every
test_views.py file was independently re-implementing: "hitting this URL
anonymously returns 401", "hitting it as the wrong role returns 403".
Import them explicitly, same as the per-app `_helpers.py` modules.
"""


def assert_requires_authentication(api_client, url, method='get', data=None):
    """An anonymous request to `url` must be rejected with 401."""
    response = getattr(api_client, method)(url, data)
    assert response.status_code == 401
    return response


def assert_forbidden_for_role(make_authenticated_client, role, url, method='get', data=None):
    """An authenticated request from a user with `role` must be rejected
    with 403 (the role lacks permission, as opposed to not being
    authenticated at all)."""
    client, _ = make_authenticated_client(role=role)
    response = getattr(client, method)(url, data)
    assert response.status_code == 403
    return response
