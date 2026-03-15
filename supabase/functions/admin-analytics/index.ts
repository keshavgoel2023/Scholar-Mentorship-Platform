import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user is admin
    const { data: userRole } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!userRole || userRole.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get total bookings
    const { count: totalBookings } = await supabaseClient
      .from('sessions')
      .select('*', { count: 'exact', head: true });

    // Get completed bookings
    const { count: completedBookings } = await supabaseClient
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed');

    // Get cancelled bookings
    const { count: cancelledBookings } = await supabaseClient
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'cancelled');

    // Get top mentors by session count
    const { data: topMentors } = await supabaseClient
      .from('sessions')
      .select('mentor_id, profiles!sessions_mentor_id_fkey(full_name, avatar_url)')
      .eq('status', 'completed');

    const mentorStats = topMentors?.reduce((acc: any, session: any) => {
      const mentorId = session.mentor_id;
      if (!acc[mentorId]) {
        acc[mentorId] = {
          mentor_id: mentorId,
          mentor_name: session.profiles?.full_name || 'Unknown',
          avatar_url: session.profiles?.avatar_url,
          session_count: 0,
        };
      }
      acc[mentorId].session_count++;
      return acc;
    }, {});

    const topMentorsList = Object.values(mentorStats || {})
      .sort((a: any, b: any) => b.session_count - a.session_count)
      .slice(0, 10);

    // Calculate total earnings (assuming hourly_rate * duration)
    const { data: completedSessions } = await supabaseClient
      .from('sessions')
      .select('mentor_id, duration_minutes, profiles!sessions_mentor_id_fkey(hourly_rate)')
      .eq('status', 'completed');

    const totalEarnings = completedSessions?.reduce((sum: number, session: any) => {
      const hourlyRate = session.profiles?.hourly_rate || 0;
      const hours = session.duration_minutes / 60;
      return sum + (hourlyRate * hours);
    }, 0) || 0;

    // Get earnings by mentor
    const earningsByMentor = completedSessions?.reduce((acc: any, session: any) => {
      const mentorId = session.mentor_id;
      const hourlyRate = session.profiles?.hourly_rate || 0;
      const hours = session.duration_minutes / 60;
      const earnings = hourlyRate * hours;

      if (!acc[mentorId]) {
        acc[mentorId] = 0;
      }
      acc[mentorId] += earnings;
      return acc;
    }, {});

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count: recentBookings } = await supabaseClient
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString());

    // Get average rating
    const { data: feedbackData } = await supabaseClient
      .from('session_feedback')
      .select('rating');

    const averageRating = feedbackData && feedbackData.length > 0
      ? feedbackData.reduce((sum, f) => sum + f.rating, 0) / feedbackData.length
      : 0;

    const analytics = {
      totalBookings: totalBookings || 0,
      completedBookings: completedBookings || 0,
      cancelledBookings: cancelledBookings || 0,
      recentBookings: recentBookings || 0,
      totalEarnings: Math.round(totalEarnings * 100) / 100,
      topMentors: topMentorsList,
      earningsByMentor: earningsByMentor || {},
      averageRating: Math.round(averageRating * 10) / 10,
      totalFeedback: feedbackData?.length || 0,
    };

    return new Response(JSON.stringify({ success: true, analytics }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in admin-analytics:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
