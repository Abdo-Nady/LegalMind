import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { AvatarIcon } from "./avatar-icon";
import { CitationTag } from "./citation-tag";
import ReactMarkdown from "react-markdown";
export function MessageBubble({ role, content, citations, onCitationClick, className, }) {
    const isAI = role === "ai";
    return (<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={cn("flex gap-3", isAI ? "flex-row" : "flex-row-reverse", className)}>
      <AvatarIcon type={role} className="flex-shrink-0 mt-1"/>
      
      <div className={cn("max-w-[85%] rounded-2xl px-4 py-3", isAI
            ? "bg-card border border-border shadow-sm"
            : "bg-primary text-primary-foreground")}>
        <div className={cn("prose prose-sm max-w-none", isAI ? "text-foreground" : "text-primary-foreground prose-invert")}>
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
        
        {citations && citations.length > 0 && (<div className="mt-2 flex flex-wrap gap-1.5 pt-2 border-t border-border/50">
            {citations.map((citation, idx) => (<CitationTag key={idx} page={citation.page} onClick={() => onCitationClick?.(citation.page)}/>))}
          </div>)}
      </div>
    </motion.div>);
}
