from django.db import models
from django.conf import settings
from django.utils import timezone
from datetime import timedelta


class Plan(models.Model):
    """
    Subscription Plans: Free, Standard, Premium
    """
    PLAN_CHOICES = [
        ('free', 'Free'),
        ('standard', 'Standard'),
        ('premium', 'Premium'),
    ]

    name = models.CharField(max_length=20, choices=PLAN_CHOICES, unique=True, primary_key=True)
    display_name = models.CharField(max_length=50)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # Document limits
    max_documents = models.IntegerField(null=True, blank=True)  # null = unlimited

    # Message limits
    max_messages_per_day = models.IntegerField(null=True, blank=True)  # null = unlimited

    # Egyptian Law access
    max_egyptian_laws = models.IntegerField(null=True, blank=True, default=0)  # 0 = none, null = unlimited

    # Features
    has_future_features = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Plan"
        verbose_name_plural = "Plans"

    def __str__(self):
        return self.display_name


class Subscription(models.Model):
    """
    User Subscription Model
    Links users to their current plan
    """
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('cancelled', 'Cancelled'),
        ('expired', 'Expired'),
        ('trial', 'Trial'),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='subscription'
    )
    plan = models.ForeignKey(
        Plan,
        on_delete=models.PROTECT,
        related_name='subscriptions'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')

    start_date = models.DateTimeField(default=timezone.now)
    end_date = models.DateTimeField(null=True, blank=True)

    # Stripe/Payment details
    stripe_subscription_id = models.CharField(max_length=255, null=True, blank=True)
    stripe_customer_id = models.CharField(max_length=255, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Subscription"
        verbose_name_plural = "Subscriptions"

    def __str__(self):
        return f"{self.user.email} - {self.plan.display_name}"

    def is_active(self):
        """Check if subscription is currently active"""
        if self.status != 'active':
            return False
        if self.end_date and self.end_date < timezone.now():
            return False
        return True

    def renew(self, months=1):
        """Renew subscription for given months"""
        if not self.end_date:
            self.end_date = timezone.now()
        self.end_date += timedelta(days=30 * months)
        self.status = 'active'
        self.save()


class UsageTracking(models.Model):
    """
    Track user usage per day for rate limiting
    Resets daily at midnight
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='usage_tracking'
    )
    date = models.DateField(default=timezone.now)

    # Daily counters
    messages_count = models.IntegerField(default=0)

    # Total counters (lifetime)
    total_documents_uploaded = models.IntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Usage Tracking"
        verbose_name_plural = "Usage Tracking"
        unique_together = ['user', 'date']
        ordering = ['-date']

    def __str__(self):
        return f"{self.user.email} - {self.date}"

    @staticmethod
    def get_or_create_today(user):
        """Get or create usage tracking for today"""
        today = timezone.now().date()
        usage, created = UsageTracking.objects.get_or_create(
            user=user,
            date=today
        )
        return usage

    def increment_messages(self):
        """Increment daily message count"""
        self.messages_count += 1
        self.save()

    def increment_documents(self):
        """Increment total document count"""
        self.total_documents_uploaded += 1
        self.save()


class EgyptianLawSelection(models.Model):
    """
    For Standard users: Track their 2 selected Egyptian laws
    They can change these selections each subscription renewal
    """
    from ai_api.models import EgyptianLaw

    subscription = models.ForeignKey(
        Subscription,
        on_delete=models.CASCADE,
        related_name='law_selections'
    )
    law = models.ForeignKey(
        'ai_api.EgyptianLaw',
        on_delete=models.CASCADE,
        related_name='user_selections'
    )
    selected_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Egyptian Law Selection"
        verbose_name_plural = "Egyptian Law Selections"
        unique_together = ['subscription', 'law']

    def __str__(self):
        return f"{self.subscription.user.email} - {self.law.title_en}"
