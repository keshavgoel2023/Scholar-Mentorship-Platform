import { motion } from "framer-motion";
import { UserPlus, Sparkles, Calendar, Rocket } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    title: "Create Your Profile",
    description: "Sign up in seconds and tell us about your goals and interests."
  },
  {
    icon: Sparkles,
    title: "AI Matches You",
    description: "Our smart algorithm finds the perfect mentors for your needs."
  },
  {
    icon: Calendar,
    title: "Book Sessions",
    description: "Choose a time that works and connect via video or chat."
  },
  {
    icon: Rocket,
    title: "Achieve Your Goals",
    description: "Learn, grow, and track your progress with AI-powered insights."
  }
];

export const HowItWorks = () => {
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
            How{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">Scholar</span>
            {" "}Works
          </h2>
          <p className="text-xl text-foreground/70 max-w-2xl mx-auto">
            Get started in minutes with our simple, AI-powered process
          </p>
        </motion.div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {/* Connection line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-primary opacity-20 -translate-y-1/2" />
          
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className="relative"
            >
              <div className="bg-gradient-card backdrop-blur-sm border border-border/40 rounded-2xl p-8 hover:border-primary/40 transition-all hover:shadow-glow-primary h-full group">
                <div className="h-16 w-16 rounded-2xl bg-gradient-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <step.icon className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -top-4 -right-4 h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-lg shadow-glow-primary">
                  {index + 1}
                </div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-foreground/70">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
