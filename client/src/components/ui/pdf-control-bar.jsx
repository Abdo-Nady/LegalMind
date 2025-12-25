import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize } from "lucide-react";
import { Button } from "./button";
import { Input } from "./input";
import { cn } from "@/lib/utils";
export function PDFControlBar({ currentPage, totalPages, zoom, onPageChange, onZoomChange, onFullscreen, className, }) {
    return (<div className={cn("flex items-center justify-between gap-4 px-4 py-2 bg-card border-b border-border", className)}>
      {/* Page Navigation */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => onPageChange(Math.max(1, currentPage - 1))} disabled={currentPage <= 1}>
          <ChevronLeft className="h-4 w-4"/>
        </Button>
        
        <div className="flex items-center gap-1.5 text-sm">
          <Input type="number" min={1} max={totalPages} value={currentPage} onChange={(e) => {
            const page = parseInt(e.target.value);
            if (page >= 1 && page <= totalPages) {
                onPageChange(page);
            }
        }} className="w-14 h-8 text-center px-2"/>
          <span className="text-muted-foreground">/ {totalPages}</span>
        </div>
        
        <Button variant="ghost" size="icon" onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage >= totalPages}>
          <ChevronRight className="h-4 w-4"/>
        </Button>
      </div>

      {/* Zoom Controls */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => onZoomChange(Math.max(50, zoom - 25))} disabled={zoom <= 50}>
          <ZoomOut className="h-4 w-4"/>
        </Button>
        
        <span className="text-sm text-muted-foreground w-12 text-center">
          {zoom}%
        </span>
        
        <Button variant="ghost" size="icon" onClick={() => onZoomChange(Math.min(200, zoom + 25))} disabled={zoom >= 200}>
          <ZoomIn className="h-4 w-4"/>
        </Button>

        {onFullscreen && (<Button variant="ghost" size="icon" onClick={onFullscreen}>
            <Maximize className="h-4 w-4"/>
          </Button>)}
      </div>
    </div>);
}
