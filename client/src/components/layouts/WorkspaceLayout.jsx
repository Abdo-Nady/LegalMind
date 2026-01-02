import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Download, Share2, MoreHorizontal, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
export function WorkspaceLayout({ children, documentTitle = "Untitled Document", documentStatus = "ready", onExport, onShare, }) {
    return (<div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <motion.header initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="h-14 border-b border-border bg-card flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Link to="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4"/>
            </Button>
          </Link>
          
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-secondary to-secondary/70 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary"/>
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
            <Share2 className="h-4 w-4 mr-2"/>
            Share
          </Button>
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="h-4 w-4 mr-2"/>
            Export
          </Button>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4"/>
          </Button>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>);
}
