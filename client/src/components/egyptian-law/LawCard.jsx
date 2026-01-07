import { motion } from "framer-motion";
import { MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function LawCard({ document, index, onClick }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      onClick={onClick}
      className="group cursor-pointer"
    >
      <div className="relative bg-card rounded-2xl border border-border overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-accent/50">
        {/* Image Header */}
        <div className="relative h-64 overflow-hidden bg-muted">
          <img
            src={document.image}
            alt={document.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

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
              {document.title}
            </h3>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {document.description}
          </p>

          {/* Action Hint */}
          <div className="flex items-center gap-2 text-sm text-accent opacity-0 group-hover:opacity-100 transition-opacity">
            <MessageSquare className="h-4 w-4" />
            <span>Chat with this document</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
