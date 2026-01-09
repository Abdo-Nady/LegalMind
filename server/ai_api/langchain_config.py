"""
LangChain Configuration Module for DocuMind RAG System.

Provides centralized configuration for:
- OpenAI embeddings and chat models
- Vector store (PGVector with PostgreSQL)
- Text splitting and document processing
- RAG chain with legal document-focused prompts
"""
import os

from django.conf import settings

from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_postgres import PGVector
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough

# Constants
EMBEDDING_MODEL = "text-embedding-3-large"  # Upgraded for better Arabic support
CHAT_MODEL = "gpt-4o-mini"
CHUNK_SIZE = 1000
CHUNK_OVERLAP = 200
RETRIEVAL_K = 15  # Increased for better coverage


def get_connection_string() -> str:
    """
    Build PostgreSQL connection string from Django settings.
    Supports both SQLite (for dev) and PostgreSQL (for production).
    """
    db = settings.DATABASES['default']
    engine = db.get('ENGINE', '')

    # For SQLite, we'll use a local PostgreSQL or fall back
    if 'sqlite' in engine:
        # Check for explicit PG connection string in environment
        pg_url = os.environ.get('PGVECTOR_CONNECTION_STRING')
        if pg_url:
            return pg_url
        # Default local PostgreSQL for development
        return "postgresql+psycopg://postgres:postgres@localhost:5432/documind"

    # PostgreSQL connection
    user = db.get('USER', 'postgres')
    password = db.get('PASSWORD', '')
    host = db.get('HOST', 'localhost')
    port = db.get('PORT', '5432')
    name = db.get('NAME', 'documind')

    if password:
        return f"postgresql+psycopg://{user}:{password}@{host}:{port}/{name}"
    return f"postgresql+psycopg://{user}@{host}:{port}/{name}"


def get_openai_api_key() -> str:
    """Get OpenAI API key from environment."""
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY environment variable is not set")
    return api_key


def get_embeddings() -> OpenAIEmbeddings:
    """Get configured OpenAI embeddings model."""
    return OpenAIEmbeddings(
        model=EMBEDDING_MODEL,
        openai_api_key=get_openai_api_key()
    )


def get_text_splitter() -> RecursiveCharacterTextSplitter:
    """
    Get configured text splitter optimized for legal documents.
    Uses larger chunks to preserve context in legal clauses.
    """
    return RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        length_function=len,
        separators=["\n\n", "\n", ". ", " ", ""]
    )


def get_vector_store(collection_name: str = "documind_documents") -> PGVector:
    """
    Get or create PGVector store instance.

    Args:
        collection_name: Name of the collection (use document_id for per-doc isolation)

    Returns:
        PGVector vector store instance
    """
    return PGVector(
        embeddings=get_embeddings(),
        collection_name=collection_name,
        connection=get_connection_string(),
        use_jsonb=True,
    )


def get_document_vector_store(document_id: int) -> PGVector:
    """
    Get vector store for a specific document.
    Each document gets its own collection for isolation.

    Args:
        document_id: The document's database ID

    Returns:
        PGVector store for the specific document
    """
    collection_name = f"document_{document_id}"
    return get_vector_store(collection_name=collection_name)


def get_llm(temperature: float = 0) -> ChatOpenAI:
    """
    Get configured ChatOpenAI LLM instance.

    Args:
        temperature: Creativity level (0 for factual legal analysis)

    Returns:
        ChatOpenAI instance
    """
    return ChatOpenAI(
        model=CHAT_MODEL,
        temperature=temperature,
        openai_api_key=get_openai_api_key()
    )


def format_docs(docs):
    """Format retrieved documents for context."""
    return "\n\n".join(doc.page_content for doc in docs)


def get_legal_rag_chain(vector_store: PGVector):
    """
    Build RAG chain optimized for legal document analysis using LCEL.
    This is the general-purpose chain for user-uploaded documents (typically English).

    Args:
        vector_store: PGVector store containing document chunks

    Returns:
        A retrieval chain for legal document Q&A
    """
    retriever = vector_store.as_retriever(
        search_type="similarity",
        search_kwargs={"k": RETRIEVAL_K}
    )

    system_prompt = """You are LegalMind, an expert legal document analyst.
Your role is to help users understand legal documents by providing accurate,
well-sourced answers based ONLY on the provided document context.

IMPORTANT GUIDELINES:
1. Only answer based on the provided context. If the information is not in the context,
   clearly state: "This information is not found in the provided document."
2. When citing information, reference the specific section or page when available.
3. Use clear, professional language while making legal concepts accessible.
4. Highlight any potential risks, ambiguities, or important clauses you identify.
5. If asked about legal advice, remind the user to consult a qualified attorney.

Context from the document:
{context}"""

    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("human", "{input}")
    ])

    llm = get_llm()

    # Build the RAG chain using LCEL
    rag_chain = (
        {
            "context": retriever | format_docs,
            "input": RunnablePassthrough(),
            "retrieved_docs": retriever,
        }
        | RunnablePassthrough.assign(
            answer=prompt | llm | StrOutputParser()
        )
    )

    return rag_chain


