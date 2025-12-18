from rest_framework import serializers
from dj_rest_auth.registration.serializers import RegisterSerializer
from dj_rest_auth.serializers import UserDetailsSerializer
from .models import User, UserProfile


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for User Profile"""

    avatar_url = serializers.SerializerMethodField()
    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = UserProfile
        fields = [
            "id",
            "avatar",
            "avatar_url",
            "created_at",
            "username",
        ]

        read_only_fields = ["created_at"]

    def get_avatar_url(self, obj):
        """avatar url"""
        if obj.avatar:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.avatar.url)
            return obj.avatar.url
        return None


class CustomUserDetailsSerializer(UserDetailsSerializer):
    """
    Custom serializer for User with Profile
         /api/auth/me/
    """

    profile = UserProfileSerializer(read_only=True)

    class Meta(UserDetailsSerializer.Meta):
        model = User
        fields = [
            "id",
            "email",
            "username",
            "profile",
        ]


class ChangePasswordSerializer(serializers.Serializer):
    """
    Serializer for changing password
    """

    old_password = serializers.CharField(required=True, write_only=True)
    new_password1 = serializers.CharField(required=True, write_only=True)
    new_password2 = serializers.CharField(required=True, write_only=True)

    def validate_old_password(self, value):
        """Validate old password"""
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is incorrect")
        return value

    def validate(self, data):
        """Validate new password match"""
        if data["new_password1"] != data["new_password2"]:
            raise serializers.ValidationError(
                {"new_password2": "The two password fields didn't match."}
            )

        # Validate password strength
        from django.contrib.auth.password_validation import validate_password

        try:
            validate_password(data["new_password1"], self.context["request"].user)
        except Exception as e:
            raise serializers.ValidationError({"new_password1": list(e.messages)})

        return data

    def save(self):
        """Save new password"""
        user = self.context["request"].user
        user.set_password(self.validated_data["new_password1"])
        user.save()
        return user


class CustomRegisterSerializer(RegisterSerializer):
    """
    Custom Registration Serializer
    Username is required during registration
    Login uses email only (USERNAME_FIELD = "email")
    """

    username = serializers.CharField(required=True, max_length=150, allow_blank=False)

    def get_cleaned_data(self):
        """
        Get cleaned data including username
        """
        data = super().get_cleaned_data()
        data['username'] = self.validated_data.get('username')
        return data

    def save(self, request):
        """
        Save user with username
        """
        username = self.validated_data.get('username', '').strip()
        
        # Call parent save to create the user
        user = super().save(request)
        
        # Explicitly set username 
        user.username = username
        user.save()
        
        return user
