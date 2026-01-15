import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Scale, FileText, Loader2, Crown } from "lucide-react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { LawCard } from "@/components/egyptian-law/LawCard";
import { EGYPTIAN_LAW_DOCUMENTS } from "@/data/egyptianLawDocuments";
import { lawService } from "@/services/law.service";
import { getMySubscription } from "../services/billing.service";

export default function EgyptianLaw() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const [readyLaws, setReadyLaws] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);

  const isRTL = i18n.language === "ar";

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch laws
        const lawsData = await lawService.list();
        const laws = Array.isArray(lawsData) ? lawsData : lawsData.results || lawsData;
        setReadyLaws(laws.map(law => law.slug));

        // Fetch subscription
        try {
          const subData = await getMySubscription();
          setSubscription(subData);
        } catch (error) {
          console.error("Failed to fetch subscription:", error);
        }
      } catch (error) {
        console.error("Failed to fetch laws:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDocumentClick = (document) => {
    // Check if user has access to Egyptian laws
    const planName = subscription?.plan_details?.name || 'free';
    const hasAccess = subscription?.plan_details?.max_egyptian_laws !== 0;

    // If free user, redirect to pricing
    if (subscription && subscription.plan_details?.max_egyptian_laws === 0) {
      navigate('/pricing');
      return;
    }

    // Only navigate if the law is ready
    if (readyLaws.includes(document.id)) {
      navigate(`/egyptian-law/${document.id}`);
    }
  };

  // Merge static data with backend status
  const documentsWithStatus = EGYPTIAN_LAW_DOCUMENTS.map(doc => ({
    ...doc,
    isReady: readyLaws.includes(doc.id),
  }));

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-background" dir={isRTL ? "rtl" : "ltr"}>
        <Header subscription={subscription} />
        {loading ? (
          <LoadingState />
        ) : (
          <DocumentGrid
            documents={documentsWithStatus}
            onDocumentClick={handleDocumentClick}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

function Header({ subscription }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const hasAccess = subscription?.plan_details?.max_egyptian_laws !== 0;

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
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-3xl text-foreground">
                {t("egyptianLaw.title")}
              </h1>
              {!hasAccess && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-red-500 text-white text-xs font-semibold">
                  <Crown className="h-3 w-3" />
                  PRO
                </span>
              )}
            </div>
            <p className="text-muted-foreground">{t("egyptianLaw.titleAr")}</p>
          </div>
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-muted-foreground max-w-2xl"
        >
          {t("egyptianLaw.subtitle")}
        </motion.p>

        {!hasAccess && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-4 p-4 rounded-lg bg-red-50 border border-red-200"
          >
            <p className="text-sm text-red-800 mb-2">
              Egyptian Law access requires a Standard or Premium plan
            </p>
            <button
              onClick={() => navigate('/pricing')}
              className="text-sm font-semibold text-red-600 hover:text-red-700 underline"
            >
              Upgrade Now →
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-8 w-8 animate-spin text-accent" />
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
            isReady={doc.isReady}
          />
        ))}
      </div>

      <InfoSection />
    </div>
  );
}

function InfoSection() {
  const { t } = useTranslation();

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
            {t("egyptianLaw.aboutTitle")}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t("egyptianLaw.aboutDescription")}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
