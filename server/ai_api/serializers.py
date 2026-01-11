from rest_framework import serializers
from .models import (
    Document, DocumentChunk, ChatSession, ChatMessage,
    EgyptianLaw, EgyptianLawChunk, LawChatSession, LawChatMessage
)


class DocumentChunkSerializer(serializers.ModelSerializer):
    """Serializer for document chunks with source citation info."""

    class Meta:
        model = DocumentChunk
        fields = ['id', 'chunk_index', 'page_number', 'content']


class DocumentSerializer(serializers.ModelSerializer):
    """Serializer for document metadata."""
    chunk_count = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = [
            'id', 'title', 'file', 'status',
            'page_count', 'chunk_count',
            'uploaded_at', 'processed_at'
        ]
        read_only_fields = ['id', 'status', 'page_count', 'uploaded_at', 'processed_at']

    def get_chunk_count(self, obj):
        return obj.chunks.count()


class DocumentUploadSerializer(serializers.ModelSerializer):
    """Serializer for document upload endpoint."""

    class Meta:
        model = Document
        fields = ['id', 'title', 'file', 'status', 'uploaded_at']
        read_only_fields = ['id', 'status', 'uploaded_at']

    def validate_file(self, value):
        """Validate that the uploaded file is a PDF."""
        if not value.name.lower().endswith('.pdf'):
            raise serializers.ValidationError("Only PDF files are allowed.")
        # Max file size: 50MB
        max_size = 50 * 1024 * 1024
        if value.size > max_size:
            raise serializers.ValidationError("File size must be under 50MB.")
        return value


class ChatMessageSerializer(serializers.ModelSerializer):
    """Serializer for individual chat messages."""

    class Meta:
        model = ChatMessage
        fields = ['id', 'role', 'content', 'sources', 'created_at']
        read_only_fields = ['id', 'created_at']


class ChatSessionSerializer(serializers.ModelSerializer):
    """Serializer for chat sessions with message history."""
    messages = ChatMessageSerializer(many=True, read_only=True)
    document_title = serializers.CharField(source='document.title', read_only=True)

    class Meta:
        model = ChatSession
        fields = [
            'id', 'document', 'document_title', 'title',
            'created_at', 'updated_at', 'messages'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ChatSessionListSerializer(serializers.ModelSerializer):
    """Lighter serializer for listing chat sessions (without messages)."""
    document_title = serializers.CharField(source='document.title', read_only=True)
    message_count = serializers.SerializerMethodField()

    class Meta:
        model = ChatSession
        fields = [
            'id', 'document', 'document_title', 'title',
            'message_count', 'created_at', 'updated_at'
        ]

    def get_message_count(self, obj):
        return obj.messages.count()


class ChatQuerySerializer(serializers.Serializer):
    """Serializer for chat query requests."""
    query = serializers.CharField(
        max_length=2000,
        help_text="The question to ask about the document"
    )
    session_id = serializers.IntegerField(
        required=False,
        help_text="Optional session ID to continue an existing conversation"
    )


class ChatResponseSerializer(serializers.Serializer):
    """Serializer for chat response."""
    answer = serializers.CharField()
    sources = serializers.ListField(
        child=serializers.DictField(),
        required=False
    )
    session_id = serializers.IntegerField()
    message_id = serializers.IntegerField()


class ClauseDetectionSerializer(serializers.Serializer):
    """Serializer for clause detection response."""
    clauses = serializers.ListField(
        child=serializers.DictField()
    )
    analysis = serializers.CharField()


class DocumentSummarySerializer(serializers.Serializer):
    """Serializer for document summary response."""
    summary = serializers.CharField()
    key_points = serializers.ListField(
        child=serializers.CharField(),
        required=False
    )
    risks = serializers.ListField(
        child=serializers.DictField(),
        required=False
    )


# Egyptian Law Serializers

class EgyptianLawSerializer(serializers.ModelSerializer):
    """Full serializer for Egyptian law documents."""
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = EgyptianLaw
        fields = [
            'slug', 'title_en', 'title_ar',
            'description_en', 'description_ar',
            'status', 'page_count', 'chunk_count',
            'file_url', 'seeded_at'
        ]

    def get_file_url(self, obj):
        """Return URL to the PDF file."""
        request = self.context.get('request')
        if request and obj.status == 'ready':
            return request.build_absolute_uri(
                f'/law-pdfs/{obj.file_path}'
            )
        return None


class EgyptianLawListSerializer(serializers.ModelSerializer):
    """Lighter serializer for listing Egyptian laws."""

    class Meta:
        model = EgyptianLaw
        fields = [
            'slug', 'title_en', 'title_ar',
            'description_en', 'description_ar',
            'status', 'page_count'
        ]


class LawChatMessageSerializer(serializers.ModelSerializer):
    """Serializer for law chat messages."""

    class Meta:
        model = LawChatMessage
        fields = ['id', 'role', 'content', 'sources', 'created_at']
        read_only_fields = ['id', 'created_at']


class LawChatSessionSerializer(serializers.ModelSerializer):
    """Serializer for law chat sessions with message history."""
    messages = LawChatMessageSerializer(many=True, read_only=True)
    law_title = serializers.CharField(source='law.title_en', read_only=True)
    law_slug = serializers.CharField(source='law.slug', read_only=True)

    class Meta:
        model = LawChatSession
        fields = [
            'id', 'law_slug', 'law_title', 'title',
            'created_at', 'updated_at', 'messages'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class LawChatSessionListSerializer(serializers.ModelSerializer):
    """Lighter serializer for listing law chat sessions."""
    law_title = serializers.CharField(source='law.title_en', read_only=True)
    law_slug = serializers.CharField(source='law.slug', read_only=True)
    message_count = serializers.SerializerMethodField()

    class Meta:
        model = LawChatSession
        fields = [
            'id', 'law_slug', 'law_title', 'title',
            'message_count', 'created_at', 'updated_at'
        ]

    def get_message_count(self, obj):
        return obj.messages.count()
