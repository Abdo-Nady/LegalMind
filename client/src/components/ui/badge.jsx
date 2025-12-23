import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
const badgeVariants = cva("inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", {
    variants: {
        variant: {
            default: "border-transparent bg-primary text-primary-foreground",
            secondary: "border-transparent bg-secondary text-secondary-foreground",
            destructive: "border-transparent bg-destructive text-destructive-foreground",
            outline: "text-foreground border-border",
            success: "border-success/20 bg-success/15 text-success",
            warning: "border-warning/20 bg-warning/15 text-warning",
            danger: "border-destructive/20 bg-destructive/15 text-destructive",
            premium: "border-secondary/30 bg-secondary/10 text-secondary font-medium",
            processing: "border-accent/20 bg-accent/10 text-accent animate-pulse",
            ready: "border-success/20 bg-success/10 text-success",
        },
    },
    defaultVariants: {
        variant: "default",
    },
});
function Badge({ className, variant, ...props }) {
    return <div className={cn(badgeVariants({ variant }), className)} {...props}/>;
}
export { Badge, badgeVariants };
