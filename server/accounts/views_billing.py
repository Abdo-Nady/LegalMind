from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.utils import timezone

from .models_billing import (
    Plan,
    Subscription,
    UsageTracking,
    EgyptianLawSelection
)
from .serializers_billing import (
    PlanSerializer,
    SubscriptionSerializer,
    UsageTrackingSerializer,
    EgyptianLawSelectionSerializer,
    EgyptianLawSerializer,
    UpgradePlanSerializer
)
from ai_api.models import EgyptianLaw


class PlanViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for viewing available plans
    GET /api/billing/plans/ - List all plans
    GET /api/billing/plans/{name}/ - Get specific plan
    """
    queryset = Plan.objects.all()
    serializer_class = PlanSerializer
    permission_classes = [AllowAny]  # Anyone can view plans
    lookup_field = 'name'


class SubscriptionViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing user subscriptions
    GET /api/billing/subscription/me/ - Get current user's subscription
    POST /api/billing/subscription/upgrade/ - Upgrade/change plan
    POST /api/billing/subscription/cancel/ - Cancel subscription
    """
    serializer_class = SubscriptionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Users can only see their own subscription"""
        return Subscription.objects.filter(user=self.request.user)

    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get current user's subscription details"""
        try:
            subscription = request.user.subscription
            serializer = self.get_serializer(subscription)
            return Response(serializer.data)
        except Subscription.DoesNotExist:
            return Response(
                {'error': 'No subscription found'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['post'])
    def upgrade(self, request):
        """
        Upgrade or change subscription plan
        Body: { "plan": "standard" or "premium", "stripe_payment_method_id": "..." }
        """
        serializer = UpgradePlanSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        plan_name = serializer.validated_data['plan']
        stripe_payment_method_id = serializer.validated_data.get('stripe_payment_method_id')

        try:
            new_plan = Plan.objects.get(name=plan_name)
            subscription = request.user.subscription

            # Check if downgrading to free
            if plan_name == 'free':
                # TODO: Handle refund logic if applicable
                subscription.plan = new_plan
                subscription.status = 'active'
                subscription.end_date = None
                subscription.save()

                # Remove Egyptian law selections if downgrading from Standard
                EgyptianLawSelection.objects.filter(subscription=subscription).delete()

                return Response({
                    'message': 'Successfully downgraded to Free plan',
                    'subscription': SubscriptionSerializer(subscription).data
                })

            # For paid plans, require payment method
            if not stripe_payment_method_id and plan_name != 'free':
                return Response(
                    {'error': 'Payment method required for paid plans'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # TODO: Process Stripe payment here
            # For now, just update the plan
            subscription.plan = new_plan
            subscription.status = 'active'
            subscription.start_date = timezone.now()
            # Set end date to 30 days from now
            subscription.end_date = timezone.now() + timezone.timedelta(days=30)
            subscription.save()

            # If downgrading from Premium/Standard, may need to clean up law selections
            max_laws = new_plan.max_egyptian_laws or 0
            if new_plan.max_egyptian_laws == 0:
                EgyptianLawSelection.objects.filter(subscription=subscription).delete()
            elif new_plan.max_egyptian_laws and new_plan.max_egyptian_laws > 0:
                # Keep only the allowed number of selections
                selections = EgyptianLawSelection.objects.filter(
                    subscription=subscription
                ).order_by('-selected_at')
                to_delete = selections[max_laws:]
                for sel in to_delete:
                    sel.delete()

            return Response({
                'message': f'Successfully upgraded to {new_plan.display_name} plan',
                'subscription': SubscriptionSerializer(subscription).data
            })

        except Plan.DoesNotExist:
            return Response(
                {'error': 'Plan not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Subscription.DoesNotExist:
            return Response(
                {'error': 'No subscription found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'])
    def cancel(self, request):
        """Cancel current subscription (downgrade to free)"""
        try:
            subscription = request.user.subscription
            free_plan = Plan.objects.get(name='free')

            subscription.plan = free_plan
            subscription.status = 'cancelled'
            subscription.end_date = timezone.now()
            subscription.save()

            # Remove Egyptian law selections
            EgyptianLawSelection.objects.filter(subscription=subscription).delete()

            return Response({
                'message': 'Subscription cancelled successfully',
                'subscription': SubscriptionSerializer(subscription).data
            })
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def usage_stats(request):
    """
    Get current user's usage statistics
    GET /api/billing/usage/
    """
    usage = UsageTracking.get_or_create_today(request.user)
    serializer = UsageTrackingSerializer(usage, context={'request': request})
    return Response(serializer.data)


class EgyptianLawSelectionViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing Egyptian law selections (for Standard users)
    GET /api/billing/law-selections/ - List user's selected laws
    POST /api/billing/law-selections/ - Add a law selection
    DELETE /api/billing/law-selections/{id}/ - Remove a law selection
    """
    serializer_class = EgyptianLawSelectionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Users can only see their own selections"""
        try:
            subscription = self.request.user.subscription
            return EgyptianLawSelection.objects.filter(subscription=subscription)
        except Subscription.DoesNotExist:
            return EgyptianLawSelection.objects.none()

    def create(self, request, *args, **kwargs):
        """Add a new law selection"""
        try:
            subscription = request.user.subscription

            # Check if user's plan allows law selections
            if subscription.plan.max_egyptian_laws == 0:
                return Response(
                    {'error': 'Your plan does not include Egyptian law access'},
                    status=status.HTTP_403_FORBIDDEN
                )

            # Check if already at limit (for Standard users)
            if subscription.plan.max_egyptian_laws is not None:
                current_count = EgyptianLawSelection.objects.filter(
                    subscription=subscription
                ).count()
                if current_count >= subscription.plan.max_egyptian_laws:
                    return Response(
                        {'error': f'You can only select {subscription.plan.max_egyptian_laws} laws with your plan'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

            # Validate law exists
            law_slug = request.data.get('law')
            if not law_slug:
                return Response(
                    {'error': 'Law slug is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            try:
                law = EgyptianLaw.objects.get(slug=law_slug)
            except EgyptianLaw.DoesNotExist:
                return Response(
                    {'error': 'Law not found'},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Check if already selected
            if EgyptianLawSelection.objects.filter(
                subscription=subscription,
                law=law
            ).exists():
                return Response(
                    {'error': 'This law is already selected'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Create selection
            selection = EgyptianLawSelection.objects.create(
                subscription=subscription,
                law=law
            )
            serializer = self.get_serializer(selection)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Subscription.DoesNotExist:
            return Response(
                {'error': 'No subscription found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def available_egyptian_laws(request):
    """
    Get list of all available Egyptian laws
    GET /api/billing/egyptian-laws/
    """
    laws = EgyptianLaw.objects.filter(status='ready')
    serializer = EgyptianLawSerializer(laws, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_law_access(request, law_slug):
    """
    Check if user has access to a specific Egyptian law
    GET /api/billing/check-law-access/{law_slug}/
    """
    try:
        subscription = request.user.subscription
        plan = subscription.plan

        # Premium users have access to all laws
        if plan.max_egyptian_laws is None:
            return Response({'has_access': True})

        # Free users have no access
        if plan.max_egyptian_laws == 0:
            return Response({'has_access': False})

        # Standard users: check if law is in their selections
        has_selection = EgyptianLawSelection.objects.filter(
            subscription=subscription,
            law__slug=law_slug
        ).exists()

        return Response({'has_access': has_selection})

    except Subscription.DoesNotExist:
        return Response({'has_access': False})
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
