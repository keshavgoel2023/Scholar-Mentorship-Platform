import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { ArrowLeft, Star } from "lucide-react";

interface Session {
  id: string;
  topic: string;
  scheduled_at: string;
  mentor: {
    id: string;
    full_name: string;
  };
  mentee: {
    id: string;
    full_name: string;
  };
}

const RateSession = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [session, setSession] = useState<Session | null>(null);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userRole, setUserRole] = useState<'mentor' | 'mentee'>('mentee');

  useEffect(() => {
    loadSession();
  }, [id]);

  const loadSession = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth/login");
      return;
    }

    const { data, error } = await supabase
      .from("sessions")
      .select(`
        *,
        mentor:profiles!sessions_mentor_id_fkey(id, full_name),
        mentee:profiles!sessions_mentee_id_fkey(id, full_name)
      `)
      .eq("id", id)
      .eq("status", "completed")
      .single();

    if (error || !data) {
      toast({
        title: "Error",
        description: "Session not found or not completed yet",
        variant: "destructive",
      });
      navigate("/dashboard");
      return;
    }

    // Determine if user is mentor or mentee
    const isMentor = data.mentor_id === user.id;
    setUserRole(isMentor ? 'mentor' : 'mentee');
    setSession(data as any);
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a rating before submitting",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !session) return;

    const { data: { session: authSession } } = await supabase.auth.getSession();

    const { error } = await supabase.functions.invoke('submit-feedback', {
      body: {
        sessionId: session.id,
        rating,
        comment,
      },
      headers: authSession?.access_token ? { 
        Authorization: `Bearer ${authSession.access_token}` 
      } : {},
    });

    setSubmitting(false);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Feedback Submitted",
      description: "Thank you for your feedback!",
    });

    navigate("/dashboard");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <p className="text-muted-foreground">Loading session...</p>
      </div>
    );
  }

  if (!session) return null;

  const ratedPerson = userRole === 'mentee' ? session.mentor : session.mentee;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-6 py-20">
        <Button
          variant="ghost"
          className="mb-8"
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto"
        >
          <div className="mb-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
              Rate Your Session
            </h1>
            <p className="text-muted-foreground text-lg">
              Share your experience with {ratedPerson.full_name}
            </p>
          </div>

          <Card className="p-8">
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Session Topic</p>
                <h2 className="text-xl font-semibold mb-4">{session.topic}</h2>
                <p className="text-sm text-muted-foreground">
                  {new Date(session.scheduled_at).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit'
                  })}
                </p>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium">
                  How would you rate this session?
                </label>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`h-12 w-12 ${
                          star <= (hoveredRating || rating)
                            ? 'fill-primary text-primary'
                            : 'text-muted-foreground'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <p className="text-center text-sm text-muted-foreground">
                    {rating === 1 && "Poor"}
                    {rating === 2 && "Fair"}
                    {rating === 3 && "Good"}
                    {rating === 4 && "Very Good"}
                    {rating === 5 && "Excellent"}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Additional Comments (Optional)
                </label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your thoughts about the session..."
                  rows={5}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || rating === 0}
                  className="flex-1 bg-gradient-primary hover:opacity-90"
                  size="lg"
                >
                  {submitting ? "Submitting..." : "Submit Feedback"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/dashboard")}
                  size="lg"
                >
                  Skip
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default RateSession;
