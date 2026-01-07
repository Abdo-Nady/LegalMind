import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LayoutDashboard, FileText, Settings, LogOut, Menu, X, Sparkles, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: FileText, label: "Documents", path: "/documents" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, isGuest, user } = useAuth();

  // Apply theme on mount and whenever localStorage changes
  useEffect(() => {
    const applyTheme = () => {
      const root = document.documentElement;
      const saved = localStorage.getItem("mode_type");

      // Clean up old custom theme data
      localStorage.removeItem("colors");
      localStorage.removeItem("mode_name");

      // Reset existing classes
      root.classList.remove("light", "dark");

      // Apply theme - default to light if custom or not set
      if (saved === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.add("light");
        // Ensure light is saved if it was custom or empty
        if (saved !== "light") {
          localStorage.setItem("mode_type", "light");
        }
      }
    };

    // Apply theme immediately
    applyTheme();

    // Listen for storage changes (when Settings updates the theme)
    const handleStorageChange = (e) => {
      if (e.key === "mode_type") {
        applyTheme();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // Custom event for same-tab updates
    const handleThemeChange = () => {
      applyTheme();
    };

    window.addEventListener("themeChange", handleThemeChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("themeChange", handleThemeChange);
    };
  }, []);

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
        initial={false}
        animate={{ width: sidebarOpen ? 260 : 72 }}
        className="fixed left-0 top-0 h-full z-40 bg-sidebar border-r border-sidebar-border flex flex-col"
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
          {sidebarOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-secondary to-secondary/70 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <span className="font-serif text-lg text-sidebar-foreground">
                LegalMind.ai
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
                        {item.label}
                      </motion.span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

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
              <p className="text-xs text-sidebar-foreground/60 mb-1">Signed in as</p>
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user.email || user.username}
              </p>
            </div>
          )}
          {sidebarOpen && isGuest && (
            <div className="mb-3 px-3 py-2 rounded-lg bg-sidebar-accent/30">
              <p className="text-xs text-sidebar-foreground/60 mb-1">Mode</p>
              <p className="text-sm font-medium text-sidebar-foreground">Guest</p>
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
                {isGuest ? "Sign In" : "Sign Out"}
              </span>
            )}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className={cn("flex-1 transition-all duration-300", sidebarOpen ? "ml-[260px]" : "ml-[72px]")}>
        {children}
      </main>
    </div>
  );
}
