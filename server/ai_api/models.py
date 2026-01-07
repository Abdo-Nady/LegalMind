from django.db import models
from django.conf import settings
import uuid
import os

def document_upload_path(instance, filename):
    """Generate a UUID-based filename to prevent collisions."""
    ext = filename.split('.')[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    return os.path.join('documents/', filename)


class Document(models.Model):
    """
    Stores uploaded legal PDF documents.
    Each document belongs to a user and tracks processing status.
    """
    STATUS_CHOICES = [
        ('uploaded', 'Uploaded'),
        ('processing', 'Processing'),
        ('ready', 'Ready'),
        ('failed', 'Failed'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='documents'
    )
    title = models.CharField(max_length=255, blank=True)
    file = models.FileField(upload_to=document_upload_path)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='uploaded'
    )
    page_count = models.IntegerField(null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-uploaded_at']

    def __str__(self):
        return self.title or self.file.name


class DocumentChunk(models.Model):
    """
    Stores text chunks extracted from documents for RAG retrieval.
    Each chunk contains content and metadata for citation purposes.
    """
    document = models.ForeignKey(
        Document,
        on_delete=models.CASCADE,
        related_name='chunks'
    )
    content = models.TextField()
    chunk_index = models.IntegerField()
    page_number = models.IntegerField(null=True, blank=True)
    # Store the vector store document ID for retrieval reference
    vector_id = models.CharField(max_length=255, null=True, blank=True)

    class Meta:
        ordering = ['chunk_index']

    def __str__(self):
        return f"{self.document.title} - Chunk {self.chunk_index}"


class ChatSession(models.Model):
    """
    Represents a chat conversation with a specific document.
    Allows users to have multiple chat sessions per document.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='chat_sessions'
    )
    document = models.ForeignKey(
        Document,
        on_delete=models.CASCADE,
        related_name='chat_sessions'
    )
    title = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f"Chat: {self.document.title} - {self.created_at}"


class ChatMessage(models.Model):
    """
    Individual messages within a chat session.
    Stores both user queries and AI responses with source citations.
    """
    ROLE_CHOICES = [
        ('user', 'User'),
        ('assistant', 'Assistant'),
    ]

    session = models.ForeignKey(
        ChatSession,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    content = models.TextField()
    # Store source citations as JSON for assistant messages
    sources = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.role}: {self.content[:50]}..."
