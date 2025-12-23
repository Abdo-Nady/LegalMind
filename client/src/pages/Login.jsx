import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, Sparkles, ArrowRight, Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/Authcontext";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const { login, register, googleLogin, setGuestMode } = useAuth();
  const { toast } = useToast();

  // Load Google Sign-In
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google && import.meta.env.VITE_GOOGLE_CLIENT_ID) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: handleGoogleSignIn,
        });
      }
    };
    document.head.appendChild(script);

    return () => {
      const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  const handleGoogleSignIn = async (response) => {
    setGoogleLoading(true);
    try {
      await googleLogin(response.credential);
      localStorage.setItem('loginMethod', 'google');

      toast({
        title: "Success",
        description: "Logged in with Google successfully!",
      });

      // Force navigation using window.location
      window.location.href = "/dashboard";
    } catch (error) {
      let errorMessage = "Failed to sign in with Google";
      try {
        const errorData = JSON.parse(error.message);
        errorMessage = Object.values(errorData).flat().join(", ") || errorData.detail || errorMessage;
      } catch {
        errorMessage = error.message || errorMessage;
      }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleButtonClick = () => {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // If one-tap is not available, show popup
          window.google.accounts.oauth2.initTokenClient({
            client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
            scope: 'email profile',
            callback: async (tokenResponse) => {
              if (tokenResponse.access_token) {
                setGoogleLoading(true);
                try {
                  // Use googleLogin from context
                  await googleLogin(tokenResponse.access_token);

                  // Set login method flag
                  localStorage.setItem('loginMethod', 'google');

                  toast({
                    title: "Success",
                    description: "Logged in with Google successfully!",
                  });

                  // Navigate immediately
                  navigate("/dashboard");
                } catch (error) {
                  let errorMessage = "Failed to sign in with Google";
                  try {
                    const errorData = JSON.parse(error.message);
                    errorMessage = Object.values(errorData).flat().join(", ") || errorData.detail || errorMessage;
                  } catch {
                    errorMessage = error.message || errorMessage;
                  }
                  toast({
                    title: "Error",
                    description: errorMessage,
                    variant: "destructive",
                  });
                } finally {
                  setGoogleLoading(false);
                }
              }
            }
          }).requestAccessToken();
        }
      });
    } else {
      toast({
        title: "Error",
        description: "Google Sign-In is not loaded. Please refresh the page.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
        localStorage.setItem('loginMethod', 'email');
        toast({
          title: "Success",
          description: "Logged in successfully!",
        });
        navigate("/dashboard");
      } else {
        if (password !== password2) {
          toast({
            title: "Error",
            description: "Passwords don't match",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        await register(username, email, password, password2);
        localStorage.setItem('loginMethod', 'email');
        toast({
          title: "Success",
          description: "Account created successfully!",
        });
        navigate("/dashboard");
      }
    } catch (error) {
      let errorMessage = "An error occurred";
      try {
        const errorData = JSON.parse(error.message);
        errorMessage = Object.values(errorData).flat().join(", ") || errorData.detail || errorMessage;
      } catch {
        errorMessage = error.message || errorMessage;
      }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Visual */}
      <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="hidden lg:flex lg:w-1/2 gradient-hero relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16 text-primary-foreground">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <div className="flex items-center gap-3 mb-8">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-secondary to-secondary/70 flex items-center justify-center shadow-gold">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <span className="font-serif text-3xl">LegalMind.ai</span>
            </div>

            <h1 className="font-serif text-5xl leading-tight mb-6">
              Intelligent Document
              <br />
              <span className="text-gradient-gold">Analysis</span>
            </h1>

            <p className="text-lg text-primary-foreground/80 max-w-md mb-8">
              Transform how you review contracts and legal documents with
              AI-powered insights, risk detection, and intelligent chat.
            </p>

            <div className="flex flex-col gap-4">
              {[
                "Instant risk assessment and clause analysis",
                "AI-powered Q&A with document citations",
                "Secure, enterprise-grade encryption",
              ].map((feature, idx) => (
                <motion.div key={idx} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + idx * 0.1 }} className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-secondary" />
                  <span className="text-primary-foreground/90">{feature}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Trust Badges */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="absolute bottom-16 left-16">
            <p className="text-sm text-primary-foreground/60 mb-4">
              Trusted by leading law firms
            </p>
            <div className="flex items-center gap-6 opacity-60">
              <div className="font-serif text-xl">Baker & Partners</div>
              <div className="font-serif text-xl">Sterling LLP</div>
              <div className="font-serif text-xl">Whitmore Legal</div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Right Panel - Form */}
      <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-secondary to-secondary/70 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <span className="font-serif text-2xl text-foreground">LegalMind.ai</span>
          </div>

          {/* Tabs */}
          <div className="flex mb-8 bg-muted rounded-xl p-1">
            <button onClick={() => setIsLogin(true)} className={cn("flex-1 py-3 text-sm font-medium rounded-lg transition-all", isLogin ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              Sign In
            </button>
            <button onClick={() => setIsLogin(false)} className={cn("flex-1 py-3 text-sm font-medium rounded-lg transition-all", !isLogin ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              Sign Up
            </button>
          </div>

          {/* Form */}
          <motion.form key={isLogin ? "login" : "signup"} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleSubmit} className="space-y-5">
            <div>
              <h2 className="font-serif text-2xl text-foreground mb-2">
                {isLogin ? "Welcome back" : "Create your account"}
              </h2>
              <p className="text-muted-foreground">
                {isLogin
                  ? "Enter your credentials to access your documents"
                  : "Start your free trial with full access"}
              </p>
            </div>

            {/* Social Login */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                type="button"
                onClick={handleGoogleButtonClick}
                disabled={googleLoading || !import.meta.env.VITE_GOOGLE_CLIENT_ID}
              >
                {googleLoading ? (
                  "Loading..."
                ) : (
                  <>
                    <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Google
                  </>
                )}
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with email
                </span>
              </div>
            </div>

            {/* Username (only for signup) */}
            {!isLogin && (
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required={!isLogin}
                />
              </div>
            )}

            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" required />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10" required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPassword ? (<EyeOff className="h-5 w-5" />) : (<Eye className="h-5 w-5" />)}
              </button>
            </div>

            {/* Confirm Password (only for signup) */}
            {!isLogin && (
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm Password"
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                  className="pl-10"
                  required={!isLogin}
                />
              </div>
            )}

            {isLogin && (
              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-sm text-accent hover:underline">
                  Forgot password?
                </Link>
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Loading..." : (isLogin ? "Sign In" : "Create Account")}
              {!loading && <ArrowRight className="h-4 w-4 ml-2" />}
            </Button>

            {/* Guest Bypass */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              size="lg"
              onClick={() => {
                setGuestMode();
                navigate("/dashboard");
              }}
            >
              Continue as Guest
            </Button>

            {!isLogin && (
              <p className="text-xs text-center text-muted-foreground">
                By signing up, you agree to our{" "}
                <Link to="/terms" className="text-accent hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link to="/privacy" className="text-accent hover:underline">
                  Privacy Policy
                </Link>
              </p>
            )}
          </motion.form>
        </div>
      </motion.div>
    </div>
  );
}
