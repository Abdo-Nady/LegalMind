import { cn } from "@/lib/utils";
import { Badge } from "./badge";
export function RiskBadge({ level, className }) {
    const config = {
        high: { variant: "danger", label: "High Risk" },
        medium: { variant: "warning", label: "Medium Risk" },
        low: { variant: "success", label: "Low Risk" },
    };
    const { variant, label } = config[level];
    return (<Badge variant={variant} className={cn("font-medium", className)}>
      {label}
    </Badge>);
}
export function StatusBadge({ status, className }) {
    const config = {
        processing: { variant: "processing", label: "Processing" },
        ready: { variant: "ready", label: "Ready" },
        error: { variant: "danger", label: "Error" },
    };
    const { variant, label } = config[status];
    return (<Badge variant={variant} className={className}>
      {label}
    </Badge>);
}
