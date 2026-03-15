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

    const { action, sessionId, status, meetingUrl, reason } = await req.json();

    if (action === 'update-status') {
      const { data: session, error: fetchError } = await supabaseClient
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (fetchError) throw fetchError;

      // Verify user is mentor or mentee of this session
      if (session.mentor_id !== user.id && session.mentee_id !== user.id) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const updateData: any = { status };
      if (meetingUrl) updateData.meeting_url = meetingUrl;

      const { data, error } = await supabaseClient
        .from('sessions')
        .update(updateData)
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;

      // Send email notifications using service role
      try {
        const serviceSupabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        );

        console.log('Fetching profiles for email notification...');
        const { data: mentorProfile } = await supabaseClient
          .from('profiles')
          .select('full_name')
          .eq('id', session.mentor_id)
          .single();

        const { data: menteeProfile } = await supabaseClient
          .from('profiles')
          .select('full_name')
          .eq('id', session.mentee_id)
          .single();

        // Get emails using service role admin API
        console.log('Fetching email for mentor:', session.mentor_id);
        const { data: mentorAuthData, error: mentorEmailError } = await serviceSupabase.auth.admin.getUserById(session.mentor_id);
        if (mentorEmailError) console.error('Mentor email fetch error:', mentorEmailError);
        console.log('Mentor auth data:', mentorAuthData);

        console.log('Fetching email for mentee:', session.mentee_id);
        const { data: menteeAuthData, error: menteeEmailError } = await serviceSupabase.auth.admin.getUserById(session.mentee_id);
        if (menteeEmailError) console.error('Mentee email fetch error:', menteeEmailError);
        console.log('Mentee auth data:', menteeAuthData);

        const mentorEmail = mentorAuthData?.user?.email;
        const menteeEmail = menteeAuthData?.user?.email;

        console.log('Emails retrieved - Mentor:', mentorEmail, 'Mentee:', menteeEmail);

        if (status === 'confirmed') {
          // Email to mentee with session reminder
          if (menteeEmail) {
            console.log('Sending session reminder to mentee:', menteeEmail);
            const menteeEmailResponse = await supabaseClient.functions.invoke('send-email', {
              body: {
                to: menteeEmail,
                subject: 'Session Starting Soon - Join Now!',
                type: 'session-reminder',
                data: {
                  userName: menteeProfile?.full_name || 'there',
                  mentorName: mentorProfile?.full_name || 'your mentor',
                  sessionDate: new Date(session.scheduled_at).toLocaleString(),
                  sessionTopic: session.topic,
                  sessionLink: meetingUrl || session.meeting_url,
                },
              },
            });
            console.log('Mentee email response:', menteeEmailResponse);
          } else {
            console.warn('No mentee email found, cannot send reminder');
          }

          // Email to mentor with session reminder
          if (mentorEmail) {
            console.log('Sending session reminder to mentor:', mentorEmail);
            const mentorEmailResponse = await supabaseClient.functions.invoke('send-email', {
              body: {
                to: mentorEmail,
                subject: 'Session Starting Soon - Join Now!',
                type: 'session-reminder',
                data: {
                  userName: mentorProfile?.full_name || 'there',
                  menteeName: menteeProfile?.full_name || 'your mentee',
                  sessionDate: new Date(session.scheduled_at).toLocaleString(),
                  sessionTopic: session.topic,
                  sessionLink: meetingUrl || session.meeting_url,
                },
              },
            });
            console.log('Mentor email response:', mentorEmailResponse);
          } else {
            console.warn('No mentor email found, cannot send reminder');
          }
        } else if (status === 'cancelled') {
          // Email to both parties
          const recipientEmail = user.id === session.mentor_id ? menteeEmail : mentorEmail;
          const recipientName = user.id === session.mentor_id ? menteeProfile?.full_name : mentorProfile?.full_name;

          if (recipientEmail) {
            console.log('Sending cancellation email to:', recipientEmail);
            await supabaseClient.functions.invoke('send-email', {
              body: {
                to: recipientEmail,
                subject: 'Session Cancelled',
                type: 'session-cancelled',
                data: {
                  userName: recipientName,
                  sessionDate: new Date(session.scheduled_at).toLocaleString(),
                  sessionTopic: session.topic,
                },
              },
            });
          }
        }
      } catch (emailError) {
        console.error('Error sending emails:', emailError);
        // Don't fail the whole request if email fails
      }

      console.log('Session updated:', data);
      return new Response(JSON.stringify({ success: true, session: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'cancel-session') {
      const { data: session, error: fetchError } = await supabaseClient
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (fetchError) throw fetchError;

      // Verify user is mentor or mentee of this session
      if (session.mentor_id !== user.id && session.mentee_id !== user.id) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Update session with cancellation details
      const { data, error } = await supabaseClient
        .from('sessions')
        .update({
          status: 'cancelled',
          cancelled_by: user.id,
          cancellation_reason: reason || 'No reason provided',
          refund_status: 'pending',
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;

      // Send cancellation emails
      try {
        const serviceSupabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        );

        const { data: mentorProfile } = await supabaseClient
          .from('profiles')
          .select('full_name')
          .eq('id', session.mentor_id)
          .single();

        const { data: menteeProfile } = await supabaseClient
          .from('profiles')
          .select('full_name')
          .eq('id', session.mentee_id)
          .single();

        const { data: mentorAuthData } = await serviceSupabase.auth.admin.getUserById(session.mentor_id);
        const { data: menteeAuthData } = await serviceSupabase.auth.admin.getUserById(session.mentee_id);

        const mentorEmail = mentorAuthData?.user?.email;
        const menteeEmail = menteeAuthData?.user?.email;

        // Send to both parties
        if (menteeEmail) {
          await supabaseClient.functions.invoke('send-email', {
            body: {
              to: menteeEmail,
              subject: 'Session Cancelled',
              type: 'session-cancelled',
              data: {
                userName: menteeProfile?.full_name || 'there',
                sessionDate: new Date(session.scheduled_at).toLocaleString(),
                sessionTopic: session.topic,
              },
            },
          });
        }

        if (mentorEmail) {
          await supabaseClient.functions.invoke('send-email', {
            body: {
              to: mentorEmail,
              subject: 'Session Cancelled',
              type: 'session-cancelled',
              data: {
                userName: mentorProfile?.full_name || 'there',
                sessionDate: new Date(session.scheduled_at).toLocaleString(),
                sessionTopic: session.topic,
              },
            },
          });
        }
      } catch (emailError) {
        console.error('Error sending cancellation emails:', emailError);
      }

      return new Response(JSON.stringify({ success: true, session: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in manage-session:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
