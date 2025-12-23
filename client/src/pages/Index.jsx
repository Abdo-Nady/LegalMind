import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, FileSearch, MessageSquare, Zap, ArrowRight, CheckCircle, FileText, Brain, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
export default function Index() {
    return (<div className="min-h-screen bg-background">
      {/* Navigation */}
      <motion.nav initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-secondary to-secondary/70 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary"/>
            </div>
            <span className="font-serif text-xl text-foreground">LegalMind.ai</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </a>
            <a href="#security" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Security
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link to="/login">
              <Button variant="premium">
                Get Started
                <ArrowRight className="h-4 w-4 ml-1"/>
              </Button>
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-40 left-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl"/>
          <div className="absolute top-60 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl"/>
        </div>

        <div className="max-w-7xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Badge variant="premium" className="mb-6">
              Trusted by 500+ Law Firms
            </Badge>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="font-serif text-5xl md:text-7xl text-foreground mb-6 leading-tight">
            Legal Documents,
            <br />
            <span className="text-gradient-gold">Intelligently Analyzed</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Transform contract review with AI-powered risk detection, instant
            clause analysis, and intelligent document chat. Save hours on every
            deal.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/dashboard">
              <Button size="xl" variant="hero">
                Start Analyzing Free
                <ArrowRight className="h-5 w-5 ml-2"/>
              </Button>
            </Link>
            <Link to="/login">
              <Button size="xl" variant="hero-outline">
                Watch Demo
              </Button>
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
            {[
            { value: "10K+", label: "Documents Analyzed" },
            { value: "85%", label: "Time Saved" },
            { value: "99.9%", label: "Accuracy Rate" },
            { value: "500+", label: "Law Firms" },
        ].map((stat, idx) => (<div key={idx} className="text-center">
                <div className="font-serif text-3xl text-foreground mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
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
            {[
            {
                icon: FileSearch,
                title: "Instant Risk Detection",
                description: "AI automatically identifies high-risk clauses, unusual terms, and potential issues the moment you upload a document.",
            },
            {
                icon: MessageSquare,
                title: "Intelligent Document Chat",
                description: "Ask questions about your contracts in plain English. Get answers with precise citations and page references.",
            },
            {
                icon: Brain,
                title: "Smart Clause Analysis",
                description: "Compare clauses against industry standards. Get recommendations for stronger language and better protections.",
            },
            {
                icon: FileText,
                title: "Automated Summaries",
                description: "Generate executive summaries highlighting key terms, obligations, and important dates automatically.",
            },
            {
                icon: Lock,
                title: "Enterprise Security",
                description: "SOC 2 Type II certified. Bank-grade encryption. Your documents never leave your control.",
            },
            {
                icon: Zap,
                title: "Lightning Fast",
                description: "Analyze a 50-page contract in under 30 seconds. Process hundreds of documents in parallel.",
            },
        ].map((feature, idx) => (<motion.div key={idx} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }} className="bg-card rounded-xl border border-border p-6 hover:shadow-premium-hover hover:-translate-y-1 transition-all duration-300">
                <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-accent"/>
                </div>
                <h3 className="font-serif text-xl text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-4xl mx-auto text-center">
          <div className="gradient-hero rounded-3xl p-12 md:p-16 relative overflow-hidden">
            <div className="absolute inset-0">
              <div className="absolute top-10 right-10 w-64 h-64 bg-secondary/20 rounded-full blur-3xl"/>
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
                    <ArrowRight className="h-4 w-4 ml-2"/>
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10">
                    Schedule Demo
                  </Button>
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-primary-foreground/70">
                {[
            "No credit card required",
            "14-day free trial",
            "Cancel anytime",
        ].map((item, idx) => (<div key={idx} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-secondary"/>
                    <span>{item}</span>
                  </div>))}
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-secondary to-secondary/70 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary"/>
              </div>
              <span className="font-serif text-lg text-foreground">LegalMind.ai</span>
            </div>

            <div className="flex items-center gap-8 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Terms
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Security
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Contact
              </a>
            </div>

            <p className="text-sm text-muted-foreground">
              © 2024 LegalMind.ai. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>);
}
