from django.contrib import admin
from .models import (
    Document, DocumentChunk, ChatSession, ChatMessage,
    EgyptianLaw, EgyptianLawChunk, LawChatSession, LawChatMessage
)


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'status', 'page_count', 'uploaded_at']
    list_filter = ['status', 'uploaded_at']
    search_fields = ['title', 'user__email']
    readonly_fields = ['uploaded_at', 'processed_at']


@admin.register(DocumentChunk)
class DocumentChunkAdmin(admin.ModelAdmin):
    list_display = ['document', 'chunk_index', 'page_number']
    list_filter = ['document']
    search_fields = ['content']


@admin.register(ChatSession)
class ChatSessionAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'document', 'created_at', 'updated_at']
    list_filter = ['created_at']
    search_fields = ['title', 'user__email', 'document__title']


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ['session', 'role', 'created_at', 'short_content']
    list_filter = ['role', 'created_at']
    search_fields = ['content']

    def short_content(self, obj):
        return obj.content[:50] + "..." if len(obj.content) > 50 else obj.content
    short_content.short_description = 'Content'


# Egyptian Law Admin

@admin.register(EgyptianLaw)
class EgyptianLawAdmin(admin.ModelAdmin):
    list_display = ['slug', 'title_en', 'title_ar', 'status', 'page_count', 'chunk_count', 'seeded_at']
    list_filter = ['status', 'seeded_at']
    search_fields = ['slug', 'title_en', 'title_ar']
    readonly_fields = ['seeded_at']
    ordering = ['title_en']


@admin.register(EgyptianLawChunk)
class EgyptianLawChunkAdmin(admin.ModelAdmin):
    list_display = ['law', 'chunk_index', 'page_number']
    list_filter = ['law']
    search_fields = ['content']


@admin.register(LawChatSession)
class LawChatSessionAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'law', 'created_at', 'updated_at']
    list_filter = ['law', 'created_at']
    search_fields = ['title', 'user__email', 'law__title_en']


@admin.register(LawChatMessage)
class LawChatMessageAdmin(admin.ModelAdmin):
    list_display = ['session', 'role', 'created_at', 'short_content']
    list_filter = ['role', 'created_at']
    search_fields = ['content']

    def short_content(self, obj):
        return obj.content[:50] + "..." if len(obj.content) > 50 else obj.content
    short_content.short_description = 'Content'
