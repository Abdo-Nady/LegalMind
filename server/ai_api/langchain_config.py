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
EMBEDDING_MODEL = "text-embedding-3-small"
CHAT_MODEL = "gpt-4o-mini"
CHUNK_SIZE = 1000
CHUNK_OVERLAP = 200
RETRIEVAL_K = 5


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

    Args:
        vector_store: PGVector store containing document chunks

    Returns:
        A retrieval chain for legal document Q&A
    """
    retriever = vector_store.as_retriever(
        search_type="similarity",
        search_kwargs={"k": RETRIEVAL_K}
    )

    system_prompt = """You are DocuMind, an expert legal document analyst.
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


def get_compliance_check_chain(vector_store: PGVector, law_type: str = "general"):
    """
    Build chain for checking document compliance against Egyptian laws.

    Args:
        vector_store: PGVector store containing document chunks
        law_type: Type of law to check against ('labor', 'commercial', 'civil', 'tax', 'general')

    Returns:
        A retrieval chain for compliance checking
    """
    retriever = vector_store.as_retriever(
        search_type="similarity",
        search_kwargs={"k": 15}
    )

    # Law-specific compliance requirements
    law_requirements = {
        "labor": """Egyptian Labor Law (Law No. 120/2003) requirements:
- Employment contracts must be in Arabic and prepared in triplicate
- Maximum working hours: 48 hours/week, 8 hours/day
- Probation period cannot exceed 3 months
- Notice periods: 2 months (< 10 years service), 3 months (> 10 years)
- Overtime rates: 135% for daytime, 170% for nighttime
- Maternity leave: 4 months paid leave
- Foreign workers cannot exceed 10% of workforce
- Minimum wage requirements must be met
- Social insurance contributions required
- Annual leave entitlements based on tenure""",
        "commercial": """Egyptian Commercial Code (Law No. 17/1999) requirements:
- Contract formation must include offer and acceptance
- Commercial agency agreements require specific terms
- Dispute resolution clauses should specify jurisdiction
- Governing law provisions required for international contracts
- Trade customs and usage may supplement contract terms
- Registration requirements for certain commercial agreements
- Bankruptcy and insolvency provisions
- Commercial paper and negotiable instruments rules""",
        "civil": """Egyptian Civil Code (Law No. 131/1948) requirements:
- Contracts require mutual consent of capable parties
- Lawful subject and lawful cause required
- Good faith performance obligation
- Force majeure provisions
- Damages and remedies for breach
- Specific performance availability
- Contract interpretation rules
- Void and voidable contract distinctions""",
        "tax": """Egyptian Tax Law requirements:
- Income tax obligations on payments
- VAT implications for services
- Withholding tax requirements
- Tax registration obligations
- Transfer pricing considerations
- Tax treaty benefits if applicable
- Stamp duty on contracts
- Tax compliance documentation""",
        "general": """General Egyptian legal requirements:
- Contract must be in Arabic for enforceability in Egyptian courts
- Parties must have legal capacity
- Subject matter must be lawful
- Compliance with public order and morals
- Registration requirements where applicable
- Notarization requirements for certain contracts
- Dispute resolution options (courts, arbitration)
- Governing law and jurisdiction clauses"""
    }

    requirements = law_requirements.get(law_type, law_requirements["general"])

    system_prompt = f"""You are an Egyptian legal compliance expert. Analyze the provided
document sections for compliance with Egyptian law.

{requirements}

For each requirement, provide:
1. **Requirement**: The specific legal requirement being checked
2. **Status**: COMPLIANT, NON-COMPLIANT, or REVIEW_NEEDED
3. **Finding**: What was found in the document
4. **Article Reference**: Relevant article number from Egyptian law
5. **Recommendation**: Action needed if non-compliant

Structure your response as follows:
## Compliance Summary
[Overall compliance status and key findings]

## Detailed Compliance Check
[For each requirement checked]

## Recommendations
[Prioritized list of actions needed]

## Risk Assessment
[High/Medium/Low risk items identified]

Context from the document:
{{context}}"""

    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("human", "{input}")
    ])

    llm = get_llm(temperature=0)

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


