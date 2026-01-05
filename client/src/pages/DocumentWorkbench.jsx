import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { motion } from "framer-motion";
import { GripVertical, Loader2, AlertCircle } from "lucide-react";
import { WorkspaceLayout } from "@/components/layouts/WorkspaceLayout";
import { PDFViewer } from "@/components/document/PDFViewer";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { useState, useEffect, useCallback } from "react";
import { queryKeys } from "@/lib/queryClient";
import { documentService } from "@/services/document.service";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { exportToPDF } from "@/lib/pdf-export";
import { toast } from "sonner";

export default function DocumentWorkbench() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [highlightedPage, setHighlightedPage] = useState();

  // Fetch document details
  const { data: document, isLoading, error } = useQuery({
    queryKey: queryKeys.documents.detail(id),
    queryFn: () => documentService.get(id),
    enabled: !!id,
  });

  // Fetch clauses for export (pre-fetch to check availability)
  const { data: clausesData } = useQuery({
    queryKey: queryKeys.documents.clauses(id),
    queryFn: () => documentService.getClauses(id),
    enabled: !!id && document?.status === 'ready',
    staleTime: 5 * 60 * 1000,
  });

  // Fetch summary for export (pre-fetch to check availability)
  const { data: summaryData } = useQuery({
    queryKey: queryKeys.documents.summary(id),
    queryFn: () => documentService.getSummary(id),
    enabled: !!id && document?.status === 'ready',
    staleTime: 5 * 60 * 1000,
  });

  // Poll for processing status
  useEffect(() => {
    if (!document || document.status !== 'processing') {
      return; // Only poll if document is processing
    }

    const pollInterval = setInterval(async () => {
      try {
        const updatedDoc = await documentService.get(id);

        // If status changed, invalidate query to refresh
        if (updatedDoc.status !== 'processing') {
          queryClient.invalidateQueries({ queryKey: queryKeys.documents.detail(id) });
        }
      } catch (error) {
        console.error('Failed to poll document status:', error);
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(pollInterval);
  }, [document, id, queryClient]);

  const handleCitationClick = (page) => {
    setHighlightedPage(page);
    setTimeout(() => setHighlightedPage(undefined), 2000);
  };

  // Export handlers
  const handleExportInsights = useCallback(() => {
    if (!clausesData?.analysis) {
      toast.error('No insights available to export');
      return;
    }
    try {
      exportToPDF(
        clausesData.analysis,
        'Legal Clause Analysis',
        'insights',
        document?.title || 'Document'
      );
      toast.success('Insights exported successfully');
    } catch (err) {
      console.error('Export failed:', err);
      toast.error('Failed to export insights');
    }
  }, [clausesData, document]);

  const handleExportSummary = useCallback(() => {
    if (!summaryData?.summary) {
      toast.error('No summary available to export');
      return;
    }
    try {
      exportToPDF(
        summaryData.summary,
        'Executive Summary',
        'summary',
        document?.title || 'Document'
      );
      toast.success('Summary exported successfully');
    } catch (err) {
      console.error('Export failed:', err);
      toast.error('Failed to export summary');
    }
  }, [summaryData, document]);

  // Loading state
  if (isLoading) {
    return (
      <WorkspaceLayout documentTitle="Loading...">
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Loading document...</p>
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
            <p className="text-destructive mb-4">{error.message || 'Failed to load document'}</p>
            <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
          </div>
        </div>
      </WorkspaceLayout>
    );
  }

  // Document not ready
  if (document?.status === 'processing') {
    return (
      <WorkspaceLayout documentTitle={document.title} documentStatus="processing">
        <div className="h-full flex items-center justify-center">
          <div className="text-center max-w-md">
            <Loader2 className="h-12 w-12 animate-spin text-accent mx-auto mb-4" />
            <p className="text-foreground font-medium text-lg mb-2">Processing Your Document</p>
            <p className="text-muted-foreground mb-4">
              We're extracting text, analyzing content, and generating embeddings.
              This page will automatically refresh when ready.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-lg">
              <div className="h-2 w-2 bg-accent rounded-full animate-pulse"></div>
              <span className="text-sm text-accent">Checking status every 3 seconds...</span>
            </div>
          </div>
        </div>
      </WorkspaceLayout>
    );
  }

  if (document?.status === 'failed') {
    return (
      <WorkspaceLayout documentTitle={document.title} documentStatus="failed">
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-4" />
            <p className="text-destructive mb-4">Document processing failed</p>
            <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
          </div>
        </div>
      </WorkspaceLayout>
    );
  }

  return (
    <WorkspaceLayout
      documentTitle={document?.title || 'Document'}
      documentStatus={document?.status}
      onExportInsights={handleExportInsights}
      onExportSummary={handleExportSummary}
      insightsAvailable={!!clausesData?.analysis}
      summaryAvailable={!!summaryData?.summary}
    >
      <PanelGroup direction="horizontal" className="h-full">
        {/* PDF Panel */}
        <Panel defaultSize={60} minSize={40}>
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="h-full">
            <PDFViewer
              documentId={id}
              fileUrl={document?.file}
              highlightedPage={highlightedPage}
            />
          </motion.div>
        </Panel>

        {/* Resize Handle */}
        <PanelResizeHandle className="w-2 bg-border hover:bg-accent/50 transition-colors flex items-center justify-center group">
          <GripVertical className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors" />
        </PanelResizeHandle>

        {/* Chat Panel */}
        <Panel defaultSize={40} minSize={30}>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="h-full">
            <ChatPanel
              documentId={id}
              onCitationClick={handleCitationClick}
            />
          </motion.div>
        </Panel>
      </PanelGroup>
    </WorkspaceLayout>
  );
}
