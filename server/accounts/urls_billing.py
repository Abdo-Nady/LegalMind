from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views_billing import (
    PlanViewSet,
    SubscriptionViewSet,
    EgyptianLawSelectionViewSet,
    usage_stats,
    available_egyptian_laws,
    check_law_access,
)

# Create router for viewsets
router = DefaultRouter()
router.register(r'plans', PlanViewSet, basename='plan')
router.register(r'subscription', SubscriptionViewSet, basename='subscription')
router.register(r'law-selections', EgyptianLawSelectionViewSet, basename='law-selection')

urlpatterns = [
    # Router URLs
    path('', include(router.urls)),

    # Additional function-based views
    path('usage/', usage_stats, name='usage-stats'),
    path('egyptian-laws/', available_egyptian_laws, name='egyptian-laws-list'),
    path('check-law-access/<str:law_slug>/', check_law_access, name='check-law-access'),
]
