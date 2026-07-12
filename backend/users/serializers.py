import pyotp
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken


User = get_user_model()


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'role')
        read_only_fields = ('id', 'role')

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class PasswordResetSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        try:
            self.user = User.objects.get(email=value)
        except User.DoesNotExist:
            raise serializers.ValidationError('No user found with this email address.')
        return value

    def save(self, **kwargs):
        token = default_token_generator.make_token(self.user)
        send_mail(
            subject='IMAS Password Reset',
            message=(
                'Use the following details to reset your password:\n\n'
                f'Email: {self.user.email}\n'
                f'User ID: {self.user.id}\n'
                f'Token: {token}'
            ),
            from_email=None,
            recipient_list=[self.user.email],
            fail_silently=False,
        )
        return {'detail': 'Password reset token sent.'}


class PasswordResetConfirmSerializer(serializers.Serializer):
    email = serializers.EmailField()
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, validators=[validate_password])

    def validate(self, attrs):
        try:
            user = User.objects.get(email=attrs['email'])
        except User.DoesNotExist:
            raise serializers.ValidationError({'email': 'No user found with this email address.'})

        if not default_token_generator.check_token(user, attrs['token']):
            raise serializers.ValidationError({'token': 'Invalid or expired password reset token.'})

        attrs['user'] = user
        return attrs

    def save(self, **kwargs):
        user = self.validated_data['user']
        user.set_password(self.validated_data['new_password'])
        user.save(update_fields=['password'])
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        user = authenticate(
            request=self.context.get('request'),
            email=attrs['email'],
            password=attrs['password'],
        )
        if user is None:
            raise serializers.ValidationError('Invalid email or password.')
        if not user.is_active:
            raise serializers.ValidationError('This account is inactive.')

        attrs['user'] = user
        return attrs


class TwoFAConfirmSerializer(serializers.Serializer):
    otp_code = serializers.CharField()

    def validate_otp_code(self, value):
        user = self.context['request'].user
        if not user.totp_secret:
            raise serializers.ValidationError('2FA has not been initialized.')
        if not pyotp.TOTP(user.totp_secret).verify(value):
            raise serializers.ValidationError('Invalid OTP code.')
        return value


class TwoFALoginVerifySerializer(serializers.Serializer):
    user_id = serializers.IntegerField()
    otp_code = serializers.CharField()

    def validate(self, attrs):
        try:
            user = User.objects.get(id=attrs['user_id'], is_active=True)
        except User.DoesNotExist:
            raise serializers.ValidationError({'user_id': 'Invalid user.'})

        if not user.is_2fa_enabled or not user.totp_secret:
            raise serializers.ValidationError('2FA is not enabled for this user.')
        if not pyotp.TOTP(user.totp_secret).verify(attrs['otp_code']):
            raise serializers.ValidationError({'otp_code': 'Invalid OTP code.'})

        attrs['user'] = user
        return attrs


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
        'user': {
            'username': user.username,
            'email': user.email,
            'role': getattr(user, 'role', None),
        }
    }
