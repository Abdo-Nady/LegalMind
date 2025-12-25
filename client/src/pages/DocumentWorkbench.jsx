import { useParams } from "react-router-dom";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { motion } from "framer-motion";
import { GripVertical } from "lucide-react";
import { WorkspaceLayout } from "@/components/layouts/WorkspaceLayout";
import { PDFViewer } from "@/components/document/PDFViewer";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { useState } from "react";
export default function DocumentWorkbench() {
    const { id } = useParams();
    const [highlightedPage, setHighlightedPage] = useState();
    const handleCitationClick = (page) => {
        setHighlightedPage(page);
        // In a real app, this would scroll the PDF to the relevant page
        setTimeout(() => setHighlightedPage(undefined), 2000);
    };
    return (<WorkspaceLayout documentTitle="Master Service Agreement - Acme Corp">
      <PanelGroup direction="horizontal" className="h-full">
        {/* PDF Panel */}
        <Panel defaultSize={60} minSize={40}>
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="h-full">
            <PDFViewer highlightedPage={highlightedPage}/>
          </motion.div>
        </Panel>

        {/* Resize Handle */}
        <PanelResizeHandle className="w-2 bg-border hover:bg-accent/50 transition-colors flex items-center justify-center group">
          <GripVertical className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors"/>
        </PanelResizeHandle>

        {/* Chat Panel */}
        <Panel defaultSize={40} minSize={30}>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="h-full">
            <ChatPanel onCitationClick={handleCitationClick}/>
          </motion.div>
        </Panel>
      </PanelGroup>
    </WorkspaceLayout>);
}
