import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export function UploadCard({ onFileSelect, isUploading = false, className }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const inputRef = useRef(null);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type === "application/pdf") {
      setSelectedFile(file);
      onFileSelect?.(file);
      // Clear selected file after upload starts
      setTimeout(() => setSelectedFile(null), 500);
    }
  }, [onFileSelect]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      onFileSelect?.(file);
      // Clear selected file after upload starts
      setTimeout(() => setSelectedFile(null), 500);
    }
    // Reset input so same file can be uploaded again
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div
      className={cn(
        "relative rounded-xl border-2 border-dashed transition-all duration-300",
        isDragOver
          ? "border-accent bg-accent/5 scale-[1.02]"
          : "border-border hover:border-accent/50 bg-card",
        isUploading && "pointer-events-none opacity-70",
        className
      )}
      onDragOver={(e) => {
        e.preventDefault();
        if (!isUploading) setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={isUploading ? undefined : handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        onChange={handleFileChange}
        className="hidden"
        id="file-upload"
        disabled={isUploading}
      />

      <AnimatePresence mode="wait">
        {isUploading ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center justify-center p-8"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 mb-4">
              <Loader2 className="h-8 w-8 text-accent animate-spin" />
            </div>
            <p className="text-lg font-medium text-foreground mb-1">
              Uploading document...
            </p>
            <p className="text-sm text-muted-foreground">
              Processing and analyzing your PDF
            </p>
          </motion.div>
        ) : selectedFile ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex items-center justify-between p-6"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-destructive/10">
                <FileText className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="font-medium text-foreground">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={clearFile}>
              <X className="h-4 w-4" />
            </Button>
          </motion.div>
        ) : (
          <motion.label
            htmlFor="file-upload"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center p-8 cursor-pointer"
          >
            <motion.div
              animate={isDragOver ? { scale: 1.1, y: -5 } : { scale: 1, y: 0 }}
              className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 mb-4"
            >
              <Upload className="h-8 w-8 text-accent" />
            </motion.div>
            <p className="text-lg font-medium text-foreground mb-1">
              Drop your PDF here
            </p>
            <p className="text-sm text-muted-foreground">
              or click to browse files
            </p>
          </motion.label>
        )}
      </AnimatePresence>
    </div>
  );
}