def get_bilingual_summary_chain(vector_store: PGVector):
    """
    Build chain for generating bilingual (Arabic/English) summaries.

    Args:
        vector_store: PGVector store containing document chunks

    Returns:
        A retrieval chain for bilingual summarization
    """
    retriever = vector_store.as_retriever(
        search_type="similarity",
        search_kwargs={"k": 15}
    )

    system_prompt = """You are a bilingual legal document expert fluent in both Arabic and English.
Create a comprehensive summary of the legal document in BOTH Arabic and English.

Your response MUST follow this exact structure:

## English Summary

### Document Overview
[Type of document, parties involved, effective date]

### Key Terms
[Main obligations, rights, and conditions]

### Important Dates
[Deadlines, renewal dates, termination dates]

### Financial Terms
[Payment amounts, schedules, penalties if any]

### Risk Assessment
[Potential concerns or unfavorable terms]

---

## الملخص العربي

### نظرة عامة على الوثيقة
[نوع الوثيقة، الأطراف المعنية، تاريخ السريان]

### الشروط الرئيسية
[الالتزامات الرئيسية، الحقوق، والشروط]

### التواريخ المهمة
[المواعيد النهائية، تواريخ التجديد، تواريخ الإنهاء]

### الشروط المالية
[مبالغ الدفع، الجداول الزمنية، الغرامات إن وجدت]

### تقييم المخاطر
[المخاوف المحتملة أو الشروط غير المواتية]

IMPORTANT: Both summaries must contain the same information, accurately translated.
The Arabic section must be written in formal Modern Standard Arabic (الفصحى).

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


def get_reference_extraction_chain(vector_store: PGVector):
    """
    Build chain for extracting structured reference data from documents.

    Args:
        vector_store: PGVector store containing document chunks

    Returns:
        A retrieval chain for reference data extraction
    """
    retriever = vector_store.as_retriever(
        search_type="similarity",
        search_kwargs={"k": 20}
    )

    system_prompt = """You are a legal document analyst. Extract structured reference
information from the legal document.

Provide the following information in a structured format:

## Document Metadata
- **Document Type**: [Contract, Agreement, NDA, MOU, etc.]
- **Document Title**: [Official title if stated]
- **Execution Date**: [Date signed/executed]
- **Effective Date**: [When it becomes effective]
- **Expiration/Term**: [End date or duration]

## Parties
For each party:
- **Party Name**: [Full legal name]
- **Party Type**: [Individual, Corporation, Government, etc.]
- **Role**: [Buyer, Seller, Employer, Employee, etc.]
- **Address**: [If mentioned]
- **Representative**: [Signatory name and title if mentioned]

## Key Dates & Deadlines
| Date | Description | Clause Reference |
|------|-------------|------------------|
[List all important dates found]

## Financial Terms
- **Total Value**: [Contract value if stated]
- **Payment Terms**: [How and when payments are made]
- **Currency**: [Currency used]
- **Penalties**: [Late payment or breach penalties]

## Clause Index
| Clause # | Title | Page/Section | Risk Level |
|----------|-------|--------------|------------|
[Index of all major clauses found]

## Governing Law & Jurisdiction
- **Governing Law**: [Which country's law applies]
- **Jurisdiction**: [Courts or arbitration venue]
- **Dispute Resolution**: [Mechanism specified]

## Signatures & Witnesses
- **Required Signatures**: [Who must sign]
- **Witness Requirements**: [If any]
- **Notarization**: [Required or not]

If any information is not found in the document, indicate "Not specified" or "Not found".

Context from the document:
{context}"""

    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("human", "{input}")
    ])

    llm = get_llm(temperature=0)

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
