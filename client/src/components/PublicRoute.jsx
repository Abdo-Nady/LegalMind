import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  // Force light theme on all public pages (login, register, forgot password, etc.)
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark");
    root.classList.add("light");
  }, []);

  if (loading) return <div>Loading...</div>;

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
};
