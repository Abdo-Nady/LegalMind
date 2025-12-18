from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status, generics
from rest_framework.parsers import MultiPartParser, FormParser
from .serializers import ChangePasswordSerializer, UserProfileSerializer

ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"]
MAX_AVATAR_SIZE = 5 * 1024 * 1024  # 5MB


class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    GET: Display the Profile
    PUT/PATCH: Update the Profile
    """

    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user.profile

    def get_serializer_context(self):
        """add request for context for avatar_url"""
        context = super().get_serializer_context()
        return context


class ChangePasswordView(APIView):
    """
    change password
    POST: old_password, new_password1, new_password2
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data, context={"request": request}
        )

        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Password changed successfully"}, status=status.HTTP_200_OK
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UploadAvatarView(APIView):
    """
    upload avatar
    POST: avatar (file)
    """

    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        profile = request.user.profile
        avatar = request.FILES.get("avatar")

        # Validate presence
        if not avatar:
            return Response(
                {"error": "No avatar file provided"}, status=status.HTTP_400_BAD_REQUEST
            )

        # Validate file type
        if avatar.content_type not in ALLOWED_IMAGE_TYPES:
            return Response(
                {"error": "Unsupported file type"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        # Validate file size
        if avatar.size > MAX_AVATAR_SIZE:
            return Response(
                {"error": "Avatar file size exceeds the maximum limit of 5MB"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # delete old avatar
        if profile.avatar:
            profile.avatar.delete(save=False)

        profile.avatar = avatar
        profile.save()

        serializer = UserProfileSerializer(profile, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request):
        """delete avatar"""
        profile = request.user.profile

        if profile.avatar:
            profile.avatar.delete(save=False)
            profile.avatar = None
            profile.save()
            return Response(
                {"message": "Avatar deleted successfully"}, status=status.HTTP_200_OK
            )

        return Response(
            {"error": "No avatar to delete"}, status=status.HTTP_400_BAD_REQUEST
        )
