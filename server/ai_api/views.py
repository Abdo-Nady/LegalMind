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

from .models import (
    Document, ChatSession, ChatMessage,
    EgyptianLaw, LawChatSession, LawChatMessage
)
from .serializers import (
    DocumentSerializer,
    DocumentUploadSerializer,
    ChatSessionSerializer,
    ChatSessionListSerializer,
    ChatQuerySerializer,
    ChatResponseSerializer,
    EgyptianLawSerializer,
    EgyptianLawListSerializer,
    LawChatSessionSerializer,
    LawChatSessionListSerializer,
)
from .langchain_config import (
    get_document_vector_store,
    get_legal_rag_chain,
    get_egyptian_law_rag_chain,
    get_clause_detection_chain,
    get_summary_chain,
    delete_document_vectors,
    get_law_vector_store,
    get_arabic_summary_chain,
    get_arabic_clauses_chain,
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
    GET /api/ai/documents/?search=query

    List all documents for the authenticated user.
    Supports optional 'search' query parameter to filter by title.
    """
    serializer_class = DocumentSerializer
    permission_classes = [IsAuthenticated]
    throttle_scope = 'read'

    def get_queryset(self):
        queryset = Document.objects.filter(user=self.request.user)

        # Support search query parameter
        search_query = self.request.query_params.get('search', None)
        if search_query:
            queryset = queryset.filter(title__icontains=search_query)

        return queryset.order_by('-uploaded_at')


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


# ============================================
# Egyptian Law Views
# ============================================

class EgyptianLawListView(ListAPIView):
    """
    GET /api/ai/laws/

    List all available Egyptian law documents.
    Only shows laws with 'ready' status (fully seeded).
    """
    serializer_class = EgyptianLawListSerializer
    permission_classes = [IsAuthenticated]
    throttle_scope = 'read'

    def get_queryset(self):
        return EgyptianLaw.objects.filter(status='ready')


class EgyptianLawDetailView(APIView):
    """
    GET /api/ai/laws/<slug>/

    Get details of a specific Egyptian law document.
    """
    permission_classes = [IsAuthenticated]
    throttle_scope = 'read'

    def get(self, request, slug):
        try:
            law = EgyptianLaw.objects.get(slug=slug)
        except EgyptianLaw.DoesNotExist:
            return Response(
                {"error": "Law not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = EgyptianLawSerializer(law, context={'request': request})
        return Response(serializer.data)


class EgyptianLawChatView(APIView):
    """
    POST /api/ai/laws/<slug>/chat/

    Chat with a specific Egyptian law using RAG.

    Request body:
    {
        "query": "What are the worker's rights?",
        "session_id": 123  // optional
    }
    """
    permission_classes = [IsAuthenticated]
    throttle_scope = 'chat'

    def post(self, request, slug):
        # Validate request
        serializer = ChatQuerySerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Get law
        try:
            law = EgyptianLaw.objects.get(slug=slug)
        except EgyptianLaw.DoesNotExist:
            return Response(
                {"error": "Law not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        if law.status != 'ready':
            return Response(
                {"error": f"Law is not ready for chat. Status: {law.status}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        query = serializer.validated_data['query']
        session_id = serializer.validated_data.get('session_id')

        try:
            # Get or create chat session
            if session_id:
                try:
                    session = LawChatSession.objects.get(
                        pk=session_id,
                        user=request.user,
                        law=law
                    )
                except LawChatSession.DoesNotExist:
                    return Response(
                        {"error": "Chat session not found"},
                        status=status.HTTP_404_NOT_FOUND
                    )
            else:
                session = LawChatSession.objects.create(
                    user=request.user,
                    law=law,
                    title=query[:50] + "..." if len(query) > 50 else query
                )

            # Save user message
            LawChatMessage.objects.create(
                session=session,
                role='user',
                content=query
            )

            # Get RAG response using Egyptian law specialized chain
            vector_store = get_law_vector_store(law.slug)
            rag_chain = get_egyptian_law_rag_chain(vector_store)
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
            assistant_message = LawChatMessage.objects.create(
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


class EgyptianLawClauseDetectionView(APIView):
    """
    POST /api/ai/laws/<slug>/clauses/

    Detect and analyze legal clauses in an Egyptian law.
    """
    permission_classes = [IsAuthenticated]
    throttle_scope = 'ai_analysis'

    def post(self, request, slug):
        try:
            law = EgyptianLaw.objects.get(slug=slug)
        except EgyptianLaw.DoesNotExist:
            return Response(
                {"error": "Law not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        if law.status != 'ready':
            return Response(
                {"error": f"Law is not ready. Status: {law.status}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            vector_store = get_law_vector_store(law.slug)
            # Use Arabic chain for Egyptian laws
            clause_chain = get_arabic_clauses_chain(vector_store)

            analysis = clause_chain.invoke({
                "input": "Identify and analyze all key legal provisions in this law. "
                         "Include articles related to rights, obligations, penalties, "
                         "procedures, and any other important provisions.",
                "title": law.title_ar
            })

            return Response({
                "analysis": analysis,
                "law_slug": law.slug,
                "law_title": law.title_en,
            })

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class EgyptianLawSummaryView(APIView):
    """
    POST /api/ai/laws/<slug>/summary/

    Generate an executive summary of an Egyptian law.
    """
    permission_classes = [IsAuthenticated]
    throttle_scope = 'ai_analysis'

    def post(self, request, slug):
        try:
            law = EgyptianLaw.objects.get(slug=slug)
        except EgyptianLaw.DoesNotExist:
            return Response(
                {"error": "Law not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        if law.status != 'ready':
            return Response(
                {"error": f"Law is not ready. Status: {law.status}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            vector_store = get_law_vector_store(law.slug)
            # Use Arabic chain for Egyptian laws
            summary_chain = get_arabic_summary_chain(vector_store)

            summary = summary_chain.invoke({
                "input": "Generate a comprehensive executive summary of this Egyptian law.",
                "title": law.title_ar
            })

            return Response({
                "summary": summary,
                "law_slug": law.slug,
                "law_title": law.title_en,
            })

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class LawChatSessionListView(ListAPIView):
    """
    GET /api/ai/laws/sessions/

    List all law chat sessions for the authenticated user.
    """
    serializer_class = LawChatSessionListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return LawChatSession.objects.filter(user=self.request.user)


class LawChatSessionDetailView(RetrieveDestroyAPIView):
    """
    GET /api/ai/laws/sessions/<id>/
    DELETE /api/ai/laws/sessions/<id>/

    Retrieve or delete a law chat session with full message history.
    """
    serializer_class = LawChatSessionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return LawChatSession.objects.filter(user=self.request.user)
