from dj_rest_auth.registration.serializers import RegisterSerializer as BaseRegisterSerializer
from rest_framework import serializers
from .models import User



class RegisterSerializer(BaseRegisterSerializer):
    username = None
    first_name = serializers.CharField(required=False, default='')
    last_name = serializers.CharField(required=False, default='')
    wallet = serializers.DecimalField(required=False, default=0, max_digits=10, decimal_places=2)

    def get_cleaned_data(self):
        return {
            'email': self.validated_data.get('email', ''),
            'password1': self.validated_data.get('password1', ''),
            'password2': self.validated_data.get('password2', ''),
            'first_name': self.validated_data.get('first_name', ''),
            'last_name': self.validated_data.get('last_name', ''),
            'wallet': self.validated_data.get('wallet', 0),
        }

    def save(self, request):
        user = super().save(request)
        user.first_name = self.cleaned_data.get('first_name', '')
        user.last_name = self.cleaned_data.get('last_name', '')
        user.wallet = self.cleaned_data.get('wallet', 0)
        user.save()
        return user

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'is_staff','wallet']