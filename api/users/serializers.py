from dj_rest_auth.registration.serializers import RegisterSerializer as BaseRegisterSerializer
from rest_framework import serializers
from .models import User


class RegisterSerializer(BaseRegisterSerializer):
    username = None
    first_name = serializers.CharField(required=False, default='')
    last_name = serializers.CharField(required=False, default='')
    wallet = serializers.DecimalField(required=False, default=100, max_digits=10, decimal_places=2)

    def get_cleaned_data(self):
        return {
            'email': self.validated_data.get('email', ''),
            'password1': self.validated_data.get('password1', ''),
            'password2': self.validated_data.get('password2', ''),
            'first_name': self.validated_data.get('first_name', ''),
            'last_name': self.validated_data.get('last_name', ''),
            'wallet': self.validated_data.get('wallet', 100),
        }

    def save(self, request):
        user = super().save(request)
        user.first_name = self.cleaned_data.get('first_name', '')
        user.last_name = self.cleaned_data.get('last_name', '')
        user.wallet = self.cleaned_data.get('wallet', 100)
        user.save()
        return user

from rest_framework import serializers
from .models import User


class UserSerializer(serializers.ModelSerializer):
    daily_bonus_available = serializers.SerializerMethodField()
    wheel_available = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'bio',
            'avatar',
            'wallet',
            'daily_bonus_available',
            'wheel_available',
            'onboarding_completed',
            'is_public',
            'date_joined',
            'status',
        ]

    def get_daily_bonus_available(self, obj):
        from django.utils import timezone
        return obj.last_daily_bonus != timezone.localdate()

    def get_wheel_available(self, obj):
        from django.utils import timezone
        return obj.last_wheel_spin != timezone.localdate()


class ProfileUpdateSerializer(serializers.ModelSerializer):
    """Champs que l'utilisateur peut modifier lui-même depuis les réglages."""

    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'username', 'bio', 'is_public']
        extra_kwargs = {
            'first_name': {'required': False},
            'last_name': {'required': False},
            'username': {'required': False},
            'bio': {'required': False},
            'is_public': {'required': False},
        }

    def validate_username(self, value):
        value = (value or '').strip()
        if not value:
            raise serializers.ValidationError("Le nom d'utilisateur ne peut pas être vide.")
        if User.objects.filter(username=value).exclude(pk=self.instance.pk).exists():
            raise serializers.ValidationError("Ce nom d'utilisateur est déjà pris.")
        return value