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

    const { sessionId, rating, comment } = await req.json();

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return new Response(JSON.stringify({ error: 'Rating must be between 1 and 5' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get session details
    const { data: session, error: sessionError } = await supabaseClient
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return new Response(JSON.stringify({ error: 'Session not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify user is part of the session
    if (session.mentor_id !== user.id && session.mentee_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Not part of this session' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify session is completed
    if (session.status !== 'completed') {
      return new Response(JSON.stringify({ error: 'Can only provide feedback for completed sessions' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Determine reviewee (the other person in the session)
    const revieweeId = user.id === session.mentor_id ? session.mentee_id : session.mentor_id;

    // Insert or update feedback
    const { data, error } = await supabaseClient
      .from('session_feedback')
      .upsert({
        session_id: sessionId,
        reviewer_id: user.id,
        reviewee_id: revieweeId,
        rating,
        comment: comment || null,
      }, {
        onConflict: 'session_id,reviewer_id'
      })
      .select()
      .single();

    if (error) throw error;

    console.log('Feedback submitted successfully:', data);

    return new Response(JSON.stringify({ success: true, feedback: data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in submit-feedback:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
