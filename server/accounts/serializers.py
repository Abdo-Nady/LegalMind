from rest_framework import serializers
from dj_rest_auth.registration.serializers import RegisterSerializer
from dj_rest_auth.serializers import UserDetailsSerializer
from .models import User, UserProfile
from django.contrib.auth import get_user_model


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

    # Override username field to remove uniqueness validation
    username = serializers.CharField(
        max_length=150,
        required=False,
        allow_blank=False,
    )

    class Meta(UserDetailsSerializer.Meta):
        model = User
        fields = [
            "id",
            "email",
            "username",
            "profile",
        ]

    def validate_username(self, value):
        """
        Override validate_username to allow non-unique usernames
        """
        # No uniqueness check - just return the value
        return value

    def update(self, instance, validated_data):
        """
        Update user instance
        """
        # Update username if provided
        if "username" in validated_data:
            instance.username = validated_data["username"]

        # Update email if provided (but keep uniqueness check for email)
        if "email" in validated_data:
            instance.email = validated_data["email"]

        instance.save()
        return instance


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

    def validate_username(self, value):
        """
        Override validate_username to allow non-unique usernames
        """
        # No uniqueness check - just return the value
        return value

    def validate_email(self, email):
        """Validate that email is unique"""
        User = get_user_model()
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError(
                "A user is already registered with this email address."
            )
        return email

    def get_cleaned_data(self):
        """
        Get cleaned data including username
        """
        data = super().get_cleaned_data()
        data["username"] = self.validated_data.get("username")
        return data

    def save(self, request):
        """
        Save user with username
        """
        username = self.validated_data.get("username", "").strip()

        # Call parent save to create the user
        user = super().save(request)

        # Explicitly set username
        user.username = username
        user.save()

        return user
