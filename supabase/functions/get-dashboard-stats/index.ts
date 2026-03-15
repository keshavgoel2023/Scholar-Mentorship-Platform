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

    // Get user roles
    const { data: roles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const isMentor = roles?.some(r => r.role === 'mentor');
    const isMentee = roles?.some(r => r.role === 'mentee');

    // Get sessions based on role
    const sessionsQuery = isMentor
      ? supabaseClient.from('sessions').select('*').eq('mentor_id', user.id)
      : supabaseClient.from('sessions').select('*').eq('mentee_id', user.id);

    const { data: sessions } = await sessionsQuery;

    const upcomingSessions = sessions?.filter(s => 
      (s.status === 'scheduled' || s.status === 'confirmed') && new Date(s.scheduled_at) > new Date()
    ).length || 0;

    const completedSessions = sessions?.filter(s => s.status === 'completed').length || 0;

    const pendingSessions = sessions?.filter(s => s.status === 'pending').length || 0;

    // Get average rating for mentors
    let averageRating = 0;
    if (isMentor) {
      const { data: reviews } = await supabaseClient
        .from('reviews')
        .select('rating')
        .eq('mentor_id', user.id);
      
      if (reviews && reviews.length > 0) {
        averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      }
    }

    const stats = {
      upcomingSessions,
      completedSessions,
      pendingSessions,
      totalSessions: sessions?.length || 0,
      averageRating: averageRating.toFixed(1),
      roles: roles?.map(r => r.role) || [],
    };

    console.log('Dashboard stats:', stats);
    return new Response(JSON.stringify(stats), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in get-dashboard-stats:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
