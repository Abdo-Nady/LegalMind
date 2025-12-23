import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
const buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0", {
    variants: {
        variant: {
            default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-premium hover:shadow-premium-hover",
            destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-premium",
            outline: "border border-border bg-transparent hover:bg-muted hover:text-foreground",
            secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-premium",
            ghost: "hover:bg-muted hover:text-foreground",
            link: "text-accent underline-offset-4 hover:underline",
            premium: "bg-gradient-to-r from-secondary to-secondary/80 text-primary font-semibold shadow-gold hover:shadow-premium-hover hover:scale-[1.02]",
            accent: "bg-accent text-accent-foreground hover:bg-accent/90 shadow-teal",
            hero: "bg-primary text-primary-foreground border border-secondary/30 hover:bg-primary/95 hover:border-secondary/50 shadow-navy font-medium",
            "hero-outline": "border-2 border-primary/20 bg-transparent text-primary hover:bg-primary/5 hover:border-primary/30",
        },
        size: {
            default: "h-10 px-5 py-2",
            sm: "h-9 rounded-md px-4",
            lg: "h-12 rounded-lg px-8 text-base",
            xl: "h-14 rounded-xl px-10 text-lg",
            icon: "h-10 w-10",
        },
    },
    defaultVariants: {
        variant: "default",
        size: "default",
    },
});
const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props}/>;
});
Button.displayName = "Button";
export { Button, buttonVariants };
