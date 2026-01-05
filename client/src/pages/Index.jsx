import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
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
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { useLanguage } from "@/contexts/LanguageContext";

// =============================================================================
// HOOKS
// =============================================================================

function useTypingAnimation(prompts, { isActive = true } = {}) {
  const [typingText, setTypingText] = useState("");
  const [promptIndex, setPromptIndex] = useState(0);

  useEffect(() => {
    if (!isActive || !prompts.length) {
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

const EAGLE_COLOR = "#C09300";

function EgyptianFlag({ className = "w-8 h-5" }) {
  return (
    <svg
      viewBox="0 0 36 24"
      className={`${className} rounded-sm`}
      style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.2))" }}
      aria-label="Egyptian Flag"
    >
      <defs>
        <clipPath id="egyptFlagClip">
          <rect x="0" y="0" width="36" height="24" rx="2" ry="2" />
        </clipPath>
      </defs>
      <g clipPath="url(#egyptFlagClip)">
        {/* Flag stripes */}
        <rect y="0" width="36" height="8" fill="#CE1126" />
        <rect y="8" width="36" height="8" fill="#FFFFFF" />
        <rect y="16" width="36" height="8" fill="#000000" />
        {/* Eagle of Saladin */}
        <g transform="translate(18, 12)" fill={EAGLE_COLOR}>
          <ellipse cx="0" cy="0.5" rx="2.2" ry="2" />
          <circle cx="0" cy="-2" r="1.2" />
          <path d="M0,-1.8 L0.4,-1.2 L0,-1.5 L-0.4,-1.2 Z" />
          <path d="M-2,-0.5 Q-4.5,-1 -5,1 Q-4,0.5 -2.2,1 Z" />
          <path d="M2,-0.5 Q4.5,-1 5,1 Q4,0.5 2.2,1 Z" />
          <path d="M-1.5,2 L-2,4 L-0.8,3 L0,4.2 L0.8,3 L2,4 L1.5,2 Z" />
          <ellipse cx="0" cy="0.5" rx="1" ry="0.9" fill="#000" fillOpacity="0.3" />
        </g>
      </g>
      <rect
        x="0"
        y="0"
        width="36"
        height="24"
        rx="2"
        ry="2"
        fill="none"
        stroke="rgba(0,0,0,0.15)"
        strokeWidth="0.5"
      />
    </svg>
  );
}

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
  const { t } = useTranslation();
  const { isRTL } = useLanguage();

  const navLinks = [
    { href: "#features", label: t("nav.features") },
    { href: "#how-it-works", label: t("nav.howItWorks") },
    { href: "#security", label: t("nav.security") },
  ];

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 inset-x-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Logo />

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
            >
              {label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <LanguageSwitcher variant="ghost" />
          <Link to="/login">
            <Button variant="ghost">{t("common.signIn")}</Button>
          </Link>
          <Link to="/login">
            <Button variant="premium">
              {t("nav.getStarted")}
              <ArrowRight className={`h-4 w-4 ${isRTL ? "rotate-180 mr-1" : "ml-1"}`} />
            </Button>
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}

function PromptBox({ onSubmit, onUploadClick }) {
  const { t, i18n } = useTranslation();
  const { isRTL } = useLanguage();
  const [inputValue, setInputValue] = useState("");
  const [isInputFocused, setIsInputFocused] = useState(false);

  // Memoize prompts to prevent useTypingAnimation from resetting
  const typingPrompts = useMemo(() => [
    t("landing.typingPrompts.riskClauses"),
    t("landing.typingPrompts.obligations"),
    t("landing.typingPrompts.termination"),
    t("landing.typingPrompts.negotiation"),
    t("landing.typingPrompts.payment"),
    t("landing.typingPrompts.indemnification"),
  ], [i18n.language]);

  const trustIndicators = [
    { icon: Lock, text: t("landing.trustIndicators.security") },
    { icon: Zap, text: t("landing.trustIndicators.instant") },
    { icon: CheckCircle, text: t("landing.trustIndicators.certified") },
  ];

  const typingText = useTypingAnimation(typingPrompts, {
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
                      {t("landing.placeholder")}
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
                <Upload className="h-4 w-4 me-2" />
                {t("landing.uploadPdf")}
              </Button>
              <Button
                type="submit"
                variant="premium"
                size="sm"
                disabled={!inputValue.trim()}
                className="gap-2"
              >
                {t("nav.getStarted")}
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
        {trustIndicators.map(({ icon: Icon, text }, idx) => (
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
  const { t } = useTranslation();
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
          <Badge variant="premium" className="mb-6 gap-2.5 px-4 py-2">
            {t("landing.badge")}
            <EgyptianFlag />
          </Badge>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="font-serif text-4xl md:text-6xl lg:text-7xl text-foreground mb-6 leading-tight"
        >
          {t("landing.heroTitle1")}
          <br />
          <span className="text-gradient-gold">{t("landing.heroTitle2")}</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
        >
          {t("landing.heroSubtitle")}
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
  const { t } = useTranslation();
  const { isRTL } = useLanguage();

  const steps = [
    {
      step: t("landing.howItWorks.step1.number"),
      icon: Upload,
      title: t("landing.howItWorks.step1.title"),
      description: t("landing.howItWorks.step1.description"),
    },
    {
      step: t("landing.howItWorks.step2.number"),
      icon: Brain,
      title: t("landing.howItWorks.step2.title"),
      description: t("landing.howItWorks.step2.description"),
    },
    {
      step: t("landing.howItWorks.step3.number"),
      icon: MessageSquare,
      title: t("landing.howItWorks.step3.title"),
      description: t("landing.howItWorks.step3.description"),
    },
  ];

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
            {t("landing.howItWorks.badge")}
          </Badge>
          <h2 className="font-serif text-4xl text-foreground mb-4">
            {t("landing.howItWorks.title")}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t("landing.howItWorks.subtitle")}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((item, idx) => (
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
                <div className={`hidden md:flex absolute top-1/2 ${isRTL ? "-left-4" : "-right-4"} transform -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-background border border-border items-center justify-center`}>
                  <ArrowRight className={`h-4 w-4 text-secondary ${isRTL ? "rotate-180" : ""}`} />
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
  const { t } = useTranslation();

  const features = [
    {
      icon: FileSearch,
      title: t("landing.features.riskDetection.title"),
      description: t("landing.features.riskDetection.description"),
    },
    {
      icon: MessageSquare,
      title: t("landing.features.documentChat.title"),
      description: t("landing.features.documentChat.description"),
    },
    {
      icon: Brain,
      title: t("landing.features.clauseAnalysis.title"),
      description: t("landing.features.clauseAnalysis.description"),
    },
    {
      icon: FileText,
      title: t("landing.features.automatedSummaries.title"),
      description: t("landing.features.automatedSummaries.description"),
    },
    {
      icon: Lock,
      title: t("landing.features.enterpriseSecurity.title"),
      description: t("landing.features.enterpriseSecurity.description"),
    },
    {
      icon: Zap,
      title: t("landing.features.lightningFast.title"),
      description: t("landing.features.lightningFast.description"),
    },
  ];

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
            {t("landing.features.badge")}
          </Badge>
          <h2 className="font-serif text-4xl text-foreground mb-4">
            {t("landing.features.title")}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t("landing.features.subtitle")}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => (
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
  const { t } = useTranslation();

  const securityChecklist = [
    t("landing.security.checklist.soc2"),
    t("landing.security.checklist.encryption"),
    t("landing.security.checklist.deletion"),
    t("landing.security.checklist.noTraining"),
    t("landing.security.checklist.compliance"),
  ];

  const securityStats = [
    { value: "256-bit", label: t("landing.security.stats.encryption") },
    { value: "99.9%", label: t("landing.security.stats.uptime") },
    { value: "SOC 2", label: t("landing.security.stats.certified") },
    { value: "GDPR", label: t("landing.security.stats.compliant") },
  ];

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
              {t("landing.security.badge")}
            </Badge>
            <h2 className="font-serif text-4xl text-foreground mb-6">
              {t("landing.security.title")}
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              {t("landing.security.subtitle")}
            </p>
            <div className="space-y-4">
              {securityChecklist.map((item, idx) => (
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
                    {t("landing.security.bankGrade")}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t("landing.security.trustedBy")}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {securityStats.map((stat, idx) => (
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
  const { t } = useTranslation();
  const { isRTL } = useLanguage();

  const ctaBenefits = [
    t("landing.cta.benefits.noCard"),
    t("landing.cta.benefits.trial"),
    t("landing.cta.benefits.cancel"),
  ];

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
              {t("landing.cta.title1")}
              <br />
              <span className="text-gradient-gold">{t("landing.cta.title2")}</span>
            </h2>
            <p className="text-lg text-primary-foreground/80 mb-8 max-w-xl mx-auto">
              {t("landing.cta.subtitle")}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/dashboard">
                <Button size="lg" variant="premium">
                  {t("landing.cta.startTrial")}
                  <ArrowRight className={`h-4 w-4 ${isRTL ? "me-2 rotate-180" : "ms-2"}`} />
                </Button>
              </Link>
              <Link to="/login">
                <Button
                  size="lg"
                  variant="ghost"
                  className="text-primary-foreground hover:bg-primary-foreground/10"
                >
                  {t("landing.cta.scheduleDemo")}
                </Button>
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-primary-foreground/70">
              {ctaBenefits.map((item, idx) => (
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
  const { t } = useTranslation();

  const footerLinks = [
    { href: "#", label: t("landing.footer.privacy") },
    { href: "#", label: t("landing.footer.terms") },
    { href: "#", label: t("landing.footer.security") },
    { href: "#", label: t("landing.footer.contact") },
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
            © {t("landing.footer.copyright")}
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
