import { cn } from "@/lib/utils";
export function AvatarIcon({ type, className }) {
    if (type === "ai") {
        return (<div className={cn("flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-navy", className)}>
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/>
          <path d="M2 17l10 5 10-5"/>
          <path d="M2 12l10 5 10-5"/>
        </svg>
      </div>);
    }
    return (<div className={cn("flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground", className)}>
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="8" r="4"/>
        <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
      </svg>
    </div>);
}
