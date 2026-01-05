import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Scale, FileText } from "lucide-react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { LawCard } from "@/components/egyptian-law/LawCard";
import { EGYPTIAN_LAW_DOCUMENTS } from "@/data/egyptianLawDocuments";

export default function EgyptianLaw() {
  const navigate = useNavigate();

  const handleDocumentClick = (document) => {
    navigate(`/egyptian-law/${document.id}`);
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-background">
        <Header />
        <DocumentGrid
          documents={EGYPTIAN_LAW_DOCUMENTS}
          onDocumentClick={handleDocumentClick}
        />
      </div>
    </DashboardLayout>
  );
}

function Header() {
  return (
    <div className="border-b border-border bg-card/50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-4"
        >
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-secondary to-secondary/70 flex items-center justify-center">
            <Scale className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="font-serif text-3xl text-foreground">
              Chat with Egyptian Law
            </h1>
            <p className="text-muted-foreground">تحدث مع القانون المصري</p>
          </div>
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-muted-foreground max-w-2xl"
        >
          Explore and ask questions about Egypt's major legal codes. Our AI
          assistant will help you understand the laws, find relevant articles,
          and explain legal concepts.
        </motion.p>
      </div>
    </div>
  );
}

function DocumentGrid({ documents, onDocumentClick }) {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {documents.map((doc, index) => (
          <LawCard
            key={doc.id}
            document={doc}
            index={index}
            onClick={() => onDocumentClick(doc)}
          />
        ))}
      </div>

      <InfoSection />
    </div>
  );
}

function InfoSection() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="mt-12 bg-muted/30 rounded-2xl p-6 border border-border"
    >
      <div className="flex items-start gap-4">
        <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
          <FileText className="h-5 w-5 text-accent" />
        </div>
        <div>
          <h3 className="font-serif text-lg text-foreground mb-2">
            About These Documents
          </h3>
          <p className="text-sm text-muted-foreground">
            These are the official Egyptian legal codes that have been
            pre-loaded into our system. You can ask questions in English or
            Arabic, and our AI will provide relevant information with citations
            to specific articles and sections. Please note that this is for
            informational purposes only and does not constitute legal advice.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
