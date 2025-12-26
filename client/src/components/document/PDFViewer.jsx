import { useState, useCallback, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { motion } from "framer-motion";
import { FileText, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, RotateCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Set up the worker for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export function PDFViewer({ documentId, fileUrl, className, highlightedPage }) {
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const onDocumentLoadSuccess = useCallback(({ numPages }) => {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  }, []);

  const onDocumentLoadError = useCallback((error) => {
    console.error("Error loading PDF:", error);
    setError("Failed to load PDF document");
    setLoading(false);
  }, []);

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const goToPage = (page) => {
    if (page >= 1 && page <= numPages) {
      setCurrentPage(page);
    }
  };

  // Navigate to highlighted page when citation is clicked
  useEffect(() => {
    if (highlightedPage && numPages && highlightedPage <= numPages) {
      setCurrentPage(highlightedPage);
    }
  }, [highlightedPage, numPages]);

  // Calculate page width based on zoom
  const pageWidth = (8.5 * zoom / 100) * 72; // 8.5 inches at 72 DPI

  return (
    <div className={cn("flex flex-col h-full bg-muted/30", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-card border-b border-border">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1 || loading}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground min-w-[80px] text-center">
            {loading ? "..." : `${currentPage} / ${numPages || "?"}`}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= numPages || loading}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setZoom(Math.max(50, zoom - 25))}
            disabled={zoom <= 50}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground min-w-[50px] text-center">
            {zoom}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setZoom(Math.min(200, zoom + 25))}
            disabled={zoom >= 200}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleRotate}>
            <RotateCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* PDF Content Area */}
      <div className="flex-1 overflow-auto p-8 flex justify-center">
        {!fileUrl ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <FileText className="h-16 w-16 mb-4 opacity-50" />
            <p className="text-lg">No document loaded</p>
            <p className="text-sm">Upload a PDF to view it here</p>
          </div>
        ) : (
          <Document
            file={fileUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div className="flex flex-col items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Loading PDF...</p>
              </div>
            }
            error={
              <div className="flex flex-col items-center justify-center h-96 text-destructive">
                <FileText className="h-16 w-16 mb-4 opacity-50" />
                <p className="text-lg">Failed to load PDF</p>
                <p className="text-sm">{error}</p>
              </div>
            }
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative"
            >
              <Page
                pageNumber={currentPage}
                width={pageWidth}
                rotate={rotation}
                loading={
                  <div className="flex items-center justify-center" style={{ width: pageWidth, height: pageWidth * 1.3 }}>
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                }
                className="shadow-premium rounded-lg overflow-hidden"
              />
              {/* Page highlight overlay for citations */}
              {highlightedPage === currentPage && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 2, times: [0, 0.1, 1] }}
                  className="absolute inset-0 border-4 border-accent/50 rounded-lg pointer-events-none bg-accent/10"
                />
              )}
            </motion.div>
          </Document>
        )}
      </div>

      {/* Page thumbnails */}
      {numPages && numPages > 0 && (
        <div className="h-20 bg-card border-t border-border flex items-center gap-2 px-4 overflow-x-auto">
          {Array.from({ length: Math.min(10, numPages) }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => goToPage(idx + 1)}
              className={cn(
                "flex-shrink-0 w-12 h-16 rounded border transition-all",
                currentPage === idx + 1
                  ? "border-accent ring-2 ring-accent/30"
                  : "border-border hover:border-accent/50"
              )}
            >
              <div className="w-full h-full bg-muted rounded flex items-center justify-center">
                <span className="text-xs text-muted-foreground">{idx + 1}</span>
              </div>
            </button>
          ))}
          {numPages > 10 && (
            <div className="flex-shrink-0 px-2 text-xs text-muted-foreground">
              +{numPages - 10} more
            </div>
          )}
        </div>
      )}
    </div>
  );
}
