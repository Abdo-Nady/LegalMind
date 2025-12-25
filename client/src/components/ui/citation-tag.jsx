import { cn } from "@/lib/utils";
export function CitationTag({ page, onClick, className }) {
    return (<button onClick={onClick} className={cn("inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium", "bg-accent/10 text-accent hover:bg-accent/20 transition-colors cursor-pointer", className)}>
      [Pg {page}]
    </button>);
}
