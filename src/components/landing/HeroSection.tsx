import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import heroImage from "@/assets/hero-workspace.jpg";

export const HeroSection = () => {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden min-h-screen flex items-center">
      <div className="absolute inset-0 bg-gradient-hero opacity-20" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(var(--primary)/0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,hsl(var(--secondary)/0.15),transparent_50%)]" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-primary/10 border border-primary/20 mb-6 backdrop-blur-sm"
            >
              <Sparkles className="h-4 w-4 text-primary animate-pulse" />
              <span className="text-sm text-primary font-medium">Mentorship Platform</span>
            </motion.div>
            
            <h1 className="text-5xl lg:text-7xl font-bold mb-6 leading-tight">
              Transform Your Career with{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Guided Mentorship
              </span>
            </h1>
            
            <p className="text-xl text-foreground/70 mb-8 leading-relaxed max-w-xl">
              Connect with world-class mentors, get recommendations, 
              and accelerate your growth with intelligent scheduling and insights.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <Link to="/auth/signup">
                <Button 
                  size="lg" 
                  className="bg-gradient-primary hover:opacity-90 text-lg px-8 shadow-glow-primary animate-float"
                >
                  Start Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/mentors">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="text-lg px-8 bg-background/50 backdrop-blur-sm border-primary/20 hover:border-primary/40"
                >
                  Browse Mentors
                </Button>
              </Link>
            </div>
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex items-center gap-8 mt-12"
            >
              <div>
                <div className="text-3xl font-bold text-primary"></div>
                <div className="text-sm text-foreground/60">Expert Mentors</div>
              </div>
              <div className="h-12 w-px bg-border" />
              <div>
                <div className="text-3xl font-bold text-primary"></div>
                <div className="text-sm text-foreground/60">Crazy Sessions</div>
              </div>
              <div className="h-12 w-px bg-border" />
              <div>
                <div className="text-3xl font-bold text-primary"></div>
                <div className="text-sm text-foreground/60">Acheivements unlocked!</div>
              </div>
            </motion.div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, x: 50 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-primary opacity-20 blur-3xl animate-pulse" />
            <div className="relative">
              <img
                src={heroImage}
                alt="AI-Powered Mentorship Platform"
                className="rounded-2xl shadow-glass w-full relative z-10"
              />
              <div className="absolute -bottom-6 -right-6 bg-gradient-card backdrop-blur-xl border border-primary/20 rounded-xl p-6 shadow-glow-primary">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-primary flex items-center justify-center">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="text-sm text-foreground/60">AI Match Score</div>
                    <div className="text-2xl font-bold text-primary">98%</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
