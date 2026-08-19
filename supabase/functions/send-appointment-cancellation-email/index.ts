import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { isEmail } from "https://deno.land/x/isemail@v1.0.1/mod.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-totem-token",
};

interface CancellationEmailRequest {
  clientName: string;
  clientEmail: string;
  serviceName: string;
  staffName: string;
  appointmentDate: string;
  appointmentTime: string;
  servicePrice: number | string;
  cancelledBy: 'client' | 'admin' | 'barber';
  cancellationReason?: string;
}

const validateRequestBody = (body: any): body is CancellationEmailRequest => {
  const requiredFields = [
    'clientName',
    'clientEmail',
    'serviceName',
    'staffName',
    'appointmentDate',
    'appointmentTime',
    'servicePrice',
    'cancelledBy'
  ];

  return requiredFields.every(field => 
    body[field] !== undefined && 
    body[field] !== null && 
    body[field] !== ''
  );
};

const getCancellationMessage = (cancelledBy: string): string => {
  switch(cancelledBy) {
    case 'client':
      return 'Você cancelou o seu agendamento.';
    case 'admin':
      return 'Seu agendamento foi cancelado pelo administrador.';
    case 'barber':
      return 'Seu agendamento foi cancelado pelo profissional.';
    default:
      return 'Seu agendamento foi cancelado.';
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      headers: {
        ...corsHeaders,
        "Access-Control-Allow-Methods": "POST, OPTIONS"
      } 
    });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { 
        status: 405, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );
  }

  try {
    const body = await req.json();
    
    console.log('📧 [CancellationEmail] Recebendo requisição:', JSON.stringify(body, null, 2));

    if (!validateRequestBody(body)) {
      console.error('❌ [CancellationEmail] Campos obrigatórios faltando');
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { 
          status: 400, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    const { 
      clientName,
      clientEmail,
      serviceName,
      staffName,
      appointmentDate,
      appointmentTime,
      servicePrice,
      cancelledBy,
      cancellationReason
    } = body;

    if (!isEmail(clientEmail)) {
      console.error('❌ [CancellationEmail] E-mail inválido:', clientEmail);
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { 
          status: 400, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    // Formatação do preço
    const priceNumber = typeof servicePrice === 'string' ? parseFloat(servicePrice) : servicePrice;
    const formattedPrice = isNaN(priceNumber) ? '0,00' : priceNumber.toFixed(2).replace('.', ',');

    // Formatar data no padrão brasileiro
    const [year, month, day] = appointmentDate.split('-');
    const formattedDate = `${day}/${month}/${year}`;

    const logoUrl = 'https://barbeariacostaurbana.com.br/images/logo-barbearia-costa-urbana.png';
    const cancellationMessage = getCancellationMessage(cancelledBy);

    console.log('📧 [CancellationEmail] Enviando e-mail de cancelamento para:', clientEmail);
    console.log('📧 [CancellationEmail] Cancelado por:', cancelledBy);

    const emailResponse = await resend.emails.send({
      from: "Barbearia Costa Urbana <noreply@barbeariacostaurbana.com.br>",
      to: [clientEmail],
      subject: "❌ Agendamento Cancelado - Barbearia Costa Urbana",
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f5f5;">
          <!-- Header -->
          <div style="text-align: center; background: linear-gradient(135deg, #1a1a2e, #16213e); color: white; padding: 40px 30px; border-radius: 12px 12px 0 0;">
            <img src="${logoUrl}" alt="Barbearia Costa Urbana" style="width: 90px; height: 90px; border-radius: 50%; margin-bottom: 20px; border: 3px solid #D4A574; object-fit: cover;" />
            <h1 style="margin: 0; font-size: 26px; color: #ef5350; letter-spacing: 1px;">Agendamento Cancelado</h1>
            <p style="margin: 10px 0 0; font-size: 14px; color: #ccc;">Barbearia Costa Urbana</p>
          </div>
          
          <!-- Content -->
          <div style="background: white; padding: 35px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.08);">
            <p style="font-size: 18px; color: #333; margin: 0 0 15px 0; line-height: 1.6;">
              Olá, <strong style="color: #D4A574;">${clientName}</strong>! 👋
            </p>
            <p style="font-size: 15px; color: #666; margin: 0 0 25px 0; line-height: 1.6;">
              ${cancellationMessage}
            </p>
            
            <!-- Cancelled Appointment Details -->
            <div style="background: linear-gradient(135deg, #ffebee, #ffcdd2); padding: 25px; border-radius: 10px; border-left: 5px solid #ef5350; margin: 25px 0;">
              <p style="margin: 0 0 15px 0; color: #c62828; font-weight: 600; font-size: 15px;">❌ Agendamento Cancelado:</p>
              <table style="width: 100%; border-collapse: collapse;" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 10px 0; color: #666; font-size: 14px; vertical-align: top; width: 130px;">📅 Data</td>
                  <td style="padding: 10px 0; color: #222; font-size: 16px; font-weight: 600; vertical-align: top; text-decoration: line-through;">${formattedDate}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #666; font-size: 14px; vertical-align: top;">🕒 Horário</td>
                  <td style="padding: 10px 0; color: #999; font-size: 22px; font-weight: 700; vertical-align: top; text-decoration: line-through;">${appointmentTime}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #666; font-size: 14px; vertical-align: top;">✂️ Serviço</td>
                  <td style="padding: 10px 0; color: #222; font-size: 15px; font-weight: 500; vertical-align: top;">${serviceName}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #666; font-size: 14px; vertical-align: top;">👨‍💼 Profissional</td>
                  <td style="padding: 10px 0; color: #222; font-size: 15px; font-weight: 500; vertical-align: top;">${staffName}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #666; font-size: 14px; vertical-align: top;">💰 Valor</td>
                  <td style="padding: 10px 0; color: #222; font-size: 18px; font-weight: 700; vertical-align: top;">R$ ${formattedPrice}</td>
                </tr>
              </table>
              ${cancellationReason ? `
                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(198, 40, 40, 0.2);">
                  <p style="margin: 0; color: #666; font-size: 13px;">
                    <strong>Motivo:</strong> ${cancellationReason}
                  </p>
                </div>
              ` : ''}
            </div>
            
            <!-- Reagendar -->
            <div style="background: #e3f2fd; border: 1px solid #90caf9; padding: 18px 20px; border-radius: 10px; margin: 25px 0; text-align: center;">
              <p style="margin: 0; color: #1565c0; font-size: 15px; line-height: 1.5;">
                📅 <strong>Deseja reagendar?</strong><br/>
                Acesse seu painel no nosso site ou visite nossa barbearia!
              </p>
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; margin-top: 35px; padding-top: 25px; border-top: 1px solid #eee;">
              <p style="color: #888; margin: 0 0 8px 0; font-size: 13px;">📞 Dúvidas? Entre em contato conosco!</p>
              <p style="color: #D4A574; font-weight: 600; font-size: 17px; margin: 15px 0;">
                Esperamos vê-lo em breve! ✂️
              </p>
              <p style="color: #aaa; font-size: 11px; margin: 20px 0 0 0;">
                © Barbearia Costa Urbana
              </p>
            </div>
          </div>
        </div>
      `,
    });

    console.log('✅ [CancellationEmail] E-mail enviado com sucesso:', emailResponse.id);

    return new Response(JSON.stringify({ 
      message: "Email sent successfully",
      emailId: emailResponse.id
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("❌ [CancellationEmail] Erro ao enviar e-mail:", error);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        details: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
