import { useTranslation } from "react-i18next";
import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Send, MessageSquare, FileText, Lightbulb, Loader2, Scale } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { MessageBubble } from "@/components/ui/message-bubble";
import { ThinkingIndicator } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { lawService } from "@/services/law.service";
import { toast } from "sonner";

// Query keys for law-related queries
const lawQueryKeys = {
  clauses: (slug) => ["laws", slug, "clauses"],
  summary: (slug) => ["laws", slug, "summary"],
};

export function LawChatPanel({ lawSlug, lawTitle, onCitationClick, className }) {
  const { t, i18n } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [activeTab, setActiveTab] = useState("chat");
  const messagesEndRef = useRef(null);

  const isRTL = i18n.language === "ar";

  // Fetch clauses for insights tab
  const {
    data: clausesData,
    isLoading: clausesLoading,
    refetch: refetchClauses,
  } = useQuery({
    queryKey: lawQueryKeys.clauses(lawSlug),
    queryFn: () => lawService.getClauses(lawSlug),
    enabled: !!lawSlug && activeTab === "insights",
    staleTime: 5 * 60 * 1000,
  });

  // Fetch summary
  const {
    data: summaryData,
    isLoading: summaryLoading,
    refetch: refetchSummary,
  } = useQuery({
    queryKey: lawQueryKeys.summary(lawSlug),
    queryFn: () => lawService.getSummary(lawSlug),
    enabled: !!lawSlug && activeTab === "notes",
    staleTime: 5 * 60 * 1000,
  });

  // Chat mutation
  const chatMutation = useMutation({
    mutationFn: ({ query }) => lawService.chat(lawSlug, query, sessionId),
    onSuccess: (data) => {
      if (data.session_id) {
        setSessionId(data.session_id);
      }

      const aiMessage = {
        id: data.message_id?.toString() || Date.now().toString(),
        role: "ai",
        content: data.answer,
        citations:
          data.sources?.map((source, idx) => ({
            page: source.page,
            text: `Source ${idx + 1}`,
          })) || [],
      };
      setMessages((prev) => [...prev, aiMessage]);
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.error || error.message || "Failed to get response"
      );
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

    chatMutation.mutate({ query });
  };

  const tabs = [
    { id: "chat", label: t("chat.tabs.chat"), icon: MessageSquare },
    { id: "insights", label: t("chat.tabs.insights"), icon: Lightbulb },
    { id: "notes", label: t("chat.tabs.summary"), icon: FileText },
  ];

  const suggestedPrompts = (lawSlug === "labor-law" ? [
    "ما هي حقوق العامل في العلاوة السنوية؟",
    "كيف يتم كتابة عقد العمل؟",
    "ما هي ساعات العمل القانونية؟",
    "ما هي حالات إنهاء عقد العمل؟",
    "ما هي إجازات العامل؟",
    "ما هي إجراءات فصل العامل لسوء السلوك الجسيم (المادة ٦٩)؟",
    "هل يجوز لصاحب العمل خفض الراتب أو تغيير المسمى الوظيفي؟",
    "كيف يتم حساب الساعات الإضافية (Overtime) حسب القانون؟",
  ] : lawSlug === "constitution" ? [
    "ما هي حقوقي عند القبض علي أو تفتيش منزلي؟",
    "هل تكفل الدولة الحق في السكن الملائم؟",
    "ما هي حقوق الموظفين في التأمين الاجتماعي والمعاشات؟",
    "كيف يحمي الدستور حرمة الحياة الخاصة والمراسلات؟",
    "ما هي التزامات الدولة بتوفير الرعاية الصحية المجانية؟",
  ] : lawSlug === "civil-code" ? [
    "متى يحق للمالك فسخ عقد الإيجار؟",
    "ما هي التعويضات عن التأخير في تنفيذ الالتزام؟",
    "ما هي شروط صحة بيع العقارات والتسجيل؟",
    "ما هي حقوق الدائن في الحجز على أموال المدين؟",
    "كيف يتم إثبات الديون التجارية؟",
  ] : lawSlug === "penal-code" ? [
    "ما هي حالات الدفاع الشرعي عن النفس؟",
    "ما الفرق بين الجنحة والجناية في العقوبة؟",
    "ما هي عقوبة التزوير في المحررات الرسمية؟",
    "متى تنقضي الدعوى الجنائية بالتصالح؟",
    "ما هي جرائم الإنترنت وعقوباتها؟",
  ] : lawSlug === "tax-procedures" ? [
    "كيف يتم تقديم الإقرار الضريبي إلكترونيًا؟",
    "ما هي إجراءات الطعن على التقديرات الضريبية؟",
    "ما هي عقوبة التهرب الضريبي وغرامات التأخير؟",
    "ما هي شروط الفاتورة الإلكترونية؟",
    "من هم الملزمون بالتسجيل في ضريبة القيمة المضافة؟",
  ] : [
    "ما هي حقوقي الأساسية؟",
    "اشرح لي أهم المواد القانونية",
    "ما هي العقوبات المقررة؟",
    "كيف يحميني القانون في هذا الموقف؟",
  ]);

  return (
    <div className={cn("flex flex-col h-full bg-background", className)} dir={isRTL ? "rtl" : "ltr"}>
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
                layoutId="lawActiveTab"
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
                    <Scale className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {t("chat.examples.askAbout", { lawTitle: lawTitle || t("chat.examples.defaultLaw") })}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2 mb-4">
                      {t("chat.examples.title")}
                    </p>
                    <div className="flex flex-wrap justify-center gap-2 max-w-md mx-auto">
                      {suggestedPrompts.map((prompt) => (
                        <button
                          key={prompt}
                          onClick={() => {
                            setInput(prompt);
                          }}
                          className="px-4 py-2.5 text-sm rounded-xl bg-accent/50 hover:bg-accent text-foreground transition-colors shadow-sm hover:shadow-md"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
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
                  <div className="flex items-center gap-3 dir-rtl">
                    <div className="h-8 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <ThinkingIndicator className="scale-75" />
                    </div>
                    <span className="text-sm text-muted-foreground animate-pulse">
                      {t("chat.thinking")}
                    </span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-border bg-card">
                {messages.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-3 mb-2 scrollbar-hide mask-fade-right">
                    {suggestedPrompts.map((prompt) => (
                      <button
                        key={prompt}
                        onClick={() => setInput(prompt)}
                        className="whitespace-nowrap px-3 py-1.5 text-xs rounded-full bg-accent/10 hover:bg-accent/20 border border-accent/20 text-foreground/80 transition-colors flex-shrink-0"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                )}
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
                      placeholder={t("chat.inputPlaceholder")}
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
                  <span className="ml-2 text-muted-foreground">
                    {t("chat.analysis.loading")}
                  </span>
                </div>
              ) : clausesData?.analysis ? (
                <div className="space-y-3">
                  <h3 className={`font-serif text-lg text-foreground ${isRTL ? "text-right" : "text-left"}`}>
                    {t("chat.analysis.title")}
                  </h3>
                  <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                    <div className="prose-legal text-sm" dir="rtl">
                      <ReactMarkdown>{clausesData.analysis}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Lightbulb className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    {t("chat.analysis.empty")}
                  </p>
                  <Button onClick={() => refetchClauses()} variant="outline">
                    {t("chat.analysis.generate")}
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
                  <span className="ml-2 text-muted-foreground">
                    {t("chat.summarization.loading")}
                  </span>
                </div>
              ) : summaryData?.summary ? (
                <div className="space-y-3">
                  <h3 className={`font-serif text-lg text-foreground ${isRTL ? "text-right" : "text-left"}`}>
                    {t("chat.summarization.title")}
                  </h3>
                  <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                    <div className="prose-legal text-sm" dir="rtl">
                      <ReactMarkdown>{summaryData.summary}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    {t("chat.summarization.empty")}
                  </p>
                  <Button onClick={() => refetchSummary()} variant="outline">
                    {t("chat.summarization.generate")}
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
