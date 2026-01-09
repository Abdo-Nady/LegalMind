"""
Management command to seed Egyptian law documents and generate embeddings.
Run on container startup to ensure laws are always available.
"""
import unicodedata
import re

from django.core.management.base import BaseCommand
from django.conf import settings
from django.utils import timezone

from langchain_community.document_loaders import PyPDFLoader


def normalize_arabic(text: str) -> str:
    """
    Normalize Arabic text by:
    1. Converting Presentation Forms to standard Arabic (NFKC normalization)
    2. Removing diacritics/tashkeel for better matching
    3. Normalizing whitespace
    """
    # NFKC normalization converts presentation forms to standard Arabic
    text = unicodedata.normalize('NFKC', text)
    
    # Remove Arabic diacritics (tashkeel) - helps matching
    arabic_diacritics = re.compile(r'[\u064B-\u065F\u0670]')
    text = arabic_diacritics.sub('', text)
    
    # Normalize whitespace
    text = ' '.join(text.split())
    
    return text

from ai_api.models import EgyptianLaw, EgyptianLawChunk
from ai_api.langchain_config import (
    get_text_splitter,
    get_law_vector_store,
    delete_law_vectors,
)


# Law definitions matching frontend egyptianLawDocuments.js
# Only laws with available PDFs are included
EGYPTIAN_LAWS = [
    {
        "slug": "constitution",
        "title_en": "The Constitution",
        "title_ar": "دستور جمهورية مصر العربية ٢٠١٩",
        "description_en": "The supreme law of Egypt, establishing the framework for government and protecting fundamental rights and freedoms of citizens.",
        "description_ar": "القانون الأعلى لمصر، يؤسس إطار الحكومة ويحمي الحقوق والحريات الأساسية للمواطنين.",
        "file_name": "دستور-جمهورية-مصر-العربية-2019.pdf",
    },
    {
        "slug": "labor-law",
        "title_en": "Labor Law",
        "title_ar": "القانون رقم ١٤ لسنة ٢٠٢٥ بإصدار قانون العمل",
        "description_en": "Governs employment relationships, workers' rights, working conditions, wages, and labor disputes in Egypt.",
        "description_ar": "ينظم علاقات العمل وحقوق العمال وظروف العمل والأجور ونزاعات العمل في مصر.",
        "file_name": "القانون-رقم-14-لسنة-2025-بإصدار-قانون-العمل.pdf",
    },
    {
        "slug": "civil-code",
        "title_en": "The Civil Code",
        "title_ar": "القانون المدني",
        "description_en": "The foundation of private law in Egypt, governing contracts, obligations, property rights, and personal status for non-Muslims.",
        "description_ar": "أساس القانون الخاص في مصر، ينظم العقود والالتزامات وحقوق الملكية والأحوال الشخصية لغير المسلمين.",
        "file_name": "القانون-المدني.pdf",
    },
    {
        "slug": "penal-code",
        "title_en": "The Penal Code",
        "title_ar": "قانون العقوبات المصري",
        "description_en": "Defines criminal offenses and their penalties in Egypt.",
        "description_ar": "يحدد الجرائم الجنائية وعقوباتها في مصر.",
        "file_name": "قانون العقوبات المصري.pdf",
    },
    {
        "slug": "tax-procedures",
        "title_en": "Unified Tax Procedures Law",
        "title_ar": "قانون الإجراءات الضريبية الموحد",
        "description_en": "Regulates the procedures for tax assessment, collection, and appeals in Egypt.",
        "description_ar": "ينظم إجراءات ربط وتحصيل الضرائب والطعن عليها في مصر.",
        "file_name": "قانون رقم 206 لسنة 2020 بإصدار قانون الإجراءات الضريبية الموحد.pdf",
    },
    # Add more laws here as PDFs become available:
    # {
    #     "slug": "civil-code",
    #     "title_en": "The Civil Code",
    #     "title_ar": "القانون المدني",
    #     "description_en": "The foundation of private law in Egypt...",
    #     "description_ar": "أساس القانون الخاص في مصر...",
    #     "file_name": "civil-code.pdf",
    # },
]


