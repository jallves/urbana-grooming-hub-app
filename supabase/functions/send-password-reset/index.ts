
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  email: string;
  resetLink: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, resetLink }: PasswordResetRequest = await req.json();

    const emailResponse = await resend.emails.send({
      from: "Urbana Barbearia <onboarding@resend.dev>",
      to: [email],
      subject: "🔐 Redefinir Senha - Urbana Barbearia",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; background: linear-gradient(135deg, #8B4513, #D2691E); color: white; padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">🔐 Redefinir Senha</h1>
            <p style="margin: 10px 0 0; font-size: 16px;">Urbana Barbearia</p>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 18px; color: #333; margin-bottom: 20px;">
              Olá! Recebemos uma solicitação para redefinir sua senha.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="background: #D2691E; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Redefinir Senha
              </a>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #856404; font-size: 14px;">
                ⚠️ <strong>Importante:</strong> Este link expira em 24 horas. Se você não solicitou esta alteração, pode ignorar este email.
              </p>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 20px;">
              Se o botão não funcionar, copie e cole este link no seu navegador:<br>
              <a href="${resetLink}" style="color: #D2691E; word-break: break-all;">${resetLink}</a>
            </p>
            
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #888; font-style: italic; font-size: 14px;">
                Urbana Barbearia - Onde o estilo encontra a tradição
              </p>
            </div>
          </div>
        </div>
      `,
    });

    console.log("Password reset email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-password-reset function:", error);
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
