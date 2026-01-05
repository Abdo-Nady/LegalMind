import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FileSearch,
  MessageSquare,
  Zap,
  ArrowRight,
  CheckCircle,
  FileText,
  Brain,
  Lock,
  Send,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// =============================================================================
// CONSTANTS
// =============================================================================

const TYPING_PROMPTS = [
  "What are the high-risk clauses in this contract?",
  "Summarize the key obligations and liabilities...",
  "Are there any unusual termination clauses?",
  "What negotiation points should I focus on?",
  "Identify all payment terms and deadlines...",
  "What are the indemnification provisions?",
];

const TRUST_INDICATORS = [
  { icon: Lock, text: "Enterprise-grade security" },
  { icon: Zap, text: "Instant analysis" },
  { icon: CheckCircle, text: "Certified" },
];

const HOW_IT_WORKS_STEPS = [
  {
    step: "01",
    icon: Upload,
    title: "Upload Your Document",
    description:
      "Drag and drop your contract, NDA, or any legal document. We support PDF files up to 50MB.",
  },
  {
    step: "02",
    icon: Brain,
    title: "AI Analyzes Content",
    description:
      "Our AI reads and understands the legal language, identifying key clauses, risks, and obligations.",
  },
  {
    step: "03",
    icon: MessageSquare,
    title: "Ask Questions & Get Answers",
    description:
      "Chat with your document. Ask anything and get instant answers with page citations.",
  },
];

const FEATURES = [
  {
    icon: FileSearch,
    title: "Instant Risk Detection",
    description:
      "AI automatically identifies high-risk clauses, unusual terms, and potential issues the moment you upload a document.",
  },
  {
    icon: MessageSquare,
    title: "Intelligent Document Chat",
    description:
      "Ask questions about your contracts in plain English. Get answers with precise citations and page references.",
  },
  {
    icon: Brain,
    title: "Smart Clause Analysis",
    description:
      "Compare clauses against industry standards. Get recommendations for stronger language and better protections.",
  },
  {
    icon: FileText,
    title: "Automated Summaries",
    description:
      "Generate executive summaries highlighting key terms, obligations, and important dates automatically.",
  },
  {
    icon: Lock,
    title: "Enterprise Security",
    description:
      "SOC 2 Type II certified. Bank-grade encryption. Your documents never leave your control.",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description:
      "Analyze a 50-page contract in under 30 seconds. Process hundreds of documents in parallel.",
  },
];

const SECURITY_CHECKLIST = [
  "SOC 2 Type II certified infrastructure",
  "256-bit AES encryption at rest and in transit",
  "Documents automatically deleted after 30 days",
  "No data used for AI training",
  "GDPR and CCPA compliant",
];

const SECURITY_STATS = [
  { value: "256-bit", label: "Encryption" },
  { value: "99.9%", label: "Uptime SLA" },
  { value: "SOC 2", label: "Certified" },
  { value: "GDPR", label: "Compliant" },
];

const CTA_BENEFITS = [
  "No credit card required",
  "14-day free trial",
  "Cancel anytime",
];

// =============================================================================
// HOOKS
// =============================================================================