class Command(BaseCommand):
    help = 'Seed Egyptian law documents and generate embeddings (idempotent)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force re-seeding even if already done',
        )
        parser.add_argument(
            '--law',
            type=str,
            help='Seed only a specific law by slug',
        )

    def handle(self, *args, **options):
        force = options.get('force', False)
        specific_law = options.get('law')

        laws_to_process = EGYPTIAN_LAWS
        if specific_law:
            laws_to_process = [l for l in EGYPTIAN_LAWS if l['slug'] == specific_law]
            if not laws_to_process:
                self.stderr.write(
                    self.style.ERROR(f"Law '{specific_law}' not found in configuration")
                )
                return

        self.stdout.write(f"Processing {len(laws_to_process)} law(s)...")

        for law_data in laws_to_process:
            self.seed_law(law_data, force)

        self.stdout.write(self.style.SUCCESS("Egyptian laws seeding complete!"))

    def seed_law(self, law_data: dict, force: bool):
        """Seed a single law document."""
        slug = law_data['slug']

        # Check if already seeded
        law, created = EgyptianLaw.objects.get_or_create(
            slug=slug,
            defaults={
                'title_en': law_data['title_en'],
                'title_ar': law_data['title_ar'],
                'description_en': law_data['description_en'],
                'description_ar': law_data['description_ar'],
                'file_path': law_data['file_name'],
                'status': 'pending',
            }
        )

        # Skip if already ready (unless force)
        if not created and law.status == 'ready' and not force:
            self.stdout.write(f"  Skipping {slug} - already seeded")
            return

        # Update metadata if re-seeding
        if not created:
            law.title_en = law_data['title_en']
            law.title_ar = law_data['title_ar']
            law.description_en = law_data['description_en']
            law.description_ar = law_data['description_ar']
            law.file_path = law_data['file_name']

        self.stdout.write(f"  Processing {slug}...")

        try:
            law.status = 'processing'
            law.save()

            # Get PDF path
            pdf_path = settings.EGYPTIAN_LAWS_DIR / law_data['file_name']
            if not pdf_path.exists():
                self.stderr.write(
                    self.style.ERROR(f"    PDF not found: {pdf_path}")
                )
                law.status = 'failed'
                law.save()
                return

            # Load and process PDF
            self.stdout.write(f"    Loading PDF: {pdf_path.name}")
            loader = PyPDFLoader(str(pdf_path))
            pages = loader.load()

            # Sanitize and normalize Arabic content
            for page in pages:
                content = page.page_content.replace('\x00', '')
                page.page_content = normalize_arabic(content)

            law.page_count = len(pages)
            self.stdout.write(f"    Loaded {len(pages)} pages")

            # Split into chunks
            text_splitter = get_text_splitter()
            chunks = text_splitter.split_documents(pages)
            self.stdout.write(f"    Split into {len(chunks)} chunks")

            # Delete old chunks and vectors if re-seeding
            if not created or force:
                EgyptianLawChunk.objects.filter(law=law).delete()
                delete_law_vectors(slug)

            # Add metadata and save chunks
            chunk_objects = []
            for i, chunk in enumerate(chunks):
                chunk.page_content = normalize_arabic(chunk.page_content.replace('\x00', ''))
                page_num = chunk.metadata.get('page', 0) + 1
                chunk.metadata.update({
                    "law_slug": slug,
                    "law_title": law.title_en,
                    "chunk_index": i,
                    "page_number": page_num,
                })

                chunk_objects.append(EgyptianLawChunk(
                    law=law,
                    content=chunk.page_content,
                    chunk_index=i,
                    page_number=page_num,
                ))

            EgyptianLawChunk.objects.bulk_create(chunk_objects)

            # Store embeddings in vector database
            self.stdout.write(f"    Generating embeddings...")
            vector_store = get_law_vector_store(slug)
            vector_store.add_documents(chunks)

            # Mark as ready
            law.status = 'ready'
            law.chunk_count = len(chunks)
            law.seeded_at = timezone.now()
            law.save()

            self.stdout.write(
                self.style.SUCCESS(
                    f"    Successfully seeded {slug}: {law.page_count} pages, {law.chunk_count} chunks"
                )
            )

        except Exception as e:
            law.status = 'failed'
            law.save()
            self.stderr.write(
                self.style.ERROR(f"    Failed to seed {slug}: {str(e)}")
            )
            import traceback
            self.stderr.write(traceback.format_exc())
