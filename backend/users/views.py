import pyotp
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from .serializers import (
    LoginSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetSerializer,
    TwoFAConfirmSerializer,
    TwoFALoginVerifySerializer,
    UserRegistrationSerializer,
    get_tokens_for_user,
)


class UserRegistrationView(generics.CreateAPIView):
    serializer_class = UserRegistrationSerializer
    permission_classes = (permissions.AllowAny,)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            UserRegistrationSerializer(user).data,
            status=status.HTTP_201_CREATED,
            headers=self.get_success_headers(serializer.data),
        )


class PasswordResetView(APIView):
    permission_classes = (permissions.AllowAny,)
    throttle_classes = (ScopedRateThrottle,)
    throttle_scope = 'password_reset'

    def post(self, request):
        serializer = PasswordResetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.save(), status=status.HTTP_200_OK)


class PasswordResetConfirmView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'detail': 'Password has been reset successfully.'})


class LoginView(APIView):
    permission_classes = (permissions.AllowAny,)
    throttle_classes = (ScopedRateThrottle,)
    throttle_scope = 'login'

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']

        if user.is_2fa_enabled:
            return Response({'require_2fa': True, 'user_id': user.id})

        return Response(get_tokens_for_user(user))


class TwoFALoginVerifyView(APIView):
    permission_classes = (permissions.AllowAny,)
    throttle_classes = (ScopedRateThrottle,)
    throttle_scope = 'verify_2fa'

    def post(self, request):
        serializer = TwoFALoginVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(get_tokens_for_user(serializer.validated_data['user']))


class TwoFAEnableView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        user = request.user
        secret = pyotp.random_base32()
        user.totp_secret = secret
        user.is_2fa_enabled = False
        user.save(update_fields=['totp_secret', 'is_2fa_enabled'])

        provisioning_uri = pyotp.TOTP(secret).provisioning_uri(
            name=user.email,
            issuer_name='IMAS',
        )
        return Response({
            'secret': secret,
            'provisioning_uri': provisioning_uri,
        })


class TwoFAConfirmView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        serializer = TwoFAConfirmSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        request.user.is_2fa_enabled = True
        request.user.save(update_fields=['is_2fa_enabled'])
        return Response({'detail': '2FA has been enabled successfully.'})
