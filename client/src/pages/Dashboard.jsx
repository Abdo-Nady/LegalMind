import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { FileText, MoreVertical, Calendar, AlertTriangle, CheckCircle, Clock, Search, Filter, Grid3X3, List, Trash2, Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UploadCard } from "@/components/ui/upload-card";
import { cn } from "@/lib/utils";
import { queryKeys } from "@/lib/queryClient";
import { documentService } from "@/services/document.service";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function DocumentCard({ doc, onDelete }) {
  const riskConfig = {
    high: { icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10" },
    medium: { icon: Clock, color: "text-warning", bg: "bg-warning/10" },
    low: { icon: CheckCircle, color: "text-success", bg: "bg-success/10" },
  };
  const risk = doc.riskLevel ? riskConfig[doc.riskLevel] : null;

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <Card variant="interactive" className="group">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <Link to={`/document/${doc.id}`} className="flex-1">
            <div className={cn("h-12 w-12 rounded-lg flex items-center justify-center", risk?.bg || "bg-muted")}>
              <FileText className={cn("h-6 w-6", risk?.color || "text-muted-foreground")} />
            </div>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to={`/document/${doc.id}`}>Open Document</Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={(e) => {
                  e.preventDefault();
                  onDelete(doc.id);
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Link to={`/document/${doc.id}`}>
          {/* Title */}
          <h3 className="font-medium text-foreground mb-2 line-clamp-2 group-hover:text-accent transition-colors">
            {doc.title}
          </h3>

          {/* Meta */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <Calendar className="h-3.5 w-3.5" />
            <span>{formatDate(doc.uploaded_at)}</span>
            {doc.page_count && (
              <>
                <span className="text-border">•</span>
                <span>{doc.page_count} pages</span>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs">
              PDF
            </Badge>
            {doc.status === "processing" ? (
              <Badge variant="processing">
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Processing
              </Badge>
            ) : doc.status === "ready" ? (
              <Badge variant="success">Ready</Badge>
            ) : doc.status === "failed" ? (
              <Badge variant="danger">Failed</Badge>
            ) : (
              <Badge variant="outline">Uploaded</Badge>
            )}
          </div>
        </Link>
      </div>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16">
      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
        <FileText className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="font-medium text-foreground mb-2">No documents yet</h3>
      <p className="text-muted-foreground mb-4">
        Upload your first legal document to get started with AI-powered analysis
      </p>
    </div>
  );
}

export default function Dashboard() {
  const [view, setView] = useState("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();
  const { isGuest, user } = useAuth();

  // Fetch documents - only if user is authenticated (not guest)
  const { data: documents = [], isLoading, error } = useQuery({
    queryKey: queryKeys.documents.all,
    queryFn: documentService.list,
    enabled: !isGuest && !!user, // Only fetch if not guest and user exists
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: (file) => documentService.upload(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.documents.all });
      toast.success('Document uploaded successfully! Processing will begin shortly.');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || error.message || 'Failed to upload document');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => documentService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.documents.all });
      toast.success('Document deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || error.message || 'Failed to delete document');
    },
  });

  const handleFileUpload = (file) => {
    uploadMutation.mutate(file);
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this document?')) {
      deleteMutation.mutate(id);
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  const filteredDocuments = documents.filter((doc) =>
    doc.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="font-serif text-3xl text-foreground mb-2">
            Document Dashboard
          </h1>
          <p className="text-muted-foreground">
            Analyze and manage your legal documents with AI-powered insights
          </p>
        </motion.div>

        {/* Upload Zone */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8">
          <UploadCard
            onFileSelect={handleFileUpload}
            isUploading={uploadMutation.isPending}
          />
        </motion.div>

        {/* Toolbar */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-80"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex border border-border rounded-lg p-1">
              <Button
                variant={view === "grid" ? "default" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setView("grid")}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={view === "list" ? "default" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setView("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-16">
            <p className="text-destructive mb-4">{error.message || 'Failed to load documents'}</p>
            <Button onClick={() => queryClient.invalidateQueries({ queryKey: queryKeys.documents.all })}>
              Try Again
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && documents.length === 0 && <EmptyState />}

        {/* Documents Grid */}
        {!isLoading && !error && documents.length > 0 && (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className={cn(
              "grid gap-6",
              view === "grid"
                ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                : "grid-cols-1"
            )}
          >
            {filteredDocuments.map((doc) => (
              <motion.div key={doc.id} variants={item}>
                <DocumentCard doc={doc} onDelete={handleDelete} />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* No search results */}
        {!isLoading && !error && documents.length > 0 && filteredDocuments.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No documents match your search</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
