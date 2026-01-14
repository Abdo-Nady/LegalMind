"""
Celery tasks for DocuMind AI operations.

Tasks:
- process_pdf_document: Async PDF processing (extraction, chunking, embedding)
"""
from celery import shared_task
from django.utils import timezone
from langchain_community.document_loaders import PyMuPDFLoader, PyPDFLoader

from .models import Document, DocumentChunk
from .langchain_config import (
    get_text_splitter,
    get_document_vector_store,
)


@shared_task(bind=True, name='ai_api.process_pdf_document')
def process_pdf_document(self, document_id):
    """
    Process a PDF document asynchronously.

    Steps:
    1. Load PDF from file system
    2. Extract text and page count
    3. Split into chunks
    4. Generate embeddings and store in vector DB
    5. Update document status

    Args:
        document_id: ID of the Document model instance

    Returns:
        dict: Processing result with status and metadata
    """
    try:
        # Get document
        doc = Document.objects.get(id=document_id)
        doc.status = 'processing'
        doc.save(update_fields=['status'])

        # Load PDF with fallback mechanism
        # Try PyMuPDFLoader first (more robust), fallback to PyPDFLoader
        try:
            loader = PyMuPDFLoader(doc.file.path)
            pages = loader.load()
        except Exception as e:
            # Fallback to PyPDFLoader if PyMuPDF fails
            print(f"PyMuPDFLoader failed, trying PyPDFLoader: {e}")
            try:
                loader = PyPDFLoader(doc.file.path)
                pages = loader.load()
            except KeyError as ke:
                # If we get KeyError (bbox issue), try with extraction mode
                if 'bbox' in str(ke):
                    raise Exception(
                        "PDF parsing failed. The PDF might have corrupted fonts or non-standard formatting. "
                        "Please try re-saving the PDF or converting it to a standard format."
                    ) from ke
                raise

        # Update page count
        doc.page_count = len(pages)

        # Sanitize text content - remove NUL bytes that PostgreSQL can't handle
        for page in pages:
            page.page_content = page.page_content.replace('\x00', '')

        # Split into chunks
        text_splitter = get_text_splitter()
        chunks = text_splitter.split_documents(pages)

        # Persist chunks in the DB for citations/debugging; embeddings live in PGVector.
        chunk_objects = []
        for i, chunk in enumerate(chunks):
            # Sanitize chunk content as well
            chunk.page_content = chunk.page_content.replace('\x00', '')

            page_num = chunk.metadata.get('page', 0) + 1  # 1-indexed
            chunk.metadata.update({
                "document_id": doc.id,
                "document_title": doc.title,
                "chunk_index": i,
                "page_number": page_num,
            })

            # Prepare chunk object for bulk create
            chunk_objects.append(DocumentChunk(
                document=doc,
                content=chunk.page_content,
                chunk_index=i,
                page_number=page_num,
            ))

        # Bulk create chunks for better performance
        DocumentChunk.objects.bulk_create(chunk_objects)

        # Store in vector database
        vector_store = get_document_vector_store(doc.id)
        vector_store.add_documents(chunks)

        # Mark as ready
        doc.status = 'ready'
        doc.processed_at = timezone.now()
        doc.save(update_fields=['status', 'processed_at', 'page_count'])

        return {
            'status': 'success',
            'document_id': doc.id,
            'page_count': doc.page_count,
            'chunk_count': len(chunks),
        }

    except Document.DoesNotExist:
        return {
            'status': 'error',
            'error': f'Document {document_id} not found'
        }

    except Exception as e:
        # Mark document as failed
        try:
            doc = Document.objects.get(id=document_id)
            doc.status = 'failed'
            doc.save(update_fields=['status'])
        except:
            pass

        # Re-raise for Celery to handle
        raise
