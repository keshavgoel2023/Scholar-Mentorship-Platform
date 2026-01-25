import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Sparkles, MessageSquare, TrendingUp, Brain, Target, Zap } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "Smart Mentor Matching",
    description: "AI analyzes your goals, skills, and preferences to recommend the perfect mentors for your journey.",
    gradient: "from-purple-500 to-pink-500"
  },
  {
    icon: MessageSquare,
    title: "AI Career Chatbot",
    description: "Get instant career guidance, resume tips, and personalized advice from our intelligent assistant.",
    gradient: "from-blue-500 to-cyan-500"
  },
  {
    icon: TrendingUp,
    title: "Session Insights",
    description: "Automatic summaries, action items, and progress tracking powered by advanced AI analysis.",
    gradient: "from-green-500 to-emerald-500"
  },
  {
    icon: Target,
    title: "Career Roadmap",
    description: "Get a personalized learning path with milestones, resources, and mentor recommendations.",
    gradient: "from-orange-500 to-red-500"
  },
  {
    icon: Zap,
    title: "Smart Scheduling",
    description: "AI optimizes meeting times across time zones and suggests the best slots for deep work.",
    gradient: "from-violet-500 to-purple-500"
  },
  {
    icon: Sparkles,
    title: "Skill Gap Analysis",
    description: "Identify what you need to learn and get matched with mentors who can fill those gaps.",
    gradient: "from-yellow-500 to-orange-500"
  }
];

export const AIFeatures = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-hero opacity-10" />
      
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-primary/10 border border-primary/20 mb-6">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm text-primary font-medium">Powered by Advanced AI</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold mb-4">
            Intelligence That{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Works For You
            </span>
          </h2>
          <p className="text-xl text-foreground/70 max-w-3xl mx-auto">
            Our AI platform doesn't just connect you with mentors—it actively helps you grow faster with personalized insights and recommendations
          </p>
        </motion.div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-6 bg-gradient-card backdrop-blur-sm border-border/40 hover:border-primary/40 transition-all hover:shadow-glow-primary h-full group">
                <div className={`h-14 w-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                  <feature.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-foreground/70 leading-relaxed">{feature.description}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
