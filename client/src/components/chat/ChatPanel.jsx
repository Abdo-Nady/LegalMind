import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Paperclip, Mic, MessageSquare, FileText, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MessageBubble } from "@/components/ui/message-bubble";
import { ThinkingIndicator } from "@/components/ui/spinner";
import { RiskCard, ActionItemCard } from "@/components/ui/insight-cards";
import { cn } from "@/lib/utils";
const sampleMessages = [
    {
        id: "1",
        role: "user",
        content: "What are the key liability clauses in this contract?",
    },
    {
        id: "2",
        role: "ai",
        content: "I've identified **3 key liability clauses** in this contract:\n\n1. **Limitation of Liability** (Section 8.2) - Caps damages at the total contract value\n2. **Indemnification** (Section 9.1) - Mutual indemnification for third-party claims\n3. **Force Majeure** (Section 12) - Standard exclusions for acts of God\n\nThe limitation clause may need review as it doesn't carve out exceptions for gross negligence.",
        citations: [
            { page: 4, text: "Section 8.2" },
            { page: 5, text: "Section 9.1" },
            { page: 8, text: "Section 12" },
        ],
    },
];
export function ChatPanel({ onCitationClick, className }) {
    const [messages, setMessages] = useState(sampleMessages);
    const [input, setInput] = useState("");
    const [isThinking, setIsThinking] = useState(false);
    const [activeTab, setActiveTab] = useState("chat");
    const messagesEndRef = useRef(null);
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    useEffect(() => {
        scrollToBottom();
    }, [messages]);
    const handleSend = () => {
        if (!input.trim())
            return;
        const userMessage = {
            id: Date.now().toString(),
            role: "user",
            content: input,
        };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsThinking(true);
        // Simulate AI response
        setTimeout(() => {
            const aiMessage = {
                id: (Date.now() + 1).toString(),
                role: "ai",
                content: "I've analyzed the section you mentioned. Here are my findings based on the document context...",
                citations: [{ page: 3 }],
            };
            setMessages((prev) => [...prev, aiMessage]);
            setIsThinking(false);
        }, 1500);
    };
    const tabs = [
        { id: "chat", label: "Chat", icon: MessageSquare },
        { id: "insights", label: "Insights", icon: Lightbulb },
        { id: "notes", label: "Notes", icon: FileText },
    ];
    return (<div className={cn("flex flex-col h-full bg-background", className)}>
      {/* Tabs */}
      <div className="flex border-b border-border bg-card px-2">
        {tabs.map((tab) => (<button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn("flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative", activeTab === tab.id
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground")}>
            <tab.icon className="h-4 w-4"/>
            {tab.label}
            {activeTab === tab.id && (<motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"/>)}
          </button>))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === "chat" && (<motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (<MessageBubble key={message.id} role={message.role} content={message.content} citations={message.citations} onCitationClick={onCitationClick}/>))}
                {isThinking && (<div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                      <ThinkingIndicator />
                    </div>
                    <span className="text-sm text-muted-foreground">
                      Analyzing document...
                    </span>
                  </div>)}
                <div ref={messagesEndRef}/>
              </div>

              {/* Input */}
              <div className="p-4 border-t border-border bg-card">
                <div className="flex items-end gap-2">
                  <div className="flex-1 relative">
                    <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                }
            }} placeholder="Ask about this document..." rows={1} className="w-full resize-none rounded-xl border border-input bg-background px-4 py-3 pr-24 text-sm focus:outline-none focus:ring-2 focus:ring-ring"/>
                    <div className="absolute right-2 bottom-2 flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Paperclip className="h-4 w-4 text-muted-foreground"/>
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Mic className="h-4 w-4 text-muted-foreground"/>
                      </Button>
                    </div>
                  </div>
                  <Button onClick={handleSend} disabled={!input.trim()}>
                    <Send className="h-4 w-4"/>
                  </Button>
                </div>
              </div>
            </motion.div>)}

          {activeTab === "insights" && (<motion.div key="insights" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full overflow-y-auto p-4 space-y-4">
              <RiskCard level="high" title="Unlimited Liability Exposure" description="Section 8.2 doesn't cap liability for gross negligence or willful misconduct. Consider adding explicit carve-outs."/>
              <RiskCard level="medium" title="Broad Indemnification Scope" description="The indemnification clause covers 'any and all claims' which may be overly broad for standard commercial contracts."/>
              <RiskCard level="low" title="Standard Force Majeure" description="Force majeure provisions are industry-standard and adequately protect both parties."/>
              <ActionItemCard items={[
                { text: "Review liability caps with legal counsel", completed: false },
                { text: "Negotiate indemnification scope", completed: false },
                { text: "Verify insurance coverage alignment", completed: true },
            ]}/>
            </motion.div>)}

          {activeTab === "notes" && (<motion.div key="notes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full overflow-y-auto p-4">
              <div className="space-y-4">
                <h3 className="font-serif text-lg text-foreground">Saved Notes</h3>
                <div className="rounded-lg border border-border bg-card p-4">
                  <p className="text-sm text-muted-foreground mb-2">
                    Extracted from Page 4
                  </p>
                  <p className="text-foreground">
                    "The total aggregate liability shall not exceed the total
                    contract value paid in the 12 months preceding the claim."
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                  <p className="text-sm text-muted-foreground mb-2">
                    Your Note - Dec 19, 2024
                  </p>
                  <p className="text-foreground">
                    Need to discuss the payment terms with finance team before
                    signing.
                  </p>
                </div>
              </div>
            </motion.div>)}
        </AnimatePresence>
      </div>
    </div>);
}
