import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  name?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, name }: EmailRequest = await req.json();

    const emailResponse = await resend.emails.send({
      from: "Label Guard <onboarding@resend.dev>",
      to: [to],
      subject: "¡Bienvenido a Label Guard! 🛡️",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Bienvenido a Label Guard</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
              <tr>
                <td style="padding: 40px 30px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                  <div style="font-size: 48px; margin-bottom: 10px;">🛡️</div>
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Label Guard</h1>
                </td>
              </tr>
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="margin: 0 0 20px 0; color: #1a1a1a; font-size: 24px; font-weight: 600;">¡Bienvenido${name ? ' ' + name : ''} a Label Guard! 🎉</h2>
                  <p style="margin: 0 0 20px 0; color: #4a5568; font-size: 16px; line-height: 1.6;">
                    Tu cuenta ha sido creada exitosamente. Ahora puedes disfrutar de todas las funciones premium:
                  </p>
                  <ul style="color: #4a5568; font-size: 16px; line-height: 1.8; margin: 0 0 30px 0;">
                    <li>✨ Hasta 5 perfiles personalizados</li>
                    <li>📊 Historial completo de escaneos</li>
                    <li>⭐ Productos favoritos ilimitados</li>
                    <li>🤖 Análisis inteligente con IA por fotos</li>
                    <li>☁️ Sincronización automática multi-dispositivo</li>
                  </ul>
                  <p style="margin: 0 0 20px 0; color: #4a5568; font-size: 16px; line-height: 1.6;">
                    Comienza a escanear etiquetas y protege tu salud de forma inteligente.
                  </p>
                  <p style="margin: 30px 0 0 0; color: #718096; font-size: 14px; line-height: 1.6;">
                    Si no creaste esta cuenta, puedes ignorar este correo de forma segura.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding: 30px; text-align: center; background-color: #f7fafc; border-top: 1px solid #e2e8f0;">
                  <p style="margin: 0; color: #a0aec0; font-size: 12px; line-height: 1.6;">
                    © 2025 Label Guard. Escanea etiquetas, protege tu salud.
                  </p>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    });

    console.log("Confirmation email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending confirmation email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
