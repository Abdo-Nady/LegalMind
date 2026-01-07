import { Languages } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ variant = "default", className }) {
  const { currentLanguage, changeLanguage } = useLanguage();

  const toggleLanguage = () => {
    changeLanguage(currentLanguage === 'en' ? 'ar' : 'en');
  };

  return (
    <Button
      variant={variant === "ghost" ? "ghost" : "outline"}
      size="sm"
      onClick={toggleLanguage}
      className={cn("gap-2", className)}
    >
      <Languages className="h-4 w-4" />
      <span className="hidden sm:inline">
        {currentLanguage === 'en' ? 'العربية' : 'English'}
      </span>
    </Button>
  );
}
