import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  to: string;
  subject: string;
  type: 'welcome' | 'session-booked' | 'session-confirmed' | 'session-cancelled' | 'session-reminder' | 'session-rescheduled';
  data: {
    userName: string;
    mentorName?: string;
    menteeName?: string;
    sessionDate?: string;
    sessionTime?: string;
    sessionTopic?: string;
    sessionLink?: string;
    duration?: number;
    newSessionDate?: string;
  };
}

const getEmailTemplate = (type: string, data: any): string => {
  const baseStyle = `
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
      .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
      .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
      .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    </style>
  `;

  switch (type) {
    case 'welcome':
      return `
        ${baseStyle}
        <div class="container">
          <div class="header">
            <h1>✨ Welcome to Scholar!</h1>
          </div>
          <div class="content">
            <p>Hi ${data.userName},</p>
            <p>Welcome to Scholar - your AI-powered mentorship platform! We're excited to have you join our community.</p>
            <p>Get started by exploring mentors, booking your first session, or completing your profile.</p>
            <a href="${Deno.env.get('VITE_SUPABASE_URL')}" class="button">Go to Dashboard</a>
          </div>
          <div class="footer">
            <p>© 2025 Scholar. All rights reserved.</p>
          </div>
        </div>
      `;

    case 'session-booked':
      return `
        ${baseStyle}
        <div class="container">
          <div class="header">
            <h1>📅 ${data.sessionTopic || 'Mentorship Session'}</h1>
          </div>
          <div class="content">
            <p>Hi ${data.userName},</p>
            <p>${data.menteeName ? `<strong>${data.menteeName}</strong> has booked a mentorship session with you!` : `Your mentorship session with <strong>${data.mentorName}</strong> has been booked!`}</p>
            <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #667eea;">
              ${data.mentorName ? `<p style="margin: 8px 0;"><strong>Mentor:</strong> ${data.mentorName}</p>` : ''}
              <p style="margin: 8px 0;"><strong>Topic:</strong> ${data.sessionTopic || 'Career Mentorship'}</p>
              <p style="margin: 8px 0;"><strong>Date:</strong> ${data.sessionDate}</p>
              ${data.sessionTime ? `<p style="margin: 8px 0;"><strong>Time:</strong> ${data.sessionTime}</p>` : ''}
              <p style="margin: 8px 0;"><strong>Duration:</strong> ${data.duration || 60} minutes</p>
            </div>
            <p style="margin: 12px 0;">We’re excited to connect ❤️</p>
            ${data.sessionLink ? `
              <p style="margin: 20px 0;">Click the button below to join the session:</p>
              <a href="${data.sessionLink}" class="button" style="background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                🔗 Join Meeting
              </a>
            ` : `
              <p>The meeting link will be available once the mentor confirms the session.</p>
              <a href="${Deno.env.get('VITE_SUPABASE_URL')}/dashboard" class="button">View Dashboard</a>
            `}
          </div>
          <div class="footer">
            <p>© 2025 Scholar. All rights reserved.</p>
            <p style="margin-top: 8px;">Thank you for being part of Scholar Mentorship!</p>
          </div>
        </div>
      `;

    case 'session-confirmed':
      return `
        ${baseStyle}
        <div class="container">
          <div class="header">
            <h1>✅ Session Confirmed!</h1>
          </div>
          <div class="content">
            <p>Hi ${data.userName},</p>
            <p>Great news! Your mentorship session has been confirmed.</p>
            <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <p><strong>Mentor:</strong> ${data.mentorName}</p>
              <p><strong>Topic:</strong> ${data.sessionTopic}</p>
              <p><strong>Date:</strong> ${data.sessionDate}</p>
              ${data.sessionLink ? `<p><strong>Meeting Link:</strong> <a href="${data.sessionLink}">${data.sessionLink}</a></p>` : ''}
            </div>
            <a href="${Deno.env.get('VITE_SUPABASE_URL')}/dashboard" class="button">View Session</a>
          </div>
          <div class="footer">
            <p>© 2025 Scholar. All rights reserved.</p>
          </div>
        </div>
      `;

    case 'session-cancelled':
      return `
        ${baseStyle}
        <div class="container">
          <div class="header">
            <h1>❌ Session Cancelled</h1>
          </div>
          <div class="content">
            <p>Hi ${data.userName},</p>
            <p>Unfortunately, your mentorship session has been cancelled.</p>
            <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <p><strong>Topic:</strong> ${data.sessionTopic}</p>
              <p><strong>Date:</strong> ${data.sessionDate}</p>
            </div>
            <p>You can book a new session from your dashboard.</p>
            <a href="${Deno.env.get('VITE_SUPABASE_URL')}/mentors" class="button">Find a Mentor</a>
          </div>
          <div class="footer">
            <p>© 2025 Scholar. All rights reserved.</p>
          </div>
        </div>
      `;

    case 'session-reminder':
      return `
        ${baseStyle}
        <div class="container">
          <div class="header">
            <h1>⏰ Session Starting Soon!</h1>
          </div>
          <div class="content">
            <p>Hi ${data.userName},</p>
            <p>Your mentorship session is starting soon!</p>
            <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <p><strong>${data.mentorName ? `Mentor: ${data.mentorName}` : `Mentee: ${data.menteeName}`}</strong></p>
              <p><strong>Topic:</strong> ${data.sessionTopic}</p>
              <p><strong>Date:</strong> ${data.sessionDate}</p>
              ${data.sessionLink ? `<p><strong>Meeting Link:</strong> <a href="${data.sessionLink}" style="color: #667eea;">${data.sessionLink}</a></p>` : ''}
            </div>
            <p>Click the link below to join the session:</p>
            ${data.sessionLink ? `<a href="${data.sessionLink}" class="button">Join Session</a>` : ''}
          </div>
          <div class="footer">
            <p>© 2025 Scholar. All rights reserved.</p>
          </div>
        </div>
      `;

    case 'session-rescheduled':
      return `
        ${baseStyle}
        <div class="container">
          <div class="header">
            <h1>📅 Session Rescheduled</h1>
          </div>
          <div class="content">
            <p>Hi ${data.userName},</p>
            <p>Your mentorship session has been rescheduled.</p>
            <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <p><strong>Topic:</strong> ${data.sessionTopic}</p>
              <p><strong>Previous Date:</strong> <span style="text-decoration: line-through;">${data.sessionDate}</span></p>
              <p><strong>New Date:</strong> <span style="color: #667eea; font-weight: bold;">${data.newSessionDate}</span></p>
              ${data.mentorName ? `<p><strong>Mentor:</strong> ${data.mentorName}</p>` : ''}
            </div>
            <a href="${Deno.env.get('VITE_SUPABASE_URL')}/dashboard" class="button">View Dashboard</a>
          </div>
          <div class="footer">
            <p>© 2025 Scholar. All rights reserved.</p>
          </div>
        </div>
      `;

    default:
      return '<p>Email notification</p>';
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, type, data }: EmailRequest = await req.json();

    console.log('Sending email:', { to, subject, type });

    const html = getEmailTemplate(type, data);

    // Validate FROM address format or use sandbox fallback
    let FROM_ADDRESS = Deno.env.get('RESEND_FROM') || 'Scholar <onboarding@resend.dev>';
    
    // Ensure proper format: "Name <email@domain.com>" or "email@domain.com"
    if (FROM_ADDRESS && !FROM_ADDRESS.includes('@')) {
      FROM_ADDRESS = 'Scholar <onboarding@resend.dev>';
    }

    // For sandbox testing: if using onboarding@resend.dev, send to verified account email
    const isUsingSandbox = FROM_ADDRESS.includes('onboarding@resend.dev');
    const testEmail = 'keshavgoel2023@gmail.com'; // Verified Resend account email
    const recipientEmail = isUsingSandbox ? testEmail : to;

    console.log(`Sandbox mode: ${isUsingSandbox}, Sending to: ${recipientEmail} (original: ${to})`);

    const sendEmail = () => resend.emails.send({
      from: FROM_ADDRESS,
      to: [recipientEmail],
      subject: `[TEST - for ${to}] ${subject}`,
      html,
    });

    let sendError: any = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res: any = await sendEmail();
        if (!res?.error) {
          sendError = null;
          break;
        }
        sendError = res.error;
      } catch (e: any) {
        sendError = e;
      }

      console.log('Resend send attempt failed', { attempt, error: sendError });
      if (sendError?.statusCode === 429 || sendError?.name === 'rate_limit_exceeded') {
        // simple backoff before retrying
        await new Promise((r) => setTimeout(r, 800));
        continue;
      }
      break;
    }

    if (sendError) {
      throw sendError;
    }

    console.log('Email sent successfully');

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error sending email:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});