import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { queryClient } from "@/lib/queryClient";
import Index from "./pages/Index";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import DocumentWorkbench from "./pages/DocumentWorkbench";
import EgyptianLaw from "./pages/EgyptianLaw";
import LawWorkbench from "./pages/LawWorkbench";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { PublicRoute } from "./components/PublicRoute";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <LanguageProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <Routes>
            {/* Home page accessible to everyone */}
            <Route path="/" element={<Index />} />

            {/* <Route path="/login" element={<Login />} /> */}
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
            <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />

            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/egyptian-law" element={<ProtectedRoute><EgyptianLaw /></ProtectedRoute>} />
            <Route path="/egyptian-law/:lawId" element={<ProtectedRoute><LawWorkbench /></ProtectedRoute>} />
            <Route path="/documents" element={<Navigate to="/dashboard" replace />} />
            <Route path="/document/:id" element={<ProtectedRoute><DocumentWorkbench /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </BrowserRouter>
        </LanguageProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
