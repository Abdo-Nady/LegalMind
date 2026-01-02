"""
API Views for DocuMind RAG System.

Provides endpoints for:
- Document upload and management
- Chat with documents using RAG
- Legal clause detection
- Document summarization
"""
import os

from rest_framework.views import APIView
from rest_framework.generics import ListAPIView, RetrieveDestroyAPIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from .models import Document, ChatSession, ChatMessage
from .serializers import (
    DocumentSerializer,
    DocumentUploadSerializer,
    ChatSessionSerializer,
    ChatSessionListSerializer,
    ChatQuerySerializer,
    ChatResponseSerializer,
)
from .langchain_config import (
    get_document_vector_store,
    get_legal_rag_chain,
    get_clause_detection_chain,
    get_summary_chain,
    delete_document_vectors,
)
from .tasks import process_pdf_document


class DocumentUploadView(APIView):
    """
    POST /api/ai/documents/upload/

    Upload a PDF document for processing.
    Extracts text, chunks it, generates embeddings, and stores in vector DB.
    """
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = [IsAuthenticated]
    throttle_scope = 'upload'

    def post(self, request):
        serializer = DocumentUploadSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Create document record
            doc = serializer.save(user=request.user, status='processing')

            # Set title from filename if not provided
            if not doc.title:
                # Extract just the filename without the path
                filename = os.path.basename(doc.file.name)
                doc.title = filename.replace('.pdf', '').replace('_', ' ').title()
                doc.save()

            # Queue PDF processing task asynchronously
            process_pdf_document.delay(doc.id)

            # Return immediately with document info
            return Response(
                DocumentSerializer(doc).data,
                status=status.HTTP_201_CREATED
            )

        except Exception as e:
            # Mark document as failed if errors occur
            if 'doc' in locals():
                doc.status = 'failed'
                doc.save()
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class DocumentListView(ListAPIView):
    """
    GET /api/ai/documents/

    List all documents for the authenticated user.
    """
    serializer_class = DocumentSerializer
    permission_classes = [IsAuthenticated]
    throttle_scope = 'read'

    def get_queryset(self):
        return Document.objects.filter(user=self.request.user)


class DocumentDetailView(RetrieveDestroyAPIView):
    """
    GET /api/ai/documents/<id>/
    DELETE /api/ai/documents/<id>/

    Retrieve or delete a specific document.
    """
    serializer_class = DocumentSerializer
    permission_classes = [IsAuthenticated]
    throttle_scope = 'read'

    def get_queryset(self):
        return Document.objects.filter(user=self.request.user)

    def perform_destroy(self, instance):
        # Delete vectors from ChromaDB
        delete_document_vectors(instance.id)
        # Delete the file
        if instance.file:
            instance.file.delete()
        # Delete the database record
        instance.delete()


class DocumentChatView(APIView):
    """
    POST /api/ai/documents/<id>/chat/

    Chat with a specific document using RAG.

    Request body:
    {
        "query": "What are the termination clauses?",
        "session_id": 123  // optional, to continue existing session
    }
    """
    permission_classes = [IsAuthenticated]
    throttle_scope = 'chat'

    def post(self, request, pk):
        # Validate request
        serializer = ChatQuerySerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Get document
        try:
            doc = Document.objects.get(pk=pk, user=request.user)
        except Document.DoesNotExist:
            return Response(
                {"error": "Document not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        if doc.status != 'ready':
            return Response(
                {"error": f"Document is not ready for chat. Status: {doc.status}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        query = serializer.validated_data['query']
        session_id = serializer.validated_data.get('session_id')

        try:
            # Get or create chat session
            if session_id:
                try:
                    session = ChatSession.objects.get(
                        pk=session_id,
                        user=request.user,
                        document=doc
                    )
                except ChatSession.DoesNotExist:
                    return Response(
                        {"error": "Chat session not found"},
                        status=status.HTTP_404_NOT_FOUND
                    )
            else:
                session = ChatSession.objects.create(
                    user=request.user,
                    document=doc,
                    title=query[:50] + "..." if len(query) > 50 else query
                )

            # Save user message
            user_message = ChatMessage.objects.create(
                session=session,
                role='user',
                content=query
            )

            # Get RAG response
            vector_store = get_document_vector_store(doc.id)
            rag_chain = get_legal_rag_chain(vector_store)
            result = rag_chain.invoke(query)

            answer = result.get("answer", "")

            # Extract source information
            sources = []
            retrieved_docs = result.get("retrieved_docs", [])
            for source_doc in retrieved_docs:
                sources.append({
                    "content": source_doc.page_content[:200] + "...",
                    "page": source_doc.metadata.get("page_number", "N/A"),
                    "chunk_index": source_doc.metadata.get("chunk_index", "N/A"),
                })

            # Save assistant message
            assistant_message = ChatMessage.objects.create(
                session=session,
                role='assistant',
                content=answer,
                sources=sources
            )

            # Update session timestamp
            session.save()

            return Response({
                "answer": answer,
                "sources": sources,
                "session_id": session.id,
                "message_id": assistant_message.id,
            })

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class DocumentClauseDetectionView(APIView):
    """
    POST /api/ai/documents/<id>/clauses/

    Detect and analyze legal clauses in a document.
    """
    permission_classes = [IsAuthenticated]
    throttle_scope = 'ai_analysis'

    def post(self, request, pk):
        try:
            doc = Document.objects.get(pk=pk, user=request.user)
        except Document.DoesNotExist:
            return Response(
                {"error": "Document not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        if doc.status != 'ready':
            return Response(
                {"error": f"Document is not ready. Status: {doc.status}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            vector_store = get_document_vector_store(doc.id)
            clause_chain = get_clause_detection_chain(vector_store)

            analysis = clause_chain.invoke(
                "Identify and analyze all key legal clauses in this document. "
                "Include termination, confidentiality, liability, indemnity, "
                "payment terms, jurisdiction, and any other important clauses."
            )

            return Response({
                "analysis": analysis,
                "document_id": doc.id,
                "document_title": doc.title,
            })

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class DocumentSummaryView(APIView):
    """
    POST /api/ai/documents/<id>/summary/

    Generate an executive summary of a document.
    """
    permission_classes = [IsAuthenticated]
    throttle_scope = 'ai_analysis'

    def post(self, request, pk):
        try:
            doc = Document.objects.get(pk=pk, user=request.user)
        except Document.DoesNotExist:
            return Response(
                {"error": "Document not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        if doc.status != 'ready':
            return Response(
                {"error": f"Document is not ready. Status: {doc.status}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            vector_store = get_document_vector_store(doc.id)
            summary_chain = get_summary_chain(vector_store)

            summary = summary_chain.invoke(
                "Generate a comprehensive executive summary of this legal document."
            )

            return Response({
                "summary": summary,
                "document_id": doc.id,
                "document_title": doc.title,
            })

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ChatSessionListView(ListAPIView):
    """
    GET /api/ai/sessions/

    List all chat sessions for the authenticated user.
    """
    serializer_class = ChatSessionListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ChatSession.objects.filter(user=self.request.user)


class ChatSessionDetailView(RetrieveDestroyAPIView):
    """
    GET /api/ai/sessions/<id>/
    DELETE /api/ai/sessions/<id>/

    Retrieve or delete a chat session with full message history.
    """
    serializer_class = ChatSessionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ChatSession.objects.filter(user=self.request.user)
