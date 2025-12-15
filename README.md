# 🧠 DocuMind: AI-Powered Legal Document Intelligence Platform

An advanced full-stack web application that transforms how users interact with legal documents through conversational AI. DocuMind provides domain-aware legal analysis, enabling users to upload PDFs, extract insights, identify risks, and generate structured legal summaries with precise source citations.

## ✨ Features

### 🔐 Authentication & Security
- Secure user registration and login with JWT authentication
- Role-based access control (Admin/User)
- Secure session management

### 📄 Document Management
- Upload and manage legal PDF documents
- View document library with metadata
- Real-time processing status tracking (Uploaded, Processing, Ready)

### 💬 Intelligent Document Chat (RAG)
- **Notebook-style interface** for conversing with individual legal documents
- Context-aware answers grounded in document content
- Source citations linked to specific PDF sections
- Persistent chat history per document

### 🔍 Multi-Document Analysis
- Query across multiple documents simultaneously
- Compare clauses between different contracts
- Cross-document semantic search using vector embeddings

### ⚖️ Legal Clause Detection
Automatic identification of key legal clauses:
- Termination
- Confidentiality
- Jurisdiction
- Payment & penalties
- Liability & indemnity
- Force majeure

Each clause includes precise location and clear explanations.

### 🚨 Risk & Issue Analysis
- Detection of missing or risky clauses
- Highlighting of ambiguous or weak wording
- Risk level classification (Low/Medium/High)

### ✍️ Clause Improvement & Redrafting
- Improve or rewrite selected clauses
- Generate alternative clause versions
- Multiple tone options (neutral, protective, conservative)
- Clear explanations of suggested improvements

### 📊 Executive Legal Summaries
One-click contract summaries including:
- Key obligations
- Major risks
- Missing clauses
- Recommended fixes
- Exportable formats (PDF/Text)

### 📅 Action Item Extraction
- Automatic extraction of deadlines and key dates
- Identification of payment terms, renewals, and penalties
- Structured, trackable output

### 🎨 Enhanced User Experience
- Integrated PDF viewer with highlighted references
- Modern chat-based interface
- Document-specific notes and insights
- Responsive design for all devices

### 👨‍💼 Admin Dashboard
- User and document analytics
- Usage logging and system monitoring
- Platform administration tools

## 🛠️ Technology Stack

### Frontend
- **React.js** - Dynamic, responsive user interface for chat and document preview

### Backend
- **Django Rest Framework (DRF)** - RESTful API, JWT authentication, and database handling

### Database
- **PostgreSQL** - Primary relational database
- **Vector Database** - Semantic search and embeddings storage

### AI & Intelligence
- **LangChain** - LLM orchestration, context management, and RAG pipeline
- **OpenAI API** - Powers reasoning, summarization, and content generation
- **Vector Embeddings** - Semantic retrieval and document similarity

## 🏗️ System Architecture

The platform implements a Retrieval-Augmented Generation (RAG) pipeline:

1. **Document Ingestion** - PDFs are processed and chunked for optimal retrieval
2. **Embedding Generation** - Document chunks are converted to vector embeddings
3. **Semantic Search** - User queries retrieve relevant document sections
4. **AI Analysis** - OpenAI models generate contextual, cited responses
5. **Confidence Scoring** - Responses include reliability metrics

## 🚀 Getting Started

### Prerequisites
- Python 3.9+
- Node.js 16+
- PostgreSQL
- OpenAI API key

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/documind.git
cd documind
```

2. Set up the backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. Configure environment variables
```bash
cp .env.example .env
# Edit .env with your configuration:
# - DATABASE_URL
# - OPENAI_API_KEY
# - JWT_SECRET_KEY
```

4. Run database migrations
```bash
python manage.py migrate
```

5. Set up the frontend
```bash
cd ../frontend
npm install
```

6. Start the development servers

Backend:
```bash
cd backend
python manage.py runserver
```

Frontend:
```bash
cd frontend
npm start
```

The application will be available at `http://localhost:3000`

## 📖 Usage

1. **Register/Login** - Create an account or sign in
2. **Upload Documents** - Upload legal PDF documents to your library
3. **Start Chatting** - Open any document and ask questions in natural language
4. **Analyze Clauses** - Use detection tools to identify and analyze key clauses
5. **Generate Summaries** - Create executive summaries with one click
6. **Export Results** - Download summaries and analysis reports

## 🔒 Security

- JWT-based authentication for secure API access
- Role-based access control to protect sensitive documents
- Encrypted data transmission
- Secure document storage

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- OpenAI for GPT models
- LangChain for RAG framework
- The open-source community

## 📧 Contact

For questions or support, please open an issue or contact the maintainers.

---

Built with ❤️ for legal professionals and document analysts
