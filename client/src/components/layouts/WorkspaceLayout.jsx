import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Download,
  Share2,
  MoreHorizontal,
  Sparkles,
  Loader2,
  Lightbulb,
  FileText,
  FileBarChart,
  BookOpen,
  Languages,
  Scale,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";

export function WorkspaceLayout({
  children,
  documentTitle = "Untitled Document",
  documentStatus = "ready",
  onExportInsights,
  onExportSummary,
  onExportAnalysisReport,
  onExportCompliance,
  onExportBilingual,
  onExportReference,
  onShare,
  insightsAvailable = false,
  summaryAvailable = false,
  isExporting = false,
}) {
  const hasExportOptions = insightsAvailable || summaryAvailable;
  const isReady = documentStatus === "ready";

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="h-14 border-b border-border bg-card flex items-center justify-between px-4 flex-shrink-0"
      >
        <div className="flex items-center gap-4">
          <Link to="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>

          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-secondary to-secondary/70 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h1 className="font-serif text-lg text-foreground leading-tight">
                {documentTitle}
              </h1>
            </div>
          </div>

          {documentStatus === "processing" ? (
            <Badge variant="processing">
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Processing
            </Badge>
          ) : documentStatus === "ready" ? (
            <Badge variant="success">Ready</Badge>
          ) : documentStatus === "failed" ? (
            <Badge variant="danger">Failed</Badge>
          ) : (
            <Badge variant="outline">Uploaded</Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={isExporting}>
                {isExporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Export as PDF</DropdownMenuLabel>
              <DropdownMenuSeparator />

              {/* Basic exports */}
              <DropdownMenuItem
                onClick={onExportInsights}
                disabled={!insightsAvailable}
                className="cursor-pointer"
              >
                <Lightbulb className="h-4 w-4 mr-2" />
                <span>Legal Insights</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onExportSummary}
                disabled={!summaryAvailable}
                className="cursor-pointer"
              >
                <FileText className="h-4 w-4 mr-2" />
                <span>Executive Summary</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-muted-foreground">Advanced Reports</DropdownMenuLabel>

              {/* Analysis Report */}
              <DropdownMenuItem
                onClick={onExportAnalysisReport}
                disabled={!hasExportOptions}
                className="cursor-pointer"
              >
                <FileBarChart className="h-4 w-4 mr-2" />
                <span>Analysis Report</span>
              </DropdownMenuItem>

              {/* Reference Document */}
              <DropdownMenuItem
                onClick={onExportReference}
                disabled={!isReady}
                className="cursor-pointer"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                <span>Reference Document</span>
              </DropdownMenuItem>

              {/* Bilingual Summary */}
              <DropdownMenuItem
                onClick={onExportBilingual}
                disabled={!isReady}
                className="cursor-pointer"
              >
                <Languages className="h-4 w-4 mr-2" />
                <span>Bilingual Summary</span>
              </DropdownMenuItem>

              {/* Compliance Report with submenu */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger disabled={!isReady} className="cursor-pointer">
                  <Scale className="h-4 w-4 mr-2" />
                  <span>Compliance Report</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-48">
                  <DropdownMenuItem onClick={() => onExportCompliance?.('labor')} className="cursor-pointer">
                    Labor Law
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onExportCompliance?.('commercial')} className="cursor-pointer">
                    Commercial Code
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onExportCompliance?.('civil')} className="cursor-pointer">
                    Civil Code
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onExportCompliance?.('tax')} className="cursor-pointer">
                    Tax Law
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onExportCompliance?.('general')} className="cursor-pointer">
                    General Compliance
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              {!hasExportOptions && !isReady && (
                <>
                  <DropdownMenuSeparator />
                  <p className="px-2 py-1.5 text-xs text-muted-foreground">
                    Document must be ready to enable exports
                  </p>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}

