import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Send, MessageSquare, FileText, Lightbulb, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MessageBubble } from "@/components/ui/message-bubble";
import { ThinkingIndicator } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { queryKeys } from "@/lib/queryClient";
import { documentService } from "@/services/document.service";
import { toast } from "sonner";

export function ChatPanel({ documentId, onCitationClick, className }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [activeTab, setActiveTab] = useState("chat");
  const messagesEndRef = useRef(null);

  // Fetch clauses for insights tab
  const { data: clausesData, isLoading: clausesLoading, refetch: refetchClauses } = useQuery({
    queryKey: queryKeys.documents.clauses(documentId),
    queryFn: () => documentService.getClauses(documentId),
    enabled: !!documentId && activeTab === "insights",
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Fetch summary
  const { data: summaryData, isLoading: summaryLoading, refetch: refetchSummary } = useQuery({
    queryKey: queryKeys.documents.summary(documentId),
    queryFn: () => documentService.getSummary(documentId),
    enabled: !!documentId && activeTab === "notes",
    staleTime: 5 * 60 * 1000,
  });

  // Chat mutation
  const chatMutation = useMutation({
    mutationFn: ({ query }) => documentService.chat(documentId, query, sessionId),
    onSuccess: (data) => {
      // Update session ID for conversation continuity
      if (data.session_id) {
        setSessionId(data.session_id);
      }

      // Add AI response to messages
      const aiMessage = {
        id: data.message_id?.toString() || Date.now().toString(),
        role: "ai",
        content: data.answer,
        citations: data.sources?.map((source, idx) => ({
          page: source.page,
          text: `Source ${idx + 1}`,
        })) || [],
      };
      setMessages((prev) => [...prev, aiMessage]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || error.message || 'Failed to get response');
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, chatMutation.isPending]);

  const handleSend = () => {
    if (!input.trim() || chatMutation.isPending) return;

    const userMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };
    setMessages((prev) => [...prev, userMessage]);

    const query = input;
    setInput("");

    // Send to API
    chatMutation.mutate({ query });
  };

  const tabs = [
    { id: "chat", label: "Chat", icon: MessageSquare },
    { id: "insights", label: "Insights", icon: Lightbulb },
    { id: "notes", label: "Summary", icon: FileText },
  ];

  return (
    <div className={cn("flex flex-col h-full bg-background", className)}>
      {/* Tabs */}
      <div className="flex border-b border-border bg-card px-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative",
              activeTab === tab.id
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"
              />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === "chat" && (
            <motion.div
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col"
            >
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                  <div className="text-center py-8">
                    <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Ask questions about this document
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Try: "What are the key terms?" or "Summarize the liability clauses"
                    </p>
                  </div>
                )}
                {messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    role={message.role}
                    content={message.content}
                    citations={message.citations}
                    onCitationClick={onCitationClick}
                  />
                ))}
                {chatMutation.isPending && (
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                      <ThinkingIndicator />
                    </div>
                    <span className="text-sm text-muted-foreground">
                      Analyzing document...
                    </span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-border bg-card">
                <div className="flex items-end gap-2">
                  <div className="flex-1 relative">
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder="Ask about this document..."
                      rows={1}
                      disabled={chatMutation.isPending}
                      className="w-full resize-none rounded-xl border border-input bg-background px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                    />
                  </div>
                  <Button
                    onClick={handleSend}
                    disabled={!input.trim() || chatMutation.isPending}
                  >
                    {chatMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "insights" && (
            <motion.div
              key="insights"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full overflow-y-auto p-4 space-y-4"
            >
              {clausesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Analyzing clauses...</span>
                </div>
              ) : clausesData?.analysis ? (
                <div className="space-y-4">
                  <h3 className="font-serif text-lg text-foreground">Legal Clause Analysis</h3>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <div className="rounded-lg border border-border bg-card p-4 whitespace-pre-wrap">
                      {clausesData.analysis}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Lightbulb className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    No insights generated yet
                  </p>
                  <Button onClick={() => refetchClauses()} variant="outline">
                    Generate Insights
                  </Button>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "notes" && (
            <motion.div
              key="notes"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full overflow-y-auto p-4"
            >
              {summaryLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Generating summary...</span>
                </div>
              ) : summaryData?.summary ? (
                <div className="space-y-4">
                  <h3 className="font-serif text-lg text-foreground">Executive Summary</h3>
                  <div className="rounded-lg border border-border bg-card p-4 whitespace-pre-wrap">
                    {summaryData.summary}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    No summary generated yet
                  </p>
                  <Button onClick={() => refetchSummary()} variant="outline">
                    Generate Summary
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}