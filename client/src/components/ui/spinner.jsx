import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
export function Spinner({ size = "md", className }) {
    const sizeClasses = {
        sm: "h-4 w-4",
        md: "h-6 w-6",
        lg: "h-8 w-8",
    };
    return (<Loader2 className={cn("animate-spin text-accent", sizeClasses[size], className)}/>);
}
export function ThinkingIndicator({ className }) {
    return (<div className={cn("flex items-center gap-1.5", className)}>
      {[0, 1, 2].map((i) => (<motion.div key={i} className="h-2 w-2 rounded-full bg-accent" animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
            }} transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
            }}/>))}
    </div>);
}
