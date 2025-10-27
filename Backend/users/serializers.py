#users/serializers.py
from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile

class UserSerializer(serializers.ModelSerializer):
    avatar = serializers.ImageField(source='profile.avatar', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'avatar']
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email'),
            password=validated_data['password']
        )
        return user

class ProfileUpdateSerializer(serializers.ModelSerializer):
    avatar = serializers.ImageField(source='profile.avatar', required=False)

    class Meta:
        model = User
        fields = ['username', 'email', 'avatar']

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', {})
        avatar = profile_data.get('avatar')

        print("Received avatar:", avatar)  # <-- DEBUG

        instance.username = validated_data.get('username', instance.username)
        instance.email = validated_data.get('email', instance.email)
        instance.save()

        profile, _ = UserProfile.objects.get_or_create(user=instance)
        if avatar:
          profile.avatar = avatar
          profile.save()
          print("Saved avatar at:", profile.avatar.path)  # <-- DEBUG

        return instance

    def to_representation(self, instance):
        """Return full URL for avatar"""
        ret = super().to_representation(instance)
        if instance.profile.avatar:
            request = self.context.get('request')
            avatar_url = instance.profile.avatar.url
            if request is not None:
                avatar_url = request.build_absolute_uri(avatar_url)
            ret['avatar'] = avatar_url
        else:
            ret['avatar'] = None
        return ret
