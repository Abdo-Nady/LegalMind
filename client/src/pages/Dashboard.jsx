import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FileText, MoreVertical, Calendar, AlertTriangle, CheckCircle, Clock, Plus, Search, Filter, Grid3X3, List, } from "lucide-react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UploadCard } from "@/components/ui/upload-card";
import { cn } from "@/lib/utils";
const sampleDocuments = [
  {
    id: "1",
    name: "Master Service Agreement - Acme Corp",
    uploadDate: "Dec 19, 2024",
    status: "ready",
    riskLevel: "high",
    pages: 24,
    type: "Contract",
  },
  {
    id: "2",
    name: "NDA - Confidentiality Agreement",
    uploadDate: "Dec 18, 2024",
    status: "ready",
    riskLevel: "low",
    pages: 8,
    type: "NDA",
  },
  {
    id: "3",
    name: "Employment Contract - Senior Developer",
    uploadDate: "Dec 17, 2024",
    status: "processing",
    pages: 12,
    type: "Employment",
  },
  {
    id: "4",
    name: "Vendor Agreement - Cloud Services",
    uploadDate: "Dec 16, 2024",
    status: "ready",
    riskLevel: "medium",
    pages: 18,
    type: "Contract",
  },
];
function DocumentCard({ doc }) {
  const riskConfig = {
    high: { icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10" },
    medium: { icon: Clock, color: "text-warning", bg: "bg-warning/10" },
    low: { icon: CheckCircle, color: "text-success", bg: "bg-success/10" },
  };
  const risk = doc.riskLevel ? riskConfig[doc.riskLevel] : null;
  return (<Link to={`/document/${doc.id}`}>
    <Card variant="interactive" className="group">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className={cn("h-12 w-12 rounded-lg flex items-center justify-center", risk?.bg || "bg-muted")}>
            <FileText className={cn("h-6 w-6", risk?.color || "text-muted-foreground")} />
          </div>
          <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>

        {/* Title */}
        <h3 className="font-medium text-foreground mb-2 line-clamp-2 group-hover:text-accent transition-colors">
          {doc.name}
        </h3>

        {/* Meta */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <Calendar className="h-3.5 w-3.5" />
          <span>{doc.uploadDate}</span>
          <span className="text-border">•</span>
          <span>{doc.pages} pages</span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs">
            {doc.type}
          </Badge>
          {doc.status === "processing" ? (<Badge variant="processing">Processing</Badge>) : doc.riskLevel ? (<Badge variant={doc.riskLevel === "high"
            ? "danger"
            : doc.riskLevel === "medium"
              ? "warning"
              : "success"}>
            {doc.riskLevel === "high"
              ? "High Risk"
              : doc.riskLevel === "medium"
                ? "Medium Risk"
                : "Low Risk"}
          </Badge>) : null}
        </div>
      </div>
    </Card>
  </Link>);
}
export default function Dashboard() {
  const [view, setView] = useState("grid");
  const [searchQuery, setSearchQuery] = useState("");
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
  return (<DashboardLayout>
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
        <UploadCard onFileSelect={(file) => {
          // Handle file upload here
        }} />
      </motion.div>

      {/* Toolbar */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search documents..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 w-80" />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex border border-border rounded-lg p-1">
            <Button variant={view === "grid" ? "default" : "ghost"} size="icon" className="h-8 w-8" onClick={() => setView("grid")}>
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button variant={view === "list" ? "default" : "ghost"} size="icon" className="h-8 w-8" onClick={() => setView("list")}>
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="premium">
            <Plus className="h-4 w-4 mr-2" />
            New Document
          </Button>
        </div>
      </motion.div>

      {/* Documents Grid */}
      <motion.div variants={container} initial="hidden" animate="show" className={cn("grid gap-6", view === "grid"
        ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        : "grid-cols-1")}>
        {sampleDocuments
          .filter((doc) => doc.name.toLowerCase().includes(searchQuery.toLowerCase()))
          .map((doc) => (<motion.div key={doc.id} variants={item}>
            <DocumentCard doc={doc} />
          </motion.div>))}
      </motion.div>
    </div>
  </DashboardLayout>);
}
