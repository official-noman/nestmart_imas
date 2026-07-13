from unittest.mock import patch

import pyotp
import pytest
from conftest import UserFactory
from django.contrib.auth.tokens import default_token_generator

pytestmark = pytest.mark.django_db


def test_register_creates_user(api_client):
    # Arrange
    data = {'username': 'newuser', 'email': 'newuser@example.com', 'password': 'StrongPass123!'}

    # Act
    response = api_client.post('/api/auth/register/', data)

    # Assert
    assert response.status_code == 201
    assert response.data['email'] == 'newuser@example.com'


def test_login_returns_tokens_when_2fa_disabled(api_client):
    # Arrange
    UserFactory(email='user@example.com', password='correct-password', is_2fa_enabled=False)

    # Act
    response = api_client.post('/api/auth/login/', {
        'email': 'user@example.com',
        'password': 'correct-password',
    })

    # Assert
    assert response.status_code == 200
    assert 'access' in response.data
    assert 'refresh' in response.data


def test_login_requires_2fa_step_when_enabled(api_client):
    # Arrange
    user = UserFactory(
        email='user2fa@example.com',
        password='correct-password',
        is_2fa_enabled=True,
        totp_secret=pyotp.random_base32(),
    )

    # Act
    response = api_client.post('/api/auth/login/', {
        'email': 'user2fa@example.com',
        'password': 'correct-password',
    })

    # Assert
    assert response.status_code == 200
    assert response.data['require_2fa'] is True
    assert response.data['user_id'] == user.id


def test_login_rejects_wrong_password(api_client):
    # Arrange
    UserFactory(email='user@example.com', password='correct-password')

    # Act
    response = api_client.post('/api/auth/login/', {
        'email': 'user@example.com',
        'password': 'wrong-password',
    })

    # Assert
    assert response.status_code == 400


def test_2fa_enable_returns_secret_for_authenticated_user(make_authenticated_client):
    # Arrange
    client, user = make_authenticated_client()

    # Act
    response = client.post('/api/auth/2fa/enable/')

    # Assert
    assert response.status_code == 200
    assert 'secret' in response.data
    user.refresh_from_db()
    assert user.totp_secret == response.data['secret']
    assert user.is_2fa_enabled is False


def test_2fa_confirm_enables_2fa_with_valid_otp(make_authenticated_client):
    # Arrange
    client, user = make_authenticated_client()
    secret = pyotp.random_base32()
    user.totp_secret = secret
    user.save(update_fields=['totp_secret'])

    # Act
    response = client.post('/api/auth/2fa/confirm/', {'otp_code': pyotp.TOTP(secret).now()})

    # Assert
    assert response.status_code == 200
    user.refresh_from_db()
    assert user.is_2fa_enabled is True


def test_2fa_confirm_rejects_invalid_otp(make_authenticated_client):
    # Arrange
    client, user = make_authenticated_client()
    user.totp_secret = pyotp.random_base32()
    user.save(update_fields=['totp_secret'])

    # Act
    response = client.post('/api/auth/2fa/confirm/', {'otp_code': '000000'})

    # Assert
    assert response.status_code == 400


def test_verify_2fa_login_returns_tokens_with_valid_otp(api_client):
    # Arrange
    secret = pyotp.random_base32()
    user = UserFactory(is_2fa_enabled=True, totp_secret=secret)

    # Act
    response = api_client.post('/api/auth/login/verify-2fa/', {
        'user_id': user.id,
        'otp_code': pyotp.TOTP(secret).now(),
    })

    # Assert
    assert response.status_code == 200
    assert 'access' in response.data


@patch('users.serializers.send_mail')
def test_password_reset_emails_the_token_to_the_account_owner(mock_send_mail, api_client):
    # Arrange
    user = UserFactory(email='user@example.com')

    # Act
    response = api_client.post('/api/auth/password-reset/', {'email': 'user@example.com'})

    # Assert
    assert response.status_code == 200
    mock_send_mail.assert_called_once()
    assert mock_send_mail.call_args.kwargs['recipient_list'] == [user.email]


@patch('users.serializers.send_mail')
def test_password_reset_rejects_unknown_email_without_sending_mail(mock_send_mail, api_client):
    # Act
    response = api_client.post('/api/auth/password-reset/', {'email': 'nobody@example.com'})

    # Assert
    assert response.status_code == 400
    mock_send_mail.assert_not_called()


def test_password_reset_confirm_changes_password_with_valid_token(api_client):
    # Arrange
    user = UserFactory(email='user@example.com', password='old-password')
    token = default_token_generator.make_token(user)

    # Act
    response = api_client.post('/api/auth/password-reset-confirm/', {
        'email': 'user@example.com',
        'token': token,
        'new_password': 'BrandNewPass123!',
    })

    # Assert
    assert response.status_code == 200
    user.refresh_from_db()
    assert user.check_password('BrandNewPass123!')


def test_password_reset_confirm_rejects_invalid_token(api_client):
    # Arrange
    user = UserFactory(email='user@example.com', password='old-password')

    # Act
    response = api_client.post('/api/auth/password-reset-confirm/', {
        'email': 'user@example.com',
        'token': 'not-a-real-token',
        'new_password': 'BrandNewPass123!',
    })

    # Assert
    assert response.status_code == 400
    user.refresh_from_db()
    assert user.check_password('old-password')  # unchanged
