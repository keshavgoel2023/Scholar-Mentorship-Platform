import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Star, Quote } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const testimonials = [
  {
    name: "Rohan Aggarwal",
    role: "Software Engineer at Google",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rohan",
    rating: 5,
    text: "Scholar's AI matching connected me with a mentor who completely transformed my career trajectory. Within 6 months, I landed my dream job at Google!",
    highlight: "Landed dream job in 6 months"
  },
  {
    name: "Rahul Mor",
    role: "Product Manager at Meta",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul",
    rating: 5,
    text: "The personalized guidance and AI-powered insights helped me transition from engineering to product management seamlessly. Best investment in my career.",
    highlight: "Successful career transition"
  },
  {
    name: "Rakesh Arora",
    role: "UX Designer at Apple",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rakesh",
    rating: 5,
    text: "I've tried other platforms, but Scholar's AI recommendations and quality of mentors are unmatched. The session summaries alone are worth it!",
    highlight: "10x better than alternatives"
  }
];


export const Testimonials = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-primary opacity-5" />
      
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-5xl font-bold mb-4">
            Success Stories from{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">Our Community</span>
          </h2>
          <p className="text-xl text-foreground/70">
            Real results from real professionals who transformed their careers
          </p>
        </motion.div>
        
        <div className="max-w-4xl mx-auto">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="p-8 lg:p-12 bg-gradient-card backdrop-blur-sm border-border/40 relative">
              <Quote className="absolute top-8 right-8 h-16 w-16 text-primary/20" />
              
              <div className="flex items-center gap-4 mb-6">
                <Avatar className="h-16 w-16 border-2 border-primary">
                  <AvatarImage src={testimonials[currentIndex].avatar} />
                  <AvatarFallback>{testimonials[currentIndex].name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="text-xl font-semibold">{testimonials[currentIndex].name}</h4>
                  <p className="text-foreground/70">{testimonials[currentIndex].role}</p>
                </div>
              </div>
              
              <div className="flex gap-1 mb-6">
                {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                ))}
              </div>
              
              <p className="text-lg text-foreground/80 mb-6 leading-relaxed">
                "{testimonials[currentIndex].text}"
              </p>
              
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                <span className="text-sm text-primary font-medium">
                  {testimonials[currentIndex].highlight}
                </span>
              </div>
            </Card>
          </motion.div>
          
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, index) => (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                onClick={() => setCurrentIndex(index)}
                className={`h-2 w-8 rounded-full p-0 ${
                  index === currentIndex ? "bg-primary" : "bg-border"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
