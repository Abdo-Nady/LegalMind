from django.db import models
from django.contrib.auth.models import AbstractUser
from django.db.models.signals import post_save
from django.dispatch import receiver

class User(AbstractUser):
    """
    Custom User Model
    - Email (required & unique)
    - Password
    - Username (not unique)
    """

    id = models.BigAutoField(primary_key=True)
    email = models.EmailField(unique=True)
    # Override username to remove unique constraint
    username = models.CharField(
        max_length=150,
        unique=False,
    )

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]  # Username required during registration

    def __str__(self):
        return self.email

    class Meta:
        verbose_name = "User"
        verbose_name_plural = "Users"


class UserProfile(models.Model):
    """
    User Profile Model
    - OneToOne relationship with User
    - avatar image

    """

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    avatar = models.ImageField(upload_to="avatars/", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Profile of {self.user.email}"


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    if hasattr(instance, 'profile'):
        instance.profile.save()
