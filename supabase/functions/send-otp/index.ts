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

const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email }: OTPRequest = await req.json();

    if (!email) {
      throw new Error('Email is required');
    }

    // Generate 6-digit OTP
    const code = generateOTP();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5); // 5 minutes expiry

    // Create Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Delete any existing unverified OTP codes for this email
    await supabase
      .from('otp_codes')
      .delete()
      .eq('email', email)
      .eq('verified', false);

    // Store OTP in database
    const { error: dbError } = await supabase
      .from('otp_codes')
      .insert({
        email,
        code,
        expires_at: expiresAt.toISOString(),
        verified: false,
      });

    if (dbError) throw dbError;

    // Send email with OTP
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

    if (emailError) throw emailError;

    console.log(`OTP sent successfully to ${email}`);

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
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
