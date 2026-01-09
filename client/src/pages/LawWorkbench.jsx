import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { motion } from "framer-motion";
import { GripVertical, Loader2, AlertCircle } from "lucide-react";
import { WorkspaceLayout } from "@/components/layouts/WorkspaceLayout";
import { PDFViewer } from "@/components/document/PDFViewer";
import { LawChatPanel } from "@/components/chat/LawChatPanel";
import { useState, useCallback } from "react";
import { lawService } from "@/services/law.service";
import { Button } from "@/components/ui/button";
import { exportToPDF } from "@/lib/pdf-export";
import { toast } from "sonner";

// Query keys for law-related queries
const lawQueryKeys = {
  detail: (slug) => ["laws", slug],
  clauses: (slug) => ["laws", slug, "clauses"],
  summary: (slug) => ["laws", slug, "summary"],
};

export default function LawWorkbench() {
  const { lawId } = useParams();
  const navigate = useNavigate();
  const [highlightedPage, setHighlightedPage] = useState();

  // Fetch law details
  const { data: law, isLoading, error } = useQuery({
    queryKey: lawQueryKeys.detail(lawId),
    queryFn: () => lawService.get(lawId),
    enabled: !!lawId,
  });

  // Fetch clauses for export
  const { data: clausesData } = useQuery({
    queryKey: lawQueryKeys.clauses(lawId),
    queryFn: () => lawService.getClauses(lawId),
    enabled: !!lawId && law?.status === "ready",
    staleTime: 5 * 60 * 1000,
  });

  // Fetch summary for export
  const { data: summaryData } = useQuery({
    queryKey: lawQueryKeys.summary(lawId),
    queryFn: () => lawService.getSummary(lawId),
    enabled: !!lawId && law?.status === "ready",
    staleTime: 5 * 60 * 1000,
  });

  const handleCitationClick = (page) => {
    setHighlightedPage(page);
    setTimeout(() => setHighlightedPage(undefined), 2000);
  };

  // Export handlers
  const handleExportInsights = useCallback(() => {
    if (!clausesData?.analysis) {
      toast.error("No insights available to export");
      return;
    }
    try {
      exportToPDF(
        clausesData.analysis,
        "Legal Clause Analysis",
        "insights",
        law?.title_en || "Law"
      );
      toast.success("Insights exported successfully");
    } catch (err) {
      console.error("Export failed:", err);
      toast.error("Failed to export insights");
    }
  }, [clausesData, law]);

  const handleExportSummary = useCallback(() => {
    if (!summaryData?.summary) {
      toast.error("No summary available to export");
      return;
    }
    try {
      exportToPDF(
        summaryData.summary,
        "Executive Summary",
        "summary",
        law?.title_en || "Law"
      );
      toast.success("Summary exported successfully");
    } catch (err) {
      console.error("Export failed:", err);
      toast.error("Failed to export summary");
    }
  }, [summaryData, law]);

  // Loading state
  if (isLoading) {
    return (
      <WorkspaceLayout documentTitle="Loading...">
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Loading law document...</p>
          </div>
        </div>
      </WorkspaceLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <WorkspaceLayout documentTitle="Error">
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-4" />
            <p className="text-destructive mb-4">
              {error.message || "Failed to load law document"}
            </p>
            <Button onClick={() => navigate("/egyptian-law")}>
              Back to Egyptian Law
            </Button>
          </div>
        </div>
      </WorkspaceLayout>
    );
  }

  // Law not ready
  if (law?.status !== "ready") {
    return (
      <WorkspaceLayout documentTitle={law?.title_en} documentStatus={law?.status}>
        <div className="h-full flex items-center justify-center">
          <div className="text-center max-w-md">
            <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <p className="text-foreground font-medium text-lg mb-2">
              Law Not Available
            </p>
            <p className="text-muted-foreground mb-4">
              This law document is not ready yet. Please check back later.
            </p>
            <Button onClick={() => navigate("/egyptian-law")}>
              Back to Egyptian Law
            </Button>
          </div>
        </div>
      </WorkspaceLayout>
    );
  }

  // Get PDF URL from API response
  const pdfUrl = law.file_url;

  return (
    <WorkspaceLayout
      documentTitle={law?.title_ar || law?.title_en || "Law"}
      documentStatus={law?.status}
      onExportInsights={handleExportInsights}
      onExportSummary={handleExportSummary}
      insightsAvailable={!!clausesData?.analysis}
      summaryAvailable={!!summaryData?.summary}
    >
      <PanelGroup direction="horizontal" className="h-full">
        {/* PDF Panel */}
        <Panel defaultSize={60} minSize={40}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="h-full"
          >
            <PDFViewer
              documentId={lawId}
              fileUrl={pdfUrl}
              highlightedPage={highlightedPage}
              isLaw={true}
            />
          </motion.div>
        </Panel>

        {/* Resize Handle */}
        <PanelResizeHandle className="w-2 bg-border hover:bg-accent/50 transition-colors flex items-center justify-center group">
          <GripVertical className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors" />
        </PanelResizeHandle>

        {/* Chat Panel */}
        <Panel defaultSize={40} minSize={30}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="h-full"
          >
            <LawChatPanel
              lawSlug={lawId}
              lawTitle={law?.title_ar}
              onCitationClick={handleCitationClick}
            />
          </motion.div>
        </Panel>
      </PanelGroup>
    </WorkspaceLayout>
  );
}
