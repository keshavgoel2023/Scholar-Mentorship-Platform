import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Search, Star, TrendingUp, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";


const categories = ["All", "Design", "Engineering", "Product", "Marketing", "Leadership", "Data Science"];

export const MentorDiscovery = () => {
  const [mentors, setMentors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMentors = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'mentor')
        .limit(3);

      if (!error && data) {
        setMentors(data);
      }
      setLoading(false);
    };

    fetchMentors();
  }, []);

  if (loading) {
    return <div className="py-24 text-center">Loading mentors...</div>;
  }
  return (
    <section className="py-24 bg-card/30">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl lg:text-5xl font-bold mb-4">
            Find Your Perfect{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">Mentor</span>
          </h2>
          <p className="text-xl text-foreground/70 mb-8">
            Browse thousands of expert mentors across industries
          </p>
          
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground/40" />
              <Input 
                placeholder="Search by skill, role, or company..." 
                className="pl-12 h-14 text-lg bg-background/50 backdrop-blur-sm border-primary/20 focus:border-primary/40"
              />
            </div>
          </div>
          
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {categories.map((category, index) => (
              <Badge
                key={index}
                variant={index === 0 ? "default" : "outline"}
                className={`px-4 py-2 cursor-pointer transition-all hover:scale-105 ${
                  index === 0 
                    ? "bg-gradient-primary text-white" 
                    : "border-primary/20 hover:border-primary/40 hover:bg-primary/10"
                }`}
              >
                {category}
              </Badge>
            ))}
          </div>
        </motion.div>
        
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {mentors.map((mentor) => (
            <motion.div
              key={mentor.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (mentor.id - 1) * 0.1 }}
            >
              <Link to={`/mentors/${mentor.id}`}>
                <Card className="overflow-hidden bg-gradient-card backdrop-blur-sm border-border/40 hover:border-primary/40 transition-all hover:shadow-glow-primary group cursor-pointer h-full">
                  <div className="relative overflow-hidden">
                    <div className="aspect-[4/3] overflow-hidden relative flex items-center justify-center">
                      {mentor.trending && (
                        <div className="absolute top-4 left-4 z-10 flex items-center gap-1 px-3 py-1.5 rounded-full bg-gradient-primary text-white text-xs font-medium shadow-lg backdrop-blur-sm">
                          <TrendingUp className="h-3.5 w-3.5" />
                          Trending
                        </div>
                      )}
                       <Avatar className="w-full h-full rounded-none group-hover:scale-110 transition-transform duration-500">
                        <AvatarFallback className="rounded-none text-4xl bg-primary/10">{mentor.full_name?.split(' ').map((n: string) => n[0]).join('') || 'M'}</AvatarFallback>
                      </Avatar>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold mb-1 group-hover:text-primary transition-colors">{mentor.full_name}</h3>
                        <p className="text-sm text-foreground/70">{mentor.role}</p>
                      </div>
                      <span className="text-lg font-bold text-primary whitespace-nowrap ml-2">₹{mentor.hourly_rate || 2000}/hr</span>
                    </div>
                    <div className="flex items-center gap-1 mb-4">
                      <Star className="h-4 w-4 fill-primary text-primary" />
                      <span className="font-semibold text-sm">4.9</span>
                      <span className="text-xs text-foreground/60">(100+ sessions)</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {mentor.skills?.slice(0, 3).map((skill: string, i: number) => (
                        <span
                          key={i}
                          className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                    <Button className="w-full bg-gradient-primary hover:opacity-90 text-sm">
                      View Profile
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
        
        <div className="text-center">
          <Link to="/mentors">
            <Button size="lg" variant="outline" className="bg-background/50 backdrop-blur-sm border-primary/20 hover:border-primary/40">
              View All 2,500+ Mentors
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
