from rest_framework import serializers
from .models_billing import Plan, Subscription, UsageTracking, EgyptianLawSelection
from ai_api.models import EgyptianLaw


class PlanSerializer(serializers.ModelSerializer):
    """Serializer for Plan model"""

    # Add computed fields for frontend display
    is_unlimited_documents = serializers.SerializerMethodField()
    is_unlimited_messages = serializers.SerializerMethodField()
    is_unlimited_laws = serializers.SerializerMethodField()

    class Meta:
        model = Plan
        fields = [
            'name',
            'display_name',
            'price',
            'max_documents',
            'max_messages_per_day',
            'max_egyptian_laws',
            'has_future_features',
            'is_unlimited_documents',
            'is_unlimited_messages',
            'is_unlimited_laws',
        ]

    def get_is_unlimited_documents(self, obj):
        return obj.max_documents is None

    def get_is_unlimited_messages(self, obj):
        return obj.max_messages_per_day is None

    def get_is_unlimited_laws(self, obj):
        return obj.max_egyptian_laws is None


class SubscriptionSerializer(serializers.ModelSerializer):
    """Serializer for Subscription model"""

    plan_details = PlanSerializer(source='plan', read_only=True)
    is_active = serializers.SerializerMethodField()
    user_email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = Subscription
        fields = [
            'id',
            'user',
            'user_email',
            'plan',
            'plan_details',
            'status',
            'start_date',
            'end_date',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['user', 'created_at', 'updated_at']

    def get_is_active(self, obj):
        return obj.is_active()


class UsageTrackingSerializer(serializers.ModelSerializer):
    """Serializer for Usage Tracking"""

    # Compute limits based on user's plan
    messages_limit = serializers.SerializerMethodField()
    documents_limit = serializers.SerializerMethodField()
    documents_used = serializers.SerializerMethodField()

    # Compute percentages
    messages_percentage = serializers.SerializerMethodField()
    documents_percentage = serializers.SerializerMethodField()

    class Meta:
        model = UsageTracking
        fields = [
            'date',
            'messages_count',
            'messages_limit',
            'messages_percentage',
            'total_documents_uploaded',
            'documents_used',
            'documents_limit',
            'documents_percentage',
        ]

    def get_messages_limit(self, obj):
        """Get daily message limit from user's plan"""
        try:
            subscription = obj.user.subscription
            return subscription.plan.max_messages_per_day
        except:
            return 20  # Default to free plan

    def get_documents_limit(self, obj):
        """Get total document limit from user's plan"""
        try:
            subscription = obj.user.subscription
            return subscription.plan.max_documents
        except:
            return 3  # Default to free plan

    def get_documents_used(self, obj):
        """Get actual number of documents user currently has"""
        return obj.user.documents.count()

    def get_messages_percentage(self, obj):
        """Calculate percentage of daily messages used"""
        limit = self.get_messages_limit(obj)
        if limit is None:  # Unlimited
            return 0
        if limit == 0:
            return 100
        return min(100, (obj.messages_count / limit) * 100)

    def get_documents_percentage(self, obj):
        """Calculate percentage of documents used"""
        limit = self.get_documents_limit(obj)
        if limit is None:  # Unlimited
            return 0
        if limit == 0:
            return 100
        used = self.get_documents_used(obj)
        return min(100, (used / limit) * 100)


class EgyptianLawSelectionSerializer(serializers.ModelSerializer):
    """Serializer for Egyptian Law Selection (for Standard users)"""

    law_title_en = serializers.CharField(source='law.title_en', read_only=True)
    law_title_ar = serializers.CharField(source='law.title_ar', read_only=True)
    law_slug = serializers.CharField(source='law.slug', read_only=True)

    class Meta:
        model = EgyptianLawSelection
        fields = [
            'id',
            'law',
            'law_slug',
            'law_title_en',
            'law_title_ar',
            'selected_at',
        ]

    def validate(self, data):
        """Validate that user can only select max 2 laws for Standard plan"""
        subscription = self.context.get('subscription')
        if subscription and subscription.plan.name == 'standard':
            # Check if already has 2 selections
            existing_count = EgyptianLawSelection.objects.filter(
                subscription=subscription
            ).count()
            if existing_count >= 2:
                raise serializers.ValidationError(
                    "Standard plan allows only 2 Egyptian law selections"
                )
        return data


class EgyptianLawSerializer(serializers.ModelSerializer):
    """Simplified serializer for Egyptian Law listing"""

    class Meta:
        model = EgyptianLaw
        fields = [
            'slug',
            'title_en',
            'title_ar',
            'description_en',
            'description_ar',
            'status',
            'page_count',
        ]


class UpgradePlanSerializer(serializers.Serializer):
    """Serializer for upgrading/changing subscription plan"""

    plan = serializers.ChoiceField(choices=['free', 'standard', 'premium'])
    stripe_payment_method_id = serializers.CharField(required=False, allow_blank=True)

    def validate_plan(self, value):
        """Validate plan exists"""
        if not Plan.objects.filter(name=value).exists():
            raise serializers.ValidationError(f"Plan '{value}' does not exist")
        return value
