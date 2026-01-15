"""
Custom permissions and decorators for plan limits
"""
from functools import wraps
from rest_framework import status
from rest_framework.response import Response
from .models_billing import UsageTracking
from ai_api.models import Document


def check_document_limit(view_func):
    """
    Decorator to check if user can upload more documents
    Based on their subscription plan
    Works with both function-based and class-based views
    """
    @wraps(view_func)
    def wrapper(self_or_request, *args, **kwargs):
        # Handle both class-based views (self, request) and function-based views (request)
        if hasattr(self_or_request, 'user'):
            # Function-based view: first arg is request
            request = self_or_request
        else:
            # Class-based view: first arg is self, second is request
            request = args[0] if args else kwargs.get('request')

        user = request.user

        if not user.is_authenticated:
            return Response(
                {'error': 'Authentication required'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        try:
            subscription = user.subscription
            plan = subscription.plan

            # Get current document count
            current_docs = Document.objects.filter(user=user).count()

            # Check limit (None means unlimited)
            if plan.max_documents is not None:
                if current_docs >= plan.max_documents:
                    return Response({
                        'error': 'Document limit reached',
                        'detail': f'Your {plan.display_name} plan allows maximum {plan.max_documents} documents',
                        'current_count': current_docs,
                        'limit': plan.max_documents,
                        'upgrade_required': True
                    }, status=status.HTTP_403_FORBIDDEN)

            # Continue with the view
            return view_func(self_or_request, *args, **kwargs)

        except Exception as e:
            return Response(
                {'error': 'Failed to check document limit', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    return wrapper


def check_message_limit(view_func):
    """
    Decorator to check if user can send more messages today
    Based on their subscription plan
    Works with both function-based and class-based views
    """
    @wraps(view_func)
    def wrapper(self_or_request, *args, **kwargs):
        # Handle both class-based views (self, request) and function-based views (request)
        if hasattr(self_or_request, 'user'):
            # Function-based view: first arg is request
            request = self_or_request
        else:
            # Class-based view: first arg is self, second is request
            request = args[0] if args else kwargs.get('request')

        user = request.user

        if not user.is_authenticated:
            return Response(
                {'error': 'Authentication required'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        try:
            subscription = user.subscription
            plan = subscription.plan

            # Get today's usage
            usage = UsageTracking.get_or_create_today(user)

            # Check limit (None means unlimited)
            if plan.max_messages_per_day is not None:
                if usage.messages_count >= plan.max_messages_per_day:
                    return Response({
                        'error': 'Daily message limit reached',
                        'detail': f'Your {plan.display_name} plan allows {plan.max_messages_per_day} messages per day',
                        'current_count': usage.messages_count,
                        'limit': plan.max_messages_per_day,
                        'upgrade_required': True,
                        'resets_at': 'midnight UTC'
                    }, status=status.HTTP_429_TOO_MANY_REQUESTS)

            # Increment message count
            usage.increment_messages()

            # Continue with the view
            return view_func(self_or_request, *args, **kwargs)

        except Exception as e:
            return Response(
                {'error': 'Failed to check message limit', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    return wrapper


def check_egyptian_law_access(view_func):
    """
    Decorator to check if user has access to Egyptian laws
    Free: no access
    Standard: 2 selected laws only
    Premium: all laws
    Works with both function-based and class-based views
    """
    @wraps(view_func)
    def wrapper(self_or_request, *args, **kwargs):
        # Handle both class-based views (self, request) and function-based views (request)
        if hasattr(self_or_request, 'user'):
            # Function-based view: first arg is request
            request = self_or_request
        else:
            # Class-based view: first arg is self, second is request
            request = args[0] if args else kwargs.get('request')

        user = request.user

        if not user.is_authenticated:
            return Response(
                {'error': 'Authentication required'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        try:
            subscription = user.subscription
            plan = subscription.plan

            # Free users have no access
            if plan.max_egyptian_laws == 0:
                return Response({
                    'error': 'Egyptian law access not available',
                    'detail': f'Your {plan.display_name} plan does not include Egyptian law access',
                    'upgrade_required': True
                }, status=status.HTTP_403_FORBIDDEN)

            # For Standard users, check if accessing a selected law
            # This check will be done in the view itself since we need law_slug
            # Premium users (max_egyptian_laws = None) have full access

            # Continue with the view
            return view_func(self_or_request, *args, **kwargs)

        except Exception as e:
            return Response(
                {'error': 'Failed to check law access', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    return wrapper


def has_egyptian_law_access(user, law_slug=None):
    """
    Helper function to check if user has access to Egyptian laws
    If law_slug provided, checks specific law access for Standard users
    Returns (has_access, error_message)
    """
    try:
        subscription = user.subscription
        plan = subscription.plan

        # Free users have no access
        if plan.max_egyptian_laws == 0:
            return False, f'Your {plan.display_name} plan does not include Egyptian law access'

        # Premium users have full access
        if plan.max_egyptian_laws is None:
            return True, None

        # Standard users: check specific law if provided
        if law_slug:
            from .models_billing import EgyptianLawSelection
            has_selection = EgyptianLawSelection.objects.filter(
                subscription=subscription,
                law__slug=law_slug
            ).exists()

            if not has_selection:
                return False, f'You do not have access to this law. Please select it in your law selections (max {plan.max_egyptian_laws})'

        return True, None

    except Exception as e:
        return False, f'Failed to check law access: {str(e)}'


def increment_document_count(user):
    """
    Helper function to increment user's total document count
    Should be called after successful document upload
    """
    try:
        usage = UsageTracking.get_or_create_today(user)
        usage.increment_documents()
        return True
    except Exception:
        return False
