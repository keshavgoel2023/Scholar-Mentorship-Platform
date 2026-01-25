import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Zap, Crown } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export const PricingSection = () => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSelectPlan = (planName: string) => {
    setSelectedPlan(planName);
    toast({
      title: "Plan Selected",
      description: `You've selected the ${planName} plan. Redirecting to sign up...`,
    });
    setTimeout(() => {
      window.location.href = `/auth/signup?plan=${planName.toLowerCase()}`;
    }, 1500);
  };

  const plans = [
    {
      name: "Free",
      icon: Sparkles,
      price: "$0",
      period: "forever",
      description: "Perfect for getting started",
      features: [
        "1 mentor connection",
        "Basic AI recommendations",
        "30-min sessions",
        "Community access",
        "Email support"
      ],
      cta: "Get Started",
      popular: false
    },
    {
      name: "Pro",
      icon: Zap,
      price: "$29",
      period: "per month",
      description: "Most popular for serious learners",
      features: [
        "Unlimited mentor connections",
        "Advanced AI matching",
        "Unlimited session length",
        "Priority support",
        "Session recordings",
        "Career roadmap generator",
        "AI chatbot access"
      ],
      cta: "Start Free Trial",
      popular: true
    },
    {
      name: "Enterprise",
      icon: Crown,
      price: "Custom",
      period: "contact us",
      description: "For teams and organizations",
      features: [
        "Everything in Pro",
        "Team management",
        "Analytics dashboard",
        "Custom AI training",
        "Dedicated account manager",
        "SLA guarantee",
        "Custom integrations"
      ],
      cta: "Contact Sales",
      popular: false
    }
  ];

  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-5xl font-bold mb-4">
            Simple, Transparent{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">Pricing</span>
          </h2>
          <p className="text-xl text-foreground/70">
            Choose the plan that fits your goals. No hidden fees.
          </p>
        </motion.div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <span className="px-4 py-1 rounded-full bg-gradient-primary text-white text-sm font-medium shadow-glow-primary">
                    Most Popular
                  </span>
                </div>
              )}
              
              <Card className={`p-8 h-full flex flex-col bg-gradient-card backdrop-blur-sm transition-all ${
                plan.popular 
                  ? "border-primary/60 shadow-glow-primary scale-105" 
                  : "border-border/40 hover:border-primary/40"
              }`}>
                <div className={`h-14 w-14 rounded-xl bg-gradient-to-br ${
                  plan.popular 
                    ? "from-purple-500 to-blue-500" 
                    : "from-gray-600 to-gray-700"
                } flex items-center justify-center mb-6`}>
                  <plan.icon className="h-7 w-7 text-white" />
                </div>
                
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-foreground/70 mb-6">{plan.description}</p>
                
                <div className="mb-6">
                  <span className="text-5xl font-bold">{plan.price}</span>
                  <span className="text-foreground/60 ml-2">/ {plan.period}</span>
                </div>
                
                <ul className="space-y-4 mb-8 flex-grow">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-foreground/80">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  onClick={() => handleSelectPlan(plan.name)}
                  className={`w-full ${
                    plan.popular 
                      ? "bg-gradient-primary hover:opacity-90" 
                      : "bg-background hover:bg-primary/10"
                  } ${selectedPlan === plan.name ? "ring-2 ring-primary" : ""}`}
                  size="lg"
                >
                  {plan.cta}
                </Button>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
