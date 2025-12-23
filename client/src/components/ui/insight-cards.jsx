import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle, Clock, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";
export function RiskCard({ level, title, description, className }) {
    const config = {
        high: {
            icon: AlertTriangle,
            bgColor: "bg-destructive/10",
            borderColor: "border-destructive/30",
            iconColor: "text-destructive",
            label: "High Risk",
        },
        medium: {
            icon: Clock,
            bgColor: "bg-warning/10",
            borderColor: "border-warning/30",
            iconColor: "text-warning",
            label: "Medium Risk",
        },
        low: {
            icon: CheckCircle,
            bgColor: "bg-success/10",
            borderColor: "border-success/30",
            iconColor: "text-success",
            label: "Low Risk",
        },
    };
    const { icon: Icon, bgColor, borderColor, iconColor, label } = config[level];
    return (<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={cn("rounded-lg border p-4", bgColor, borderColor, className)}>
      <div className="flex items-start gap-3">
        <div className={cn("flex-shrink-0 mt-0.5", iconColor)}>
          <Icon className="h-5 w-5"/>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn("text-xs font-semibold uppercase tracking-wide", iconColor)}>
              {label}
            </span>
          </div>
          <h4 className="font-medium text-foreground mb-1">{title}</h4>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </motion.div>);
}
export function ActionItemCard({ items, className }) {
    return (<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={cn("rounded-lg border border-accent/20 bg-accent/5 p-4", className)}>
      <div className="flex items-center gap-2 mb-3">
        <ListChecks className="h-4 w-4 text-accent"/>
        <span className="text-sm font-semibold text-accent">Action Items</span>
      </div>
      <ul className="space-y-2">
        {items.map((item, idx) => (<li key={idx} className="flex items-start gap-2">
            <input type="checkbox" defaultChecked={item.completed} className="mt-1 rounded border-border text-accent focus:ring-accent"/>
            <span className={cn("text-sm", item.completed ? "text-muted-foreground line-through" : "text-foreground")}>
              {item.text}
            </span>
          </li>))}
      </ul>
    </motion.div>);
}
