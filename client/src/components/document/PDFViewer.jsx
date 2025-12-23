import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
export function PDFViewer({ filename = "contract.pdf", className, highlightedPage }) {
    const [currentPage, setCurrentPage] = useState(1);
    const [zoom, setZoom] = useState(100);
    const totalPages = 12;
    // Simulated PDF content
    const sampleContent = [
        {
            title: "SERVICE AGREEMENT",
            content: `This Service Agreement ("Agreement") is entered into as of January 1, 2024, by and between:

PARTY A: Acme Corporation
123 Business Avenue
New York, NY 10001

PARTY B: Client Industries LLC
456 Commerce Street
San Francisco, CA 94102

RECITALS

WHEREAS, Party A is engaged in the business of providing professional consulting services; and

WHEREAS, Party B desires to engage Party A to provide such services subject to the terms and conditions set forth herein.`,
        },
        {
            title: "1. SCOPE OF SERVICES",
            content: `1.1 Services. Party A agrees to provide the following services ("Services"):
      
(a) Strategic consulting and advisory services
(b) Market analysis and research
(c) Implementation support and training
(d) Ongoing maintenance and support

1.2 Deliverables. Party A shall deliver all work products, reports, and documentation as specified in Exhibit A attached hereto.

1.3 Timeline. Services shall be performed according to the project timeline outlined in Exhibit B.`,
        },
    ];
    return (<div className={cn("flex flex-col h-full bg-muted/30", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-card border-b border-border">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage <= 1}>
            <ChevronLeft className="h-4 w-4"/>
          </Button>
          <span className="text-sm text-muted-foreground min-w-[80px] text-center">
            {currentPage} / {totalPages}
          </span>
          <Button variant="ghost" size="icon" onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage >= totalPages}>
            <ChevronRight className="h-4 w-4"/>
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setZoom(Math.max(50, zoom - 25))}>
            <ZoomOut className="h-4 w-4"/>
          </Button>
          <span className="text-sm text-muted-foreground min-w-[50px] text-center">
            {zoom}%
          </span>
          <Button variant="ghost" size="icon" onClick={() => setZoom(Math.min(200, zoom + 25))}>
            <ZoomIn className="h-4 w-4"/>
          </Button>
          <Button variant="ghost" size="icon">
            <RotateCw className="h-4 w-4"/>
          </Button>
        </div>
      </div>

      {/* PDF Content Area */}
      <div className="flex-1 overflow-auto p-8 flex justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card shadow-premium rounded-lg overflow-hidden" style={{
            width: `${(8.5 * zoom) / 100 * 72}px`,
            minHeight: `${(11 * zoom) / 100 * 72}px`,
        }}>
          <div className="p-12">
            {sampleContent[currentPage - 1] ? (<>
                <h2 className="font-serif text-2xl text-foreground mb-6 text-center">
                  {sampleContent[currentPage - 1].title}
                </h2>
                <div className="text-sm text-foreground leading-relaxed whitespace-pre-line font-sans">
                  {sampleContent[currentPage - 1].content}
                </div>
              </>) : (<div className="flex flex-col items-center justify-center h-96 text-muted-foreground">
                <FileText className="h-16 w-16 mb-4 opacity-50"/>
                <p className="text-lg">Page {currentPage}</p>
                <p className="text-sm">Document content preview</p>
              </div>)}
          </div>

          {/* Page highlight overlay */}
          {highlightedPage === currentPage && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 border-4 border-accent/50 rounded-lg pointer-events-none"/>)}
        </motion.div>
      </div>

      {/* Page thumbnails */}
      <div className="h-20 bg-card border-t border-border flex items-center gap-2 px-4 overflow-x-auto">
        {Array.from({ length: Math.min(8, totalPages) }).map((_, idx) => (<button key={idx} onClick={() => setCurrentPage(idx + 1)} className={cn("flex-shrink-0 w-12 h-16 rounded border transition-all", currentPage === idx + 1
                ? "border-accent ring-2 ring-accent/30"
                : "border-border hover:border-accent/50")}>
            <div className="w-full h-full bg-muted rounded flex items-center justify-center">
              <span className="text-xs text-muted-foreground">{idx + 1}</span>
            </div>
          </button>))}
      </div>
    </div>);
}
