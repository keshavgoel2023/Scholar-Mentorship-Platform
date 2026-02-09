import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { Search, Star, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";


const categories = ["All", "Design", "Engineering", "Product", "Marketing", "Leadership", "Data Science"];

const Mentors = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [mentors, setMentors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMentors = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'mentor');

      if (!error && data) {
        setMentors(data);
      }
      setLoading(false);
    };

    fetchMentors();
  }, []);

  const filteredMentors = mentors.filter(mentor => {
    const matchesSearch = 
      mentor.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mentor.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mentor.bio?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mentor.skills?.some((skill: string) => skill.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === "All" || 
      mentor.skills?.some((skill: string) => 
        skill.toLowerCase().includes(selectedCategory.toLowerCase())
      );
    
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-20 flex items-center justify-center">
        <p className="text-muted-foreground">Loading mentors...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="container mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl lg:text-5xl font-bold mb-4">
            Find Your Perfect{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Mentor
            </span>
          </h1>
          <p className="text-xl text-foreground/70 mb-8">
            Connect with expert mentors across industries
          </p>

          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground/40" />
              <Input
                placeholder="Search by skill, role, or company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 text-lg bg-background/50 backdrop-blur-sm border-primary/20 focus:border-primary/40"
              />
            </div>
          </div>
        </motion.div>

          <div className="flex flex-wrap gap-2 mb-6">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === category
                    ? "bg-primary text-primary-foreground"
                    : "bg-background/50 text-foreground/70 hover:bg-primary/10 border border-border/40"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="mb-6 text-foreground/60">
            Showing {filteredMentors.length} mentor{filteredMentors.length !== 1 ? 's' : ''}
          </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMentors.map((mentor, index) => (
            <motion.div
              key={mentor.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * index }}
            >
              <Link to={`/mentors/${mentor.id}`}>
                <Card className="overflow-hidden bg-gradient-card backdrop-blur-sm border-border/40 hover:border-primary/40 transition-all hover:shadow-glow-primary group cursor-pointer h-full">
                  <div className="relative overflow-hidden">
                    <div className="aspect-[4/3] overflow-hidden relative flex items-center justify-center">
                      <Avatar className="w-full h-full rounded-none group-hover:scale-110 transition-transform duration-500">
                        <AvatarFallback className="rounded-none text-4xl bg-primary/10">
                          {mentor.full_name?.split(' ').map((n: string) => n[0]).join('') || 'M'}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold mb-1 group-hover:text-primary transition-colors">
                          {mentor.full_name}
                        </h3>
                        <p className="text-sm text-foreground/70">{mentor.role}</p>
                      </div>
                      <span className="text-lg font-bold text-primary whitespace-nowrap ml-2">
                        ₹{mentor.hourly_rate || 2000}/hr
                      </span>
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

        {filteredMentors.length === 0 && (
          <div className="text-center py-12">
            <p className="text-xl text-foreground/60">
              No mentors found matching your criteria.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Mentors;