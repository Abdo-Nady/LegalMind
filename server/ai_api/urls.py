from django.urls import path
from .views import (
    # Document views
    DocumentUploadView,
    DocumentListView,
    DocumentDetailView,
    DocumentChatView,
    DocumentClauseDetectionView,
    DocumentSummaryView,
    ChatSessionListView,
    ChatSessionDetailView,
    # Egyptian Law views
    EgyptianLawListView,
    EgyptianLawDetailView,
    EgyptianLawChatView,
    EgyptianLawClauseDetectionView,
    EgyptianLawSummaryView,
    LawChatSessionListView,
    LawChatSessionDetailView,
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

    # Chat sessions (user documents)
    path('sessions/', ChatSessionListView.as_view(), name='session-list'),
    path('sessions/<int:pk>/', ChatSessionDetailView.as_view(), name='session-detail'),

    # Egyptian Laws
    path('laws/', EgyptianLawListView.as_view(), name='law-list'),
    path('laws/sessions/', LawChatSessionListView.as_view(), name='law-session-list'),
    path('laws/sessions/<int:pk>/', LawChatSessionDetailView.as_view(), name='law-session-detail'),
    path('laws/<slug:slug>/', EgyptianLawDetailView.as_view(), name='law-detail'),
    path('laws/<slug:slug>/chat/', EgyptianLawChatView.as_view(), name='law-chat'),
    path('laws/<slug:slug>/clauses/', EgyptianLawClauseDetectionView.as_view(), name='law-clauses'),
    path('laws/<slug:slug>/summary/', EgyptianLawSummaryView.as_view(), name='law-summary'),
]
