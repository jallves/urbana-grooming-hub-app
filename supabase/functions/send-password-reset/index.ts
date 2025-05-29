
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  email: string;
  redirectTo?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, redirectTo }: PasswordResetRequest = await req.json();

    console.log('Iniciando processo de reset de senha para:', email);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Configuração do Supabase não encontrada');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Generate password reset token using Supabase
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: redirectTo || `${new URL(req.url).origin}/reset-password`
      }
    });

    if (error) {
      console.error('Erro ao gerar link de reset:', error);
      throw new Error('Não foi possível gerar o link de recuperação');
    }

    const resetLink = data.properties?.action_link;

    if (!resetLink) {
      console.error('Link de reset não foi gerado');
      throw new Error('Não foi possível gerar o link de recuperação');
    }

    console.log('Link de reset gerado com sucesso');

    // Verificar se a API key do Resend está configurada
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY não está configurada');
    }

    // Send email using Resend
    const emailResponse = await resend.emails.send({
      from: "Urbana Barbearia <noreply@resend.dev>",
      to: [email],
      subject: "🔐 Redefinir Senha - Urbana Barbearia",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #8B4513; margin: 0; font-size: 28px;">🔐 Redefinir Senha</h1>
              <p style="margin: 10px 0 0; color: #666; font-size: 16px;">Urbana Barbearia</p>
            </div>
            
            <div style="margin-bottom: 30px;">
              <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
                Olá! Recebemos uma solicitação para redefinir sua senha.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" 
                   style="background: #D2691E; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; font-size: 16px;">
                  Redefinir Senha
                </a>
              </div>
              
              <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #856404; font-size: 14px;">
                  ⚠️ <strong>Importante:</strong> Este link expira em 1 hora. Se você não solicitou esta alteração, pode ignorar este email.
                </p>
              </div>
              
              <p style="color: #666; font-size: 12px; margin-top: 20px; word-break: break-all;">
                Se o botão não funcionar, copie e cole este link no seu navegador:<br>
                <span style="color: #D2691E;">${resetLink}</span>
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #888; font-style: italic; font-size: 14px; margin: 0;">
                Urbana Barbearia - Onde o estilo encontra a tradição
              </p>
            </div>
          </div>
        </div>
      `,
    });

    console.log("Resposta do Resend:", emailResponse);

    if (emailResponse.error) {
      console.error("Erro do Resend:", emailResponse.error);
      throw new Error(`Erro ao enviar email: ${emailResponse.error.message}`);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Email de recuperação enviado com sucesso",
      emailId: emailResponse.data?.id
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Erro na função send-password-reset:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Erro interno do servidor",
        success: false 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
