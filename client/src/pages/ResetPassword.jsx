import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { authService } from "@/services/auth.service";
import { toast } from "sonner";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    newPassword1: "",
    newPassword2: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);

  const uid = searchParams.get("uid");
  const token = searchParams.get("token");

  useEffect(() => {
    // Validate that we have uid and token
    if (!uid || !token) {
      setTokenValid(false);
      toast.error("Invalid password reset link");
    }
  }, [uid, token]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validatePasswords = () => {
    if (formData.newPassword1.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return false;
    }

    if (formData.newPassword1 !== formData.newPassword2) {
      toast.error("Passwords do not match");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validatePasswords()) {
      return;
    }

    setIsLoading(true);

    try {
      await authService.confirmPasswordReset({
        uid,
        token,
        newPassword1: formData.newPassword1,
        newPassword2: formData.newPassword2,
      });

      setResetSuccess(true);
      toast.success("Password reset successful!");

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (error) {
      console.error("Password reset error:", error);

      if (error.response?.status === 400) {
        toast.error("Invalid or expired reset link. Please request a new one.");
        setTokenValid(false);
      } else {
        toast.error(error.response?.data?.detail || "Failed to reset password. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/20 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="shadow-2xl border-border/50">
            <CardHeader className="space-y-1 text-center pb-6">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                  <XCircle className="h-8 w-8 text-destructive" />
                </div>
              </div>
              <CardTitle className="text-2xl font-serif">Invalid Reset Link</CardTitle>
              <CardDescription>This password reset link is invalid or has expired</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Password reset links expire after 24 hours for security reasons. Please request a new reset link.
              </p>

              <div className="flex gap-2">
                <Link to="/forgot-password" className="flex-1">
                  <Button variant="outline" className="w-full">
                    Request New Link
                  </Button>
                </Link>
                <Link to="/login" className="flex-1">
                  <Button className="w-full">Back to Login</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (resetSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/20 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="shadow-2xl border-border/50">
            <CardHeader className="space-y-1 text-center pb-6">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-success" />
                </div>
              </div>
              <CardTitle className="text-2xl font-serif">Password Reset Successful!</CardTitle>
              <CardDescription>Your password has been changed successfully</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                You can now log in with your new password. Redirecting to login page...
              </p>

              <Link to="/login">
                <Button className="w-full">Go to Login</Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/20 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-2xl border-border/50">
          <CardHeader className="space-y-1 text-center pb-6">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Lock className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl font-serif">Set New Password</CardTitle>
            <CardDescription>Enter your new password below</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword1">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword1"
                    name="newPassword1"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={formData.newPassword1}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">Must be at least 8 characters</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword2">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword2"
                    name="newPassword2"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={formData.newPassword2}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Resetting Password...
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Reset Password
                  </>
                )}
              </Button>

              <div className="text-center pt-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                    Back to Login
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
