from django.urls import path
from .views import (
    DocumentUploadView,
    DocumentListView,
    DocumentDetailView,
    DocumentChatView,
    DocumentClauseDetectionView,
    DocumentSummaryView,
    ChatSessionListView,
    ChatSessionDetailView,
)

urlpatterns = [
    # Document management
    path('documents/', DocumentListView.as_view(), name='document-list'),
    path('documents/upload/', DocumentUploadView.as_view(), name='document-upload'),
    path('documents/<int:pk>/', DocumentDetailView.as_view(), name='document-detail'),

    # Document AI features
    path('documents/<int:pk>/chat/', DocumentChatView.as_view(), name='document-chat'),
    path('documents/<int:pk>/clauses/', DocumentClauseDetectionView.as_view(), name='document-clauses'),
    path('documents/<int:pk>/summary/', DocumentSummaryView.as_view(), name='document-summary'),

    # Chat sessions
    path('sessions/', ChatSessionListView.as_view(), name='session-list'),
    path('sessions/<int:pk>/', ChatSessionDetailView.as_view(), name='session-detail'),
]