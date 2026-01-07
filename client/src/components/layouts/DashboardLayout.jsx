import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LayoutDashboard, Scale, Settings, LogOut, Menu, X, LogIn, Home } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/ui/language-switcher";

const navItems = [
  { icon: Home, labelKey: "nav.home", path: "/" },
  { icon: LayoutDashboard, labelKey: "nav.dashboard", path: "/dashboard" },
  { icon: Scale, labelKey: "nav.egyptianLaw", path: "/egyptian-law" },
  { icon: Settings, labelKey: "nav.settings", path: "/settings" },
];

export function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, isGuest, user } = useAuth();
  const { t } = useTranslation();
  const { isRTL } = useLanguage();

  const handleSignOut = async () => {
    await logout();
    navigate("/login");
  };

  // Filter nav items - hide Settings for guests
  const filteredNavItems = isGuest
    ? navItems.filter(item => item.path !== "/settings")
    : navItems;

  // Get user initials for avatar
  const getInitials = () => {
    if (user?.username) {
      return user.username.substring(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return "U";
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <motion.aside
        key={isRTL ? 'rtl' : 'ltr'}
        initial={{
          width: sidebarOpen ? 260 : 72,
          right: isRTL ? 0 : 'auto',
          left: isRTL ? 'auto' : 0
        }}
        animate={{
          width: sidebarOpen ? 260 : 72,
          right: isRTL ? 0 : 'auto',
          left: isRTL ? 'auto' : 0
        }}
        transition={{ duration: 0.3 }}
        className={cn(
          "fixed top-0 h-full z-40 bg-sidebar border-sidebar-border flex flex-col",
          isRTL ? "border-l" : "border-r"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
          {sidebarOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
              <img
                src="/images/legal-mind-logo.png"
                alt="LegalMind.ai"
                className="h-8 w-auto"
              />
              <span className="font-serif text-lg">
                <span className="text-sidebar-foreground">Legal</span>
                <span className="text-secondary">Mind</span>
                <span className="text-sidebar-foreground">.ai</span>
              </span>
            </motion.div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-sidebar-foreground hover:bg-sidebar-accent"
          >
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2">
          <ul className="space-y-1">
            {filteredNavItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-primary"
                        : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                    )}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    {sidebarOpen && (
                      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm font-medium">
                        {t(item.labelKey)}
                      </motion.span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Language Switcher */}
        {sidebarOpen && (
          <div className="px-4 pb-2">
            <LanguageSwitcher variant="ghost" className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent/50" />
          </div>
        )}

        {/* User Section */}
        <div className="p-4 border-t border-sidebar-border">
          {sidebarOpen && !isGuest && user && (
            <div className="mb-3 px-3 py-2 rounded-lg bg-sidebar-accent/30">
              {/* Avatar */}
              <div className="flex items-center gap-3 mb-2">
                {user?.profile?.avatar_url ? (
                  <img
                    src={user.profile.avatar_url}
                    alt="Profile"
                    className="h-10 w-10 rounded-lg object-cover"

                  />

                ) : (
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground text-sm font-medium">
                    {getInitials()}
                  </div>
                )}
              </div>
              <p className="text-xs text-sidebar-foreground/60 mb-1">{t('sidebar.signedInAs')}</p>
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user.email || user.username}
              </p>
            </div>
          )}
          {sidebarOpen && isGuest && (
            <div className="mb-3 px-3 py-2 rounded-lg bg-sidebar-accent/30">
              <p className="text-xs text-sidebar-foreground/60 mb-1">{t('sidebar.mode')}</p>
              <p className="text-sm font-medium text-sidebar-foreground">{t('sidebar.guest')}</p>

            </div>
          )}
          <button
            onClick={handleSignOut}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
              "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
            )}
          >
            {isGuest ? (
              <LogIn className="h-5 w-5 flex-shrink-0" />
            ) : (
              <LogOut className="h-5 w-5 flex-shrink-0" />
            )}
            {sidebarOpen && (
              <span className="text-sm font-medium">
                {isGuest ? t('common.signIn') : t('common.signOut')}
              </span>
            )}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className={cn(
        "flex-1 transition-all duration-300",
        isRTL
          ? (sidebarOpen ? "mr-[260px]" : "mr-[72px]")
          : (sidebarOpen ? "ml-[260px]" : "ml-[72px]")
      )}>
        {children}
      </main>
    </div>
  );
}
