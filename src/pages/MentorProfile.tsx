import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  Star,
  MapPin,
  Clock,
  Briefcase,
  Calendar,
  MessageCircle,
} from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";


const MentorProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [mentor, setMentor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMentor = async () => {
      if (!id) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .eq('role', 'mentor')
        .single();

      if (error) {
        console.error('Error fetching mentor:', error);
        setLoading(false);
        return;
      }

      setMentor(data);
      setLoading(false);
    };

    fetchMentor();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading mentor profile...</p>
      </div>
    );
  }

  if (!mentor) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Mentor not found</h2>
          <Button onClick={() => navigate('/mentors')}>Browse All Mentors</Button>
        </div>
      </div>
    );
  }

  const initials = mentor.full_name.split(' ').map((n: string) => n[0]).join('');
  const mentorRate = mentor.hourly_rate || 2000;

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="container mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="p-8 bg-gradient-card backdrop-blur-sm border-border/40">
            <div className="grid md:grid-cols-[300px_1fr] gap-8">
              <div>
                <div className="mb-4 flex justify-center">
                  <Avatar className="w-full aspect-square rounded-2xl max-w-[300px]">
                    <AvatarFallback className="rounded-2xl text-6xl bg-primary/10">{initials}</AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-primary/10 border border-primary/20">
                    <Star className="h-4 w-4 fill-primary text-primary" />
                    <span className="font-semibold">4.9</span>
                  </div>
                  <span className="text-sm text-foreground/60">
                    (100+ reviews)
                  </span>
                </div>
                <div className="space-y-3 text-sm text-foreground/70">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Responds within 2 hours</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    <span>100+ sessions completed</span>
                  </div>
                </div>
              </div>

              <div>
                <h1 className="text-4xl font-bold mb-2">{mentor.full_name}</h1>
                <p className="text-xl text-foreground/70 mb-6">{mentor.role}</p>
                
                <p className="text-foreground/80 mb-6 leading-relaxed">
                  {mentor.bio || "Experienced professional passionate about mentoring and helping others grow."}
                </p>

                <div className="flex flex-wrap gap-2 mb-6">
                  {mentor.skills?.map((skill: string, i: number) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className="bg-primary/5 border-primary/20"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center gap-4 pt-6 border-t border-border/40">
                  <div className="flex items-center gap-2">
                    <div>
                      <div className="text-2xl font-bold text-primary">₹{mentorRate}</div>
                      <div className="text-sm text-foreground/60">per hour</div>
                    </div>
                  </div>
                  <div className="flex-1" />
                  <Link to={`/book-session/${id}`}>
                    <Button size="lg" className="bg-gradient-primary hover:opacity-90 gap-2">
                      <Calendar className="h-5 w-5" />
                      Book Session
                    </Button>
                  </Link>
                  <Link to={`/messages/${id}`}>
                    <Button size="lg" variant="outline" className="gap-2">
                      <MessageCircle className="h-5 w-5" />
                      Message
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default MentorProfile;