import { motion } from "framer-motion";
import { MessageSquare, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";

export function LawCard({ document, index, onClick, isReady = true }) {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      onClick={isReady ? onClick : undefined}
      className={`group ${isReady ? "cursor-pointer" : "cursor-not-allowed"}`}
    >
      <div
        className={`relative bg-card rounded-2xl border border-border overflow-hidden transition-all duration-300 ${isReady
            ? "hover:shadow-xl hover:-translate-y-1 hover:border-accent/50"
            : "opacity-75"
          }`}
      >
        {/* Image Header */}
        <div className="relative h-64 overflow-hidden bg-muted">
          <img
            src={document.image}
            alt={document.title}
            className={`w-full h-full object-cover transition-transform duration-500 ${isReady ? "group-hover:scale-105" : "grayscale"
              }`}
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

          {/* Status Badge - Coming Soon */}
          {!isReady && (
            <div className="absolute top-3 left-3">
              <Badge
                variant="secondary"
                className="bg-amber-500/90 text-white border-0 backdrop-blur-sm"
              >
                <Clock className="h-3 w-3 mr-1" />
                {t("egyptianLaw.comingSoon", "Coming Soon")}
              </Badge>
            </div>
          )}

          {/* Arabic Title Badge */}
          <div className="absolute top-3 right-3">
            <Badge
              variant="secondary"
              className="bg-card/95 text-foreground border border-border/50 backdrop-blur-sm"
            >
              {document.titleAr}
            </Badge>
          </div>

          {/* Title on Image */}
          <div className="absolute bottom-3 left-4 right-4">
            <h3 className="font-serif text-xl text-white drop-shadow-lg">
              {t(`egyptianLaw.documents.${document.id}.title`, document.title)}
            </h3>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {t(`egyptianLaw.documents.${document.id}.description`, document.description)}
          </p>

          {/* Action Hint */}
          <div
            className={`flex items-center gap-2 text-sm ${isReady
                ? "text-accent opacity-0 group-hover:opacity-100"
                : "text-muted-foreground"
              } transition-opacity`}
          >
            {isReady ? (
              <>
                <MessageSquare className="h-4 w-4" />
                <span>{t("egyptianLaw.chatWithDocument")}</span>
              </>
            ) : (
              <span className="text-xs">
                {t("egyptianLaw.notAvailableYet", "This document is not available yet")}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