function useTypingAnimation(prompts, { isActive = true } = {}) {
  const [typingText, setTypingText] = useState("");
  const [promptIndex, setPromptIndex] = useState(0);

  useEffect(() => {
    if (!isActive) {
      setTypingText("");
      return;
    }

    const currentPrompt = prompts[promptIndex];
    let charIndex = 0;
    let isDeleting = false;
    let timeout;

    const type = () => {
      if (!isDeleting) {
        if (charIndex <= currentPrompt.length) {
          setTypingText(currentPrompt.slice(0, charIndex));
          charIndex++;
          timeout = setTimeout(type, 50 + Math.random() * 30);
        } else {
          timeout = setTimeout(() => {
            isDeleting = true;
            type();
          }, 2000);
        }
      } else {
        if (charIndex > 0) {
          charIndex--;
          setTypingText(currentPrompt.slice(0, charIndex));
          timeout = setTimeout(type, 25);
        } else {
          isDeleting = false;
          setPromptIndex((prev) => (prev + 1) % prompts.length);
        }
      }
    };

    timeout = setTimeout(type, 500);
    return () => clearTimeout(timeout);
  }, [promptIndex, isActive, prompts]);

  return typingText;
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function Logo({ size = "default" }) {
  const sizeClasses = {
    default: { img: "h-9", text: "text-xl" },
    small: { img: "h-8", text: "text-lg" },
  };
  const { img, text } = sizeClasses[size];

  return (
    <div className="flex items-center gap-2">
      <img
        src="/images/legal-mind-logo.png"
        alt="LegalMind.ai"
        className={`${img} w-auto`}
      />
      <span className={`font-serif ${text}`}>
        <span className="text-primary">Legal</span>
        <span className="text-secondary">Mind</span>
        <span className="text-primary">.ai</span>
      </span>
    </div>
  );
}

function Navigation() {
  const navLinks = [
    { href: "#features", label: "Features" },
    { href: "#how-it-works", label: "How It Works" },
    { href: "#security", label: "Security" },
  ];

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border"
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Logo />

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link to="/login">
            <Button variant="ghost">Sign In</Button>
          </Link>
          <Link to="/login">
            <Button variant="premium">
              Get Started
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}

function PromptBox({ onSubmit, onUploadClick }) {
  const [inputValue, setInputValue] = useState("");
  const [isInputFocused, setIsInputFocused] = useState(false);

  const typingText = useTypingAnimation(TYPING_PROMPTS, {
    isActive: !inputValue && !isInputFocused,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSubmit(inputValue);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="w-full max-w-2xl mx-auto"
    >
      <form onSubmit={handleSubmit}>
        <div
          className={`
            relative bg-card rounded-2xl border-2 transition-all duration-300
            ${
              isInputFocused
                ? "border-accent shadow-[0_8px_40px_rgba(27,180,146,0.25),0_0_20px_rgba(27,180,146,0.15)]"
                : "border-secondary/30 shadow-[0_8px_40px_rgba(197,160,101,0.2),0_4px_20px_rgba(0,0,0,0.1)] hover:shadow-[0_12px_50px_rgba(197,160,101,0.3),0_6px_25px_rgba(0,0,0,0.12)] hover:border-secondary/50"
            }
          `}
        >
          <div className="p-4 md:p-6">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-gradient-to-br from-secondary to-secondary/70 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 relative">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => setIsInputFocused(false)}
                  placeholder=""
                  className="w-full bg-transparent text-foreground text-lg resize-none outline-none min-h-[60px] max-h-[120px] relative z-10"
                  rows={2}
                />
                {!inputValue && !isInputFocused && (
                  <div className="absolute inset-0 pointer-events-none flex items-start">
                    <span className="text-lg text-muted-foreground/40">
                      {typingText}
                      <span className="animate-pulse">|</span>
                    </span>
                  </div>
                )}
                {!inputValue && isInputFocused && (
                  <div className="absolute inset-0 pointer-events-none flex items-start">
                    <span className="text-lg text-muted-foreground/30">
                      Ask a question about your contract...
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
                onClick={onUploadClick}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload PDF
              </Button>
              <Button
                type="submit"
                variant="premium"
                size="sm"
                disabled={!inputValue.trim()}
                className="gap-2"
              >
                Get Started
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </form>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="flex flex-wrap items-center justify-center gap-6 mt-8 text-sm text-muted-foreground"
      >
        {TRUST_INDICATORS.map(({ icon: Icon, text }, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-accent" />
            <span>{text}</span>
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
}

function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="pt-28 pb-16 px-6 relative overflow-hidden min-h-[90vh] flex flex-col justify-center">
      {/* Background Effects */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-secondary/8 rounded-full blur-3xl" />
        <div className="absolute top-40 right-1/4 w-[400px] h-[400px] bg-accent/8 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-1/3 w-[300px] h-[300px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Badge variant="premium" className="mb-6">
            AI-Powered Legal Document Analysis
          </Badge>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="font-serif text-4xl md:text-6xl lg:text-7xl text-foreground mb-6 leading-tight"
        >
          Ask anything about
          <br />
          <span className="text-gradient-gold">your legal documents</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
        >
          Upload contracts, analyze risks, and get instant answers. Powered by
          AI that understands legal language.
        </motion.p>

        <PromptBox
          onSubmit={(prompt) =>
            navigate("/dashboard", { state: { initialPrompt: prompt } })
          }
          onUploadClick={() => navigate("/dashboard")}
        />
      </div>
    </section>
  );
}

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 px-6 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <Badge variant="outline" className="mb-4">
            How It Works
          </Badge>
          <h2 className="font-serif text-4xl text-foreground mb-4">
            Three steps to smarter contracts
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            From upload to insights in under a minute
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {HOW_IT_WORKS_STEPS.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.15 }}
              className="relative"
            >
              <div className="bg-card rounded-2xl border border-border p-8 h-full hover:shadow-premium-hover hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-center gap-4 mb-6">
                  <span className="font-serif text-4xl text-secondary/40">
                    {item.step}
                  </span>
                  <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center">
                    <item.icon className="h-6 w-6 text-accent" />
                  </div>
                </div>
                <h3 className="font-serif text-xl text-foreground mb-3">
                  {item.title}
                </h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
              {idx < 2 && (
                <div className="hidden md:flex absolute top-1/2 -right-4 transform -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-background border border-border items-center justify-center">
                  <ArrowRight className="h-4 w-4 text-secondary" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section id="features" className="py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <Badge variant="outline" className="mb-4">
            Features
          </Badge>
          <h2 className="font-serif text-4xl text-foreground mb-4">
            Everything You Need for Document Analysis
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Powerful tools designed specifically for legal professionals
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="bg-card rounded-xl border border-border p-6 hover:shadow-premium-hover hover:-translate-y-1 transition-all duration-300"
            >
              <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                <feature.icon className="h-6 w-6 text-accent" />
              </div>
              <h3 className="font-serif text-xl text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SecuritySection() {
  return (
    <section id="security" className="py-20 px-6 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <Badge variant="outline" className="mb-4">
              Security
            </Badge>
            <h2 className="font-serif text-4xl text-foreground mb-6">
              Your documents are safe with us
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              We understand the sensitivity of legal documents. That's why we've
              built enterprise-grade security into every layer of our platform.
            </p>
            <div className="space-y-4">
              {SECURITY_CHECKLIST.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-accent flex-shrink-0" />
                  <span className="text-foreground">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="bg-card rounded-2xl border border-border p-8 shadow-premium">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-secondary to-secondary/70 flex items-center justify-center">
                  <Lock className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h3 className="font-serif text-xl text-foreground">
                    Bank-Grade Security
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Trusted by 500+ law firms
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {SECURITY_STATS.map((stat, idx) => (
                  <div
                    key={idx}
                    className="bg-muted/50 rounded-xl p-4 text-center"
                  >
                    <div className="font-serif text-2xl text-foreground">
                      {stat.value}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-20 px-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-4xl mx-auto text-center"
      >
        <div className="gradient-hero rounded-3xl p-12 md:p-16 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-10 right-10 w-64 h-64 bg-secondary/20 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10">
            <h2 className="font-serif text-3xl md:text-5xl text-primary-foreground mb-6">
              Ready to Transform Your
              <br />
              <span className="text-gradient-gold">Document Review?</span>
            </h2>
            <p className="text-lg text-primary-foreground/80 mb-8 max-w-xl mx-auto">
              Join hundreds of leading law firms and legal teams already using
              LegalMind.ai to save time and reduce risk.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/dashboard">
                <Button size="lg" variant="premium">
                  Start Free Trial
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
              <Link to="/login">
                <Button
                  size="lg"
                  variant="ghost"
                  className="text-primary-foreground hover:bg-primary-foreground/10"
                >
                  Schedule Demo
                </Button>
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-primary-foreground/70">
              {CTA_BENEFITS.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-secondary" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function Footer() {
  const footerLinks = [
    { href: "#", label: "Privacy" },
    { href: "#", label: "Terms" },
    { href: "#", label: "Security" },
    { href: "#", label: "Contact" },
  ];

  return (
    <footer className="py-12 px-6 border-t border-border">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <Logo size="small" />

          <div className="flex items-center gap-8 text-sm text-muted-foreground">
            {footerLinks.map(({ href, label }) => (
              <a
                key={label}
                href={href}
                className="hover:text-foreground transition-colors"
              >
                {label}
              </a>
            ))}
          </div>

          <p className="text-sm text-muted-foreground">
            © 2024 LegalMind.ai. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <HeroSection />
      <HowItWorksSection />
      <FeaturesSection />
      <SecuritySection />
      <CTASection />
      <Footer />
    </div>
  );
}
