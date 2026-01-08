import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { authService } from "@/services/auth.service";
import { toast } from "sonner";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setIsLoading(true);

    try {
      await authService.requestPasswordReset(email);
      setEmailSent(true);
      toast.success("Password reset email sent successfully");
    } catch (error) {
      // Don't reveal if email exists or not for security
      setEmailSent(true);
      console.error("Password reset error:", error);
    } finally {
      setIsLoading(false);
    }
  };

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
                <Mail className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl font-serif">Forgot Password?</CardTitle>
            <CardDescription>
              {emailSent
                ? "Check your email for reset instructions"
                : "No worries, we'll send you reset instructions"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {!emailSent ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Send Reset Link
                    </>
                  )}
                </Button>

                <div className="text-center pt-2">
                  <Link to="/login">
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Login
                    </Button>
                  </Link>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="bg-success/10 border border-success/20 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2 text-success">
                    <CheckCircle className="h-5 w-5" />
                    <h3 className="font-semibold">Email Sent!</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    If an account exists with <strong>{email}</strong>, you will receive password reset instructions
                    shortly.
                  </p>
                </div>

                <div className="space-y-2 text-sm text-muted-foreground">
                  <p className="font-medium">Didn't receive the email?</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Check your spam or junk folder</li>
                    <li>Make sure you entered the correct email address</li>
                    <li>Wait a few minutes and check again</li>
                  </ul>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setEmailSent(false)}>
                    Try Another Email
                  </Button>
                  <Link to="/login" className="flex-1">
                    <Button className="w-full">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Login
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Additional Help */}
        <div className="text-center mt-6 text-sm text-muted-foreground">
          <p>
            Need help?{" "}
            <a href="mailto:support@documind.com" className="text-primary hover:underline">
              Contact Support
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
