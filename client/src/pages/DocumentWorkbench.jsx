import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { motion } from "framer-motion";
import { GripVertical, Loader2, AlertCircle } from "lucide-react";
import { WorkspaceLayout } from "@/components/layouts/WorkspaceLayout";
import { PDFViewer } from "@/components/document/PDFViewer";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { useState } from "react";
import { documentAPI } from "@/services/api";
import { Button } from "@/components/ui/button";

export default function DocumentWorkbench() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [highlightedPage, setHighlightedPage] = useState();

  // Fetch document details
  const { data: document, isLoading, error } = useQuery({
    queryKey: ['document', id],
    queryFn: () => documentAPI.get(id),
    enabled: !!id,
  });

  const handleCitationClick = (page) => {
    setHighlightedPage(page);
    setTimeout(() => setHighlightedPage(undefined), 2000);
  };

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
      <WorkspaceLayout documentTitle={document.title}>
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-accent mx-auto mb-4" />
            <p className="text-foreground font-medium mb-2">Document is being processed</p>
            <p className="text-muted-foreground">This may take a few moments. Please wait...</p>
          </div>
        </div>
      </WorkspaceLayout>
    );
  }

  if (document?.status === 'failed') {
    return (
      <WorkspaceLayout documentTitle={document.title}>
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
    <WorkspaceLayout documentTitle={document?.title || 'Document'} documentStatus={document?.status}>
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
