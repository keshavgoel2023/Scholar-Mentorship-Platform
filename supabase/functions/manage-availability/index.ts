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

    // Verify user is a mentor
    const { data: userRole } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!userRole || userRole.role !== 'mentor') {
      return new Response(JSON.stringify({ error: 'Forbidden: Only mentors can manage availability' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, date, availability } = await req.json();

    if (action === 'add-unavailable-date') {
      // Add a date to unavailable dates
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('unavailable_dates')
        .eq('id', user.id)
        .single();

      const currentDates = profile?.unavailable_dates || [];
      const updatedDates = [...currentDates, date];

      const { data, error } = await supabaseClient
        .from('profiles')
        .update({ unavailable_dates: updatedDates })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, unavailable_dates: updatedDates }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'remove-unavailable-date') {
      // Remove a date from unavailable dates
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('unavailable_dates')
        .eq('id', user.id)
        .single();

      const currentDates = profile?.unavailable_dates || [];
      const updatedDates = currentDates.filter((d: string) => d !== date);

      const { data, error } = await supabaseClient
        .from('profiles')
        .update({ unavailable_dates: updatedDates })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, unavailable_dates: updatedDates }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'update-availability') {
      // Update weekly availability schedule
      const { data, error } = await supabaseClient
        .from('profiles')
        .update({ availability })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, availability }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in manage-availability:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
