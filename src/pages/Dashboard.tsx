import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import {
  Calendar,
  MessageSquare,
  Star,
  TrendingUp,
  Clock,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  LogOut
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";

interface Profile {
  id: string;
  full_name: string;
  profile_completion: number;
  role?: string;
  is_mentor_profile_complete?: boolean;
  bio?: string;
  skills?: string[];
  hourly_rate?: number;
  years_of_experience?: number;
  avatar_url?: string;
}

interface Session {
  id: string;
  topic: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  mentor: Profile;
  mentee: Profile;
}

interface CompletedSession {
  id: string;
  topic: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  mentor_id: string;
  mentee_id: string;
  mentor: Profile;
  mentee: Profile;
  feedback_given?: boolean;
}

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender: Profile;
}

const Dashboard = () => {

  const [profile, setProfile] = useState<Profile | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [completedSessions, setCompletedSessions] = useState<CompletedSession[]>([]);
  const [recentMessages, setRecentMessages] = useState<Message[]>([]);
  const [backendStats, setBackendStats] = useState<any>(null);

  const [stats, setStats] = useState({
    sessionsThisMonth: 0,
    hoursLearned: 0,
    activeMentors: 0
  });

  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: roles } = useUserRole(profile?.id);

  useEffect(() => {

    checkUser();

    const { data: { subscription } } =
      supabase.auth.onAuthStateChange((event, session) => {

        if (event === "SIGNED_OUT" || !session) {
          navigate("/auth");
        }

      });

    return () => subscription.unsubscribe();

  }, [navigate]);

  useEffect(() => {

    if (
      profile &&
      profile.role === "mentor" &&
      !profile.is_mentor_profile_complete
    ) {
      navigate("/complete-mentor-profile");
    }

  }, [profile]);

  const checkUser = async () => {

    const { data: { user } } =
      await supabase.auth.getUser();

    if (!user) {
      navigate("/auth");
      return;
    }

    await loadDashboardData(user.id);

  };

  const loadDashboardData = async (userId: string) => {

    try {

      const { data: profileData } =
        await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();

      if (profileData) setProfile(profileData);

      const { data: statsData, error: statsError } =
        await supabase.functions.invoke("get-dashboard-stats");

      if (!statsError && statsData) {
        setBackendStats(statsData);
      }

      const { data: sessionsData } =
        await supabase
          .from("sessions")
          .select(`
            *,
            mentor:profiles!sessions_mentor_id_fkey(id, full_name, avatar_url),
            mentee:profiles!sessions_mentee_id_fkey(id, full_name, avatar_url)
          `)
          .or(`mentee_id.eq.${userId},mentor_id.eq.${userId}`)
          .eq("status", "scheduled")
          .gte("scheduled_at", new Date().toISOString())
          .order("scheduled_at", { ascending: true })
          .limit(5);

      if (sessionsData) setSessions(sessionsData as any);

      const { data: completedData } =
        await supabase
          .from("sessions")
          .select(`
            *,
            mentor:profiles!sessions_mentor_id_fkey(id, full_name, avatar_url),
            mentee:profiles!sessions_mentee_id_fkey(id, full_name, avatar_url)
          `)
          .or(`mentee_id.eq.${userId},mentor_id.eq.${userId}`)
          .eq("status", "completed")
          .order("scheduled_at", { ascending: false })
          .limit(5);

      if (completedData) {

        const sessionsWithFeedback =
          await Promise.all(

            completedData.map(async (session: any) => {

              const { data: feedbackData } =
                await supabase
                  .from("session_feedback")
                  .select("id")
                  .eq("session_id", session.id)
                  .eq("reviewer_id", userId)
                  .single();

              return {
                ...session,
                feedback_given: !!feedbackData
              };

            })

          );

        setCompletedSessions(sessionsWithFeedback as any);

      }

      const { data: messagesData } =
        await supabase
          .from("messages")
          .select(`
            *,
            sender:sender_id(id, full_name, avatar_url)
          `)
          .eq("receiver_id", userId)
          .order("created_at", { ascending: false })
          .limit(3);

      if (messagesData) setRecentMessages(messagesData as any);

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: sessionCount } =
        await supabase
          .from("sessions")
          .select("*", { count: "exact", head: true })
          .eq("mentee_id", userId)
          .in("status", ["scheduled", "confirmed", "completed"])
          .gte("created_at", startOfMonth.toISOString());

      const { data: completedSessionsData } =
        await supabase
          .from("sessions")
          .select("duration_minutes")
          .eq("mentee_id", userId)
          .eq("status", "completed");

      const totalHours =
        completedSessionsData?.reduce(
          (sum, s) => sum + s.duration_minutes,
          0
        ) || 0;

      const { data: mentors } =
        await supabase
          .from("sessions")
          .select("mentor_id")
          .eq("mentee_id", userId)
          .in("status", ["scheduled", "confirmed", "completed"]);

      const uniqueMentors =
        new Set(mentors?.map(m => m.mentor_id));

      setStats({
        sessionsThisMonth: sessionCount || 0,
        hoursLearned: Math.round((totalHours / 60) * 10) / 10,
        activeMentors: uniqueMentors.size
      });

    }
    catch (error) {

      console.error("Dashboard load error:", error);

      toast({
        title: "Error",
        description: "Failed to load dashboard",
        variant: "destructive"
      });

    }
    finally {
      setLoading(false);
    }

  };

  const handleJoinSession = async (sessionToJoin: any) => {

    try {

      const meetingUrl =
        `https://meet.jit.si/scholar-${sessionToJoin.id}`;

      const { error } =
        await supabase.functions.invoke("manage-session", {
          body: {
            action: "update-status",
            sessionId: sessionToJoin.id,
            status: "confirmed",
            meetingUrl
          }
        });

      if (error) throw error;

      toast({
        title: "Session confirmed",
        description: "Meeting link sent to both participants via email."
      });

      window.open(meetingUrl, "_blank");

      if (profile?.id)
        await loadDashboardData(profile.id);

    }
    catch (e: any) {

      console.error("Join error:", e);

      toast({
        title: "Could not join",
        description: e.message || "Please try again.",
        variant: "destructive"
      });

    }

  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Sparkles className="h-10 w-10 animate-pulse" />
      </div>
    );
  }

  return (

    <div className="min-h-screen bg-background">

      <div className="container mx-auto px-6 py-8">

        <div className="flex justify-between mb-8">

          <h1 className="text-3xl font-bold">
            Welcome back {profile?.full_name}
          </h1>

          <Button onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>

        </div>

        {/* Sessions */}

        <Card className="p-6">

          <h2 className="text-xl font-semibold mb-4">
            Upcoming Sessions
          </h2>

          {sessions.map(session => (

            <div
              key={session.id}
              className="flex justify-between p-4 border rounded mb-4"
            >

              <div>

                <h3 className="font-semibold">
                  {session.topic}
                </h3>

                <p className="text-sm text-muted-foreground">
                  {new Date(session.scheduled_at).toLocaleString()}
                </p>

              </div>

              <Button
                onClick={() => handleJoinSession(session)}
              >
                Join
              </Button>

            </div>

          ))}

        </Card>

      </div>

    </div>

  );

};

export default Dashboard;