def get_egyptian_law_rag_chain(vector_store: PGVector):
    """
    Build RAG chain optimized for Egyptian law documents (Arabic content).

    Args:
        vector_store: PGVector store containing law document chunks

    Returns:
        A retrieval chain for Egyptian law Q&A
    """
    # Use MMR for better diversity in Arabic legal documents
    retriever = vector_store.as_retriever(
        search_type="mmr",
        search_kwargs={
            "k": RETRIEVAL_K,
            "fetch_k": 30,  # Fetch more candidates for MMR selection
            "lambda_mult": 0.7  # Balance between relevance and diversity
        }
    )

    system_prompt = """You are LegalMind, an expert legal document analyst specializing in Egyptian law.
Your role is to help users understand Egyptian legal documents by providing accurate,
well-sourced answers based on the provided document context.

أنت LegalMind، محلل وثائق قانونية متخصص في القانون المصري.

IMPORTANT GUIDELINES:
1. Answer in the SAME LANGUAGE as the user's question (Arabic or English).
2. The context contains excerpts from an Egyptian law document IN ARABIC. 
   Even if the user's question is in English, search the Arabic context for relevant information.
3. Synthesize and summarize information from the context to answer the question.
4. When citing information, reference the specific article (مادة) number if visible in the context.
5. If you truly cannot find ANY relevant information in the context, state:
   "I couldn't find specific information about this in the excerpts provided." /
   "لم أتمكن من إيجاد معلومات محددة حول هذا في المقتطفات المقدمة."
6. Be helpful - try to provide any relevant information from the context, even if partial.

Context from the document (in Arabic):
{context}"""

    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("human", "{input}")
    ])

    llm = get_llm()

    # Build the RAG chain using LCEL
    rag_chain = (
        {
            "context": retriever | format_docs,
            "input": RunnablePassthrough(),
            "retrieved_docs": retriever,
        }
        | RunnablePassthrough.assign(
            answer=prompt | llm | StrOutputParser()
        )
    )

    return rag_chain


def get_clause_detection_chain(vector_store: PGVector):
    """
    Build chain for detecting and analyzing legal clauses.

    Args:
        vector_store: PGVector store containing document chunks

    Returns:
        A retrieval chain for clause detection
    """
    retriever = vector_store.as_retriever(
        search_type="similarity",
        search_kwargs={"k": 10}
    )

    system_prompt = """You are a legal clause detection expert. Analyze the provided
document sections and identify key legal clauses.

For each clause found, provide:
1. **Clause Type**: (e.g., Termination, Confidentiality, Liability, Indemnity,
   Force Majeure, Payment Terms, Jurisdiction, Non-Compete, etc.)
2. **Summary**: Brief description of what the clause states
3. **Risk Level**: Low, Medium, or High
4. **Location**: Page/section reference if available
5. **Notes**: Any concerns, ambiguities, or recommendations

Context from the document:
{context}

Respond in a structured format."""

    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("human", "{input}")
    ])

    llm = get_llm()

    chain = (
        {
            "context": retriever | format_docs,
            "input": RunnablePassthrough(),
        }
        | prompt
        | llm
        | StrOutputParser()
    )

    return chain


def get_summary_chain(vector_store: PGVector):
    """
    Build chain for generating executive summaries of legal documents.

    Args:
        vector_store: PGVector store containing document chunks

    Returns:
        A retrieval chain for document summarization
    """
    retriever = vector_store.as_retriever(
        search_type="similarity",
        search_kwargs={"k": 15}
    )

    system_prompt = """You are a legal document summarization expert. Create a
comprehensive executive summary of the legal document based on the provided sections.

Your summary should include:
1. **Document Overview**: Type of document, parties involved, effective date
2. **Key Terms**: Main obligations, rights, and conditions
3. **Important Dates**: Deadlines, renewal dates, termination dates
4. **Financial Terms**: Payment amounts, schedules, penalties
5. **Risk Assessment**: Potential concerns or unfavorable terms
6. **Missing Elements**: Standard clauses that appear to be absent
7. **Recommendations**: Suggested actions or areas needing attention

Context from the document:
{context}"""

    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("human", "{input}")
    ])

    llm = get_llm(temperature=0.1)

    chain = (
        {
            "context": retriever | format_docs,
            "input": RunnablePassthrough(),
        }
        | prompt
        | llm
        | StrOutputParser()
    )

    return chain


def delete_document_vectors(document_id: int):
    """
    Delete all vectors associated with a document.

    Args:
        document_id: The document's database ID
    """
    try:
        collection_name = f"document_{document_id}"
        vector_store = get_vector_store(collection_name=collection_name)
        vector_store.delete_collection()
    except Exception:
        pass  # Collection may not exist


def get_law_vector_store(law_slug: str) -> PGVector:
    """
    Get vector store for a specific Egyptian law.
    Uses collection naming: law_{slug}

    Args:
        law_slug: The law's slug (e.g., 'constitution')

    Returns:
        PGVector store for the specific law
    """
    collection_name = f"law_{law_slug}"
    return get_vector_store(collection_name=collection_name)


def delete_law_vectors(law_slug: str):
    """
    Delete all vectors associated with a law.

    Args:
        law_slug: The law's slug
    """
    try:
        collection_name = f"law_{law_slug}"
        vector_store = get_vector_store(collection_name=collection_name)
        vector_store.delete_collection()
    except Exception:
        pass  # Collection may not exist
