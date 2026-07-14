import pytest
from conftest import UserFactory

from apps.users.api.v1.serializers import LoginSerializer, UserRegistrationSerializer
from apps.users.models import CustomUser

pytestmark = pytest.mark.django_db


def test_registration_serializer_hashes_password():
    # Arrange
    serializer = UserRegistrationSerializer(data={
        'username': 'janedoe',
        'email': 'jane@example.com',
        'password': 'StrongPass123!',
    })
    assert serializer.is_valid(), serializer.errors

    # Act
    user = serializer.save()

    # Assert
    assert user.password != 'StrongPass123!'
    assert user.check_password('StrongPass123!')


def test_registration_serializer_ignores_client_supplied_role():
    """`role` is read-only -- registration must never let a client self-assign
    a privileged role like Admin."""
    # Arrange
    serializer = UserRegistrationSerializer(data={
        'username': 'wannabe',
        'email': 'wannabe@example.com',
        'password': 'StrongPass123!',
        'role': CustomUser.Role.ADMIN,
    })
    assert serializer.is_valid(), serializer.errors

    # Act
    user = serializer.save()

    # Assert
    assert user.role == CustomUser.Role.VIEWER


def test_registration_serializer_rejects_weak_password():
    # Arrange
    data = {'username': 'weakpw', 'email': 'weakpw@example.com', 'password': '123'}

    # Act
    serializer = UserRegistrationSerializer(data=data)
    is_valid = serializer.is_valid()

    # Assert
    assert not is_valid
    assert 'password' in serializer.errors


def test_login_serializer_rejects_wrong_password():
    # Arrange
    UserFactory(email='user@example.com', password='correct-password')
    data = {'email': 'user@example.com', 'password': 'wrong-password'}

    # Act
    serializer = LoginSerializer(data=data)
    is_valid = serializer.is_valid()

    # Assert
    assert not is_valid


def test_login_serializer_accepts_correct_credentials():
    # Arrange
    UserFactory(email='user@example.com', password='correct-password')
    data = {'email': 'user@example.com', 'password': 'correct-password'}

    # Act
    serializer = LoginSerializer(data=data)
    is_valid = serializer.is_valid()

    # Assert
    assert is_valid, serializer.errors
    assert serializer.validated_data['user'].email == 'user@example.com'


def test_login_serializer_rejects_inactive_user():
    # Arrange
    UserFactory(email='inactive@example.com', password='correct-password', is_active=False)
    data = {'email': 'inactive@example.com', 'password': 'correct-password'}

    # Act
    serializer = LoginSerializer(data=data)
    is_valid = serializer.is_valid()

    # Assert
    assert not is_valid
