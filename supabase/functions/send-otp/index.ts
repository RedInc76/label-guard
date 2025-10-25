import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Resend } from 'npm:resend@2.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string);
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OTPRequest {
  email: string;
}

// Rate limit configuration
const RATE_LIMIT_WINDOW_HOURS = 1;
const MAX_OTP_PER_EMAIL = 3;
const MAX_OTP_PER_IP = 10;

const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Email validation regex (RFC 5322 simplified)
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. EXTRACT IP ADDRESS
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               req.headers.get('x-real-ip') || 
               'unknown';
    
    console.log(`OTP request from IP: ${ip}`);

    // 2. VALIDATE INPUT
    const body = await req.json() as OTPRequest;
    const email = body.email?.trim();

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate email format
    if (!EMAIL_REGEX.test(email) || email.length > 255) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 3. CHECK RATE LIMITS
    const windowStart = new Date();
    windowStart.setHours(windowStart.getHours() - RATE_LIMIT_WINDOW_HOURS);

    // Check email rate limit
    const { data: emailRateLimit, error: emailRateLimitError } = await supabase
      .from('otp_rate_limit')
      .select('attempt_count')
      .eq('email', email)
      .gte('window_start', windowStart.toISOString())
      .maybeSingle();

    if (emailRateLimitError && emailRateLimitError.code !== 'PGRST116') {
      console.error('Email rate limit check error:', emailRateLimitError);
      throw emailRateLimitError;
    }

    const emailAttempts = emailRateLimit?.attempt_count || 0;

    if (emailAttempts >= MAX_OTP_PER_EMAIL) {
      console.warn(`Email rate limit exceeded for ${email}: ${emailAttempts}/${MAX_OTP_PER_EMAIL}`);
      return new Response(
        JSON.stringify({ 
          error: `Too many OTP requests for this email. Maximum ${MAX_OTP_PER_EMAIL} per hour. Please try again later.`,
          retryAfter: 3600
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check IP rate limit
    const { data: ipRateLimit, error: ipRateLimitError } = await supabase
      .from('otp_rate_limit')
      .select('attempt_count')
      .eq('ip_address', ip)
      .gte('window_start', windowStart.toISOString())
      .maybeSingle();

    if (ipRateLimitError && ipRateLimitError.code !== 'PGRST116') {
      console.error('IP rate limit check error:', ipRateLimitError);
      throw ipRateLimitError;
    }

    const ipAttempts = ipRateLimit?.attempt_count || 0;

    if (ipAttempts >= MAX_OTP_PER_IP) {
      console.warn(`IP rate limit exceeded for ${ip}: ${ipAttempts}/${MAX_OTP_PER_IP}`);
      return new Response(
        JSON.stringify({ 
          error: `Too many OTP requests from this location. Maximum ${MAX_OTP_PER_IP} per hour. Please try again later.`,
          retryAfter: 3600
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. CLEAN UP EXPIRED OTP CODES
    await supabase
      .from('otp_codes')
      .delete()
      .eq('email', email)
      .eq('verified', false);

    // 5. GENERATE AND STORE NEW OTP
    const code = generateOTP();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5); // 5 minutes expiry

    const { error: dbError } = await supabase
      .from('otp_codes')
      .insert({
        email,
        code,
        expires_at: expiresAt.toISOString(),
        verified: false,
      });

    if (dbError) {
      console.error('Database error storing OTP:', dbError);
      throw dbError;
    }

    // 6. SEND EMAIL WITH OTP
    const { error: emailError } = await resend.emails.send({
      from: 'LabelGuard <onboarding@resend.dev>',
      to: [email],
      subject: 'Tu código de verificación - LabelGuard',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Código de Verificación</h1>
          <p>Tu código de verificación es:</p>
          <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0;">
            ${code}
          </div>
          <p style="color: #666;">Este código expirará en 5 minutos.</p>
          <p style="color: #666;">Si no solicitaste este código, puedes ignorar este email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
          <p style="color: #999; font-size: 12px;">LabelGuard - Tu asistente de compras saludables</p>
        </div>
      `,
    });

    if (emailError) {
      console.error('Email sending error:', emailError);
      throw emailError;
    }

    // 7. UPDATE RATE LIMIT COUNTERS
    // Update email rate limit
    if (emailRateLimit) {
      await supabase
        .from('otp_rate_limit')
        .update({ attempt_count: emailAttempts + 1 })
        .eq('email', email)
        .gte('window_start', windowStart.toISOString());
    } else {
      await supabase
        .from('otp_rate_limit')
        .insert({ 
          email, 
          ip_address: ip,
          attempt_count: 1,
          window_start: new Date().toISOString()
        });
    }

    // Update IP rate limit (separate record)
    if (ipRateLimit && ipRateLimit !== emailRateLimit) {
      await supabase
        .from('otp_rate_limit')
        .update({ attempt_count: ipAttempts + 1 })
        .eq('ip_address', ip)
        .gte('window_start', windowStart.toISOString());
    } else if (!emailRateLimit) {
      // Already inserted above with both email and IP
    } else {
      // Create separate IP tracking record
      await supabase
        .from('otp_rate_limit')
        .insert({ 
          email: `ip_${ip}`, // Dummy email for IP-only tracking
          ip_address: ip,
          attempt_count: 1,
          window_start: new Date().toISOString()
        });
    }

    // Clean up old records
    await supabase.rpc('cleanup_rate_limits');

    console.log(`OTP sent successfully to ${email} from IP ${ip}. Email attempts: ${emailAttempts + 1}/${MAX_OTP_PER_EMAIL}, IP attempts: ${ipAttempts + 1}/${MAX_OTP_PER_IP}`);

    return new Response(
      JSON.stringify({ success: true, message: 'OTP sent successfully' }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in send-otp function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to send OTP' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
