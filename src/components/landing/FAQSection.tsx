import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "How does AI mentor matching work?",
    answer: "Our AI analyzes your profile, goals, skills, and preferences to recommend mentors who are the best fit for your specific needs. It considers factors like expertise, communication style, availability, and past success rates with similar mentees."
  },
  {
    question: "Can I try Scholar for free?",
    answer: "Yes! Our Free plan includes 1 mentor connection and basic AI features. You can upgrade to Pro anytime for unlimited access to all features and mentors."
  },
  {
    question: "How do sessions work?",
    answer: "After booking a session with your mentor, you'll receive a calendar invite with a video call link. Sessions can be recorded (with permission), and our AI automatically generates summaries and action items after each meeting."
  },
  {
    question: "What if I'm not satisfied with my mentor?",
    answer: "You can connect with unlimited mentors on our Pro plan. If a match isn't working out, simply explore other mentors and book a session with someone new. Our AI learns from your preferences to improve future recommendations."
  },
  {
    question: "How does the AI chatbot help?",
    answer: "Our AI chatbot provides instant career guidance, helps you prepare questions for mentors, reviews your resume, and offers personalized learning recommendations based on your goals."
  },
  {
    question: "Is my data secure?",
    answer: "Absolutely. We use enterprise-grade encryption for all data, comply with GDPR and SOC 2 standards, and never share your personal information without explicit consent."
  }
];

export const FAQSection = () => {
  return (
    <section className="py-24 bg-card/30">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-5xl font-bold mb-4">
            Frequently Asked{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">Questions</span>
          </h2>
          <p className="text-xl text-foreground/70">
            Everything you need to know about Scholar
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="bg-gradient-card backdrop-blur-sm border border-border/40 rounded-lg px-6 hover:border-primary/40 transition-colors"
              >
                <AccordionTrigger className="text-left text-lg font-semibold hover:text-primary hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-foreground/70 leading-relaxed pt-2">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
};
