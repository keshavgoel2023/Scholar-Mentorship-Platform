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
  availability?: any;
}

interface DashboardStats {
  upcomingSessions: number;
  completedSessions: number;
  pendingSessions: number;
  totalSessions: number;
  averageRating: string;
  roles: string[];
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
  read: boolean;
}

const Dashboard = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [completedSessions, setCompletedSessions] = useState<CompletedSession[]>([]);
  const [recentMessages, setRecentMessages] = useState<Message[]>([]);
  const [backendStats, setBackendStats] = useState<DashboardStats | null>(null);
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

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    // Check if mentor needs to complete profile
    if (profile && profile.role === 'mentor' && !profile.is_mentor_profile_complete) {
      navigate('/complete-mentor-profile');
    }
  }, [profile, navigate]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate("/auth");
      return;
    }

    await loadDashboardData(user.id);
  };

  const loadDashboardData = async (userId: string) => {
    try {
      // Load profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (profileData) {
        // Calculate profile completion percentage with consistent criteria
        let completionPercentage = 0;

        if (profileData.role === 'mentor') {
          // If mentor marked complete, force 100%
          if (profileData.is_mentor_profile_complete) {
            completionPercentage = 100;
          } else {
            // Match fields from CompleteMentorProfile
            const mentorFields = ['bio', 'skills', 'years_of_experience', 'hourly_rate'];
            const filled = mentorFields.filter((field) => {
              const value = profileData[field];
              if (field === 'skills') return Array.isArray(value) && value.length > 0;
              return value !== null && value !== undefined && `${value}`.trim() !== '';
            });
            completionPercentage = Math.round((filled.length / mentorFields.length) * 100);
          }
        } else {
          // Mentee/General profile
          const fields = ['full_name', 'bio', 'skills', 'avatar_url'];
          const filled = fields.filter((field) => {
            const value = profileData[field];
            if (field === 'skills') return Array.isArray(value) && value.length > 0;
            return value !== null && value !== undefined && `${value}`.trim() !== '';
          });
          completionPercentage = Math.round((filled.length / fields.length) * 100);
        }
        
        // Update profile with calculated completion if different
        if (completionPercentage !== profileData.profile_completion) {
          await supabase
            .from("profiles")
            .update({ profile_completion: completionPercentage })
            .eq("id", userId);
          profileData.profile_completion = completionPercentage;
        }
        
        setProfile(profileData);
      }

      // Fetch dashboard stats from backend function
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: statsData, error: statsError } = await supabase.functions.invoke('get-dashboard-stats', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (!statsError && statsData) {
          setBackendStats(statsData);
        }
      }

      // Load upcoming sessions for both mentee and mentor views
      const { data: sessionsData } = await supabase
        .from("sessions")
        .select(`
          *,
          mentor:profiles!sessions_mentor_id_fkey(id, full_name, avatar_url),
          mentee:profiles!sessions_mentee_id_fkey(id, full_name, avatar_url)
        `)
        .or(`mentee_id.eq.${userId},mentor_id.eq.${userId}`)
        .in("status", ["scheduled", "confirmed"])
        .gte("scheduled_at", new Date().toISOString())
        .order("scheduled_at", { ascending: true })
        .limit(5);

      if (sessionsData) {
        setSessions(sessionsData as any);
      }

      // Load completed sessions for rating
      const { data: completedData } = await supabase
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
        // Check which sessions have feedback from current user
        const sessionsWithFeedback = await Promise.all(
          completedData.map(async (session: any) => {
            const { data: feedbackData } = await supabase
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

      // Load recent messages
      const { data: messagesData } = await supabase
        .from("messages")
        .select(`
          *,
          sender:sender_id(id, full_name, avatar_url)
        `)
        .eq("receiver_id", userId)
        .order("created_at", { ascending: false })
        .limit(3);

      if (messagesData) {
        setRecentMessages(messagesData as any);
      }

      // Calculate stats
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      // Count all sessions this month (scheduled, confirmed, and completed)
      const { count: sessionCount } = await supabase
        .from("sessions")
        .select("*", { count: "exact", head: true })
        .eq("mentee_id", userId)
        .in("status", ["scheduled", "confirmed", "completed"])
        .gte("created_at", startOfMonth.toISOString());

      // Calculate hours from completed sessions only
      const { data: completedSessions } = await supabase
        .from("sessions")
        .select("duration_minutes")
        .eq("mentee_id", userId)
        .eq("status", "completed");

      const totalHours = completedSessions?.reduce((sum, s) => sum + s.duration_minutes, 0) || 0;

      // Get unique mentors from all sessions
      const { data: mentors } = await supabase
        .from("sessions")
        .select("mentor_id")
        .eq("mentee_id", userId)
        .in("status", ["scheduled", "confirmed", "completed"]);

      const uniqueMentors = new Set(mentors?.map(m => m.mentor_id));

      setStats({
        sessionsThisMonth: sessionCount || 0,
        hoursLearned: Math.round((totalHours / 60) * 10) / 10,
        activeMentors: uniqueMentors.size
      });

    } catch (error) {
      console.error("Error loading dashboard:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  // Confirm and join a session: ensure meeting URL exists, update status if needed, then open meeting
  // Simple Join Session → Open video meeting directly
const handleJoinSession = (sessionToJoin: any) => {
  const meetingUrl = `https://meet.jit.si/scholar-${sessionToJoin.id}`;
  window.open(meetingUrl, "_blank");
};

  const formatDate = (date: string) => {
    const d = new Date(date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (d.toDateString() === today.toDateString()) {
      return `Today, ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
    } else if (d.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow, ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
    }
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  };

  const getTimeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="h-12 w-12 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-foreground/70">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                Welcome back,{" "}
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  {profile?.full_name || "User"}
                </span>
              </h1>
              <p className="text-foreground/70 text-lg">
                {roles?.includes('mentor') ? 'Your mentoring dashboard' : 'Your mentorship journey'}
                {backendStats && ` • ${backendStats.roles.join(', ')} role`}
              </p>
            </div>
            <Button variant="outline" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {[
              {
                label: "Sessions This Month",
                value: stats.sessionsThisMonth.toString(),
                change: "+2 from last month",
                icon: Calendar,
                color: "text-primary"
              },
              {
                label: "Hours Learned",
                value: stats.hoursLearned.toString(),
                change: "+4.5 from last month",
                icon: Clock,
                color: "text-secondary"
              },
              {
                label: "Active Mentors",
                value: stats.activeMentors.toString(),
                change: "Across different skills",
                icon: TrendingUp,
                color: "text-accent"
              }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6 bg-gradient-card backdrop-blur-sm border-border/40 hover:border-primary/40 transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <stat.icon className={`h-10 w-10 ${stat.color}`} />
                  </div>
                  <div className="text-3xl font-bold mb-1">{stat.value}</div>
                  <div className="text-sm text-foreground/60 mb-2">{stat.label}</div>
                  <div className="text-xs text-foreground/50">{stat.change}</div>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Mentor Profile Card - Only for mentors */}
              {roles?.includes('mentor') && profile && (
                <Card className="p-6 bg-gradient-card backdrop-blur-sm border-border/40">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-1">
                        {profile.full_name}
                      </h2>
                      <p className="text-foreground/60">{profile.role}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">
                        ₹{profile.hourly_rate || 0}/hr
                      </div>
                    </div>
                  </div>
                  {profile.bio && (
                    <p className="text-foreground/70 mb-4">{profile.bio}</p>
                  )}
                  {profile.skills && profile.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.map((skill: string, i: number) => (
                        <span key={i} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </Card>
              )}

              {/* AI Recommendations */}
              {!roles?.includes('mentor') && (
                <Card className="p-6 bg-gradient-card backdrop-blur-sm border-border/40">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold">AI Recommendations</h2>
                  </div>
                  <p className="text-foreground/70 mb-4">
                    Based on your learning goals and recent activity, we recommend these mentors:
                  </p>
                  <div className="space-y-3">
                    {["UI/UX Design Systems", "Product Strategy", "Career Growth"].map((skill, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/40">
                        <span className="font-medium">{skill}</span>
                        <Link to="/mentors">
                          <Button size="sm" variant="outline" className="gap-2">
                            Explore
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Upcoming Sessions */}
              <Card className="p-6 bg-gradient-card backdrop-blur-sm border-border/40">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">Upcoming Sessions</h2>
                  <Link to="/mentors">
                    <Button variant="ghost" size="sm">View All</Button>
                  </Link>
                </div>
                {sessions.length === 0 ? (
                  <div className="text-center py-8 text-foreground/60">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No upcoming sessions scheduled</p>
                    <Link to="/mentors">
                      <Button className="mt-4" size="sm">Find a Mentor</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sessions.map((session) => (
                      <div
                        key={session.id}
                        className="flex items-start gap-4 p-4 rounded-lg bg-background/50 border border-border/40 hover:border-primary/40 transition-all"
                      >
                        <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                          <Calendar className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1">{session.topic}</h3>
                          <p className="text-sm text-foreground/60 mb-2">
                            with {profile?.id === (session as any).mentor_id ? (session as any).mentee.full_name : (session as any).mentor.full_name}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-foreground/50">
                            <span>{formatDate(session.scheduled_at)}</span>
                            <span>•</span>
                            <span>{session.duration_minutes} min</span>
                          </div>
                        </div>
                        <Button size="sm" className="bg-gradient-primary hover:opacity-90" onClick={() => handleJoinSession(session)}>
                          Join
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Completed Sessions - Rate Your Experience */}
              {completedSessions.length > 0 && (
                <Card className="p-6 bg-gradient-card backdrop-blur-sm border-border/40">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold">Completed Sessions</h2>
                  </div>
                  <div className="space-y-4">
                    {completedSessions.map((session) => (
                      <div
                        key={session.id}
                        className="flex items-start gap-4 p-4 rounded-lg bg-background/50 border border-border/40"
                      >
                        <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1">{session.topic}</h3>
                          <p className="text-sm text-foreground/60 mb-2">
                            with {profile?.id === session.mentor_id ? session.mentee.full_name : session.mentor.full_name}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-foreground/50">
                            <span>{new Date(session.scheduled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                            <span>•</span>
                            <span>{session.duration_minutes} min</span>
                          </div>
                        </div>
                        {!session.feedback_given ? (
                          <Link to={`/rate-session/${session.id}`}>
                            <Button size="sm" variant="outline" className="gap-2">
                              <Star className="h-4 w-4" />
                              Rate
                            </Button>
                          </Link>
                        ) : (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CheckCircle2 className="h-4 w-4" />
                            Rated
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Quick Actions */}
              <Card className="p-6 bg-gradient-card backdrop-blur-sm border-border/40">
                <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
                <div className="space-y-3">
                  <Link to="/mentors">
                    <Button className="w-full justify-start gap-2 bg-gradient-primary hover:opacity-90">
                      <Sparkles className="h-4 w-4" />
                      Find New Mentor
                    </Button>
                  </Link>
                  <Link to="/mentors">
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <Calendar className="h-4 w-4" />
                      Schedule Session
                    </Button>
                  </Link>
                  <Link to={
                    sessions.length > 0
                      ? `/messages/${profile?.id === (sessions[0] as any).mentor_id ? (sessions[0] as any).mentee.id : (sessions[0] as any).mentor.id}`
                      : (recentMessages.length > 0
                        ? `/messages/${(recentMessages[0] as any).sender.id}`
                        : '/mentors')
                  }>
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <MessageSquare className="h-4 w-4" />
                      View Messages
                    </Button>
                  </Link>
                </div>
              </Card>

              {/* Recent Activity */}
              <Card className="p-6 bg-gradient-card backdrop-blur-sm border-border/40">
                <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
                {recentMessages.length === 0 ? (
                  <div className="text-center py-6 text-foreground/60">
                    <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No recent activity</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentMessages.map((message) => (
                      <Link 
                        key={message.id} 
                        to={`/messages/${(message as any).sender.id}`}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-background/50 border border-transparent hover:border-primary/20 transition-all cursor-pointer"
                      >
                        <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                          <MessageSquare className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">New message</p>
                          <p className="text-xs text-foreground/60">{message.sender.full_name}</p>
                          <p className="text-xs text-foreground/50 mt-1">{getTimeAgo(message.created_at)}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </Card>

              {/* Progress */}
              <Card className="p-6 bg-gradient-card backdrop-blur-sm border-border/40">
                <h2 className="text-xl font-semibold mb-4">Profile Completion</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>Progress</span>
                    <span className="font-semibold">{profile?.profile_completion || 0}%</span>
                  </div>
                  <Progress value={profile?.profile_completion || 0} className="h-2" />
                  <p className="text-xs text-foreground/60">
                    Complete your profile to get better {roles?.includes('mentor') ? 'mentee' : 'mentor'} recommendations
                  </p>
                  {(profile?.profile_completion || 0) < 100 && (
                    <Link to={roles?.includes('mentor') ? "/complete-mentor-profile" : "/edit-profile"}>
                      <Button variant="outline" size="sm" className="w-full mt-2">
                        Complete Profile
                      </Button>
                    </Link>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
