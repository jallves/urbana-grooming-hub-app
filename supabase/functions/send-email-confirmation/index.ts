import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { isEmail } from "https://deno.land/x/isemail@v1.0.1/mod.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailConfirmationRequest {
  clientName: string;
  clientEmail: string;
  serviceName: string;
  staffName: string;
  appointmentDate: string;
  appointmentTime: string;
  servicePrice: number | string;
  serviceDuration: string;
}

const validateRequestBody = (body: any): body is EmailConfirmationRequest => {
  const requiredFields: (keyof EmailConfirmationRequest)[] = [
    'clientName',
    'clientEmail',
    'serviceName',
    'staffName',
    'appointmentDate',
    'appointmentTime',
    'servicePrice',
    'serviceDuration'
  ];

  return requiredFields.every(field => 
    body[field] !== undefined && 
    body[field] !== null && 
    body[field] !== ''
  );
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
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        } 
      }
    );
  }

  try {
    const body = await req.json();
    
    // Validação dos campos obrigatórios
    if (!validateRequestBody(body)) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { 
          status: 400, 
          headers: { 
            "Content-Type": "application/json", 
            ...corsHeaders 
          } 
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
      serviceDuration
    } = body;

    // Validação de e-mail
    if (!isEmail(clientEmail)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { 
          status: 400, 
          headers: { 
            "Content-Type": "application/json", 
            ...corsHeaders 
          } 
        }
      );
    }

    // Validação de data/hora
    const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}`);
    if (isNaN(appointmentDateTime.getTime())) {
      return new Response(
        JSON.stringify({ error: "Invalid date/time format" }),
        { 
          status: 400, 
          headers: { 
            "Content-Type": "application/json", 
            ...corsHeaders 
          } 
        }
      );
    }

    // Formatação do preço (aceita número ou string)
    const priceNumber = typeof servicePrice === 'string' ? parseFloat(servicePrice) : servicePrice;
    const formattedPrice = isNaN(priceNumber) ? '0,00' : priceNumber.toFixed(2).replace('.', ',');

    // Formatar data no padrão brasileiro (dd/MM/yyyy)
    const [year, month, day] = appointmentDate.split('-');
    const formattedDate = `${day}/${month}/${year}`;

    // Verificar se está dentro do período de lembrete (3 horas)
    const now = new Date();
    const hoursUntilAppointment = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    const willReceiveReminder = hoursUntilAppointment > 3;

    // URL da logo
    const logoUrl = 'https://barbeariacostaurbana.com.br/images/logo-barbearia-costa-urbana.png';

    console.log('📧 Enviando e-mail de confirmação para:', clientEmail);
    console.log('📅 Data:', formattedDate, '⏰ Hora:', appointmentTime);

    const reminderText = willReceiveReminder 
      ? '🔔 <strong>Você receberá um lembrete</strong> 3 horas antes do seu horário!'
      : '🔔 <strong>Seu horário está próximo!</strong> Prepare-se para nos visitar.';

    const emailResponse = await resend.emails.send({
      from: "Barbearia Costa Urbana <noreply@barbeariacostaurbana.com.br>",
      to: [clientEmail],
      subject: "✅ Agendamento Confirmado - Barbearia Costa Urbana",
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f5f5;">
          <!-- Header -->
          <div style="text-align: center; background: linear-gradient(135deg, #1a1a2e, #16213e); color: white; padding: 40px 30px; border-radius: 12px 12px 0 0;">
            <img src="${logoUrl}" alt="Barbearia Costa Urbana" style="width: 90px; height: 90px; border-radius: 50%; margin-bottom: 20px; border: 3px solid #D4A574; object-fit: cover;" />
            <h1 style="margin: 0; font-size: 26px; color: #D4A574; letter-spacing: 1px;">Agendamento Confirmado!</h1>
            <p style="margin: 10px 0 0; font-size: 14px; color: #ccc;">Barbearia Costa Urbana</p>
          </div>
          
          <!-- Content -->
          <div style="background: white; padding: 35px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.08);">
            <p style="font-size: 18px; color: #333; margin: 0 0 25px 0; line-height: 1.6;">
              Olá, <strong style="color: #D4A574;">${clientName}</strong>! 👋<br/>
              <span style="color: #666;">Seu horário está garantido!</span>
            </p>
            
            <!-- Appointment Details Box -->
            <div style="background: linear-gradient(135deg, #fafafa, #f0f0f0); padding: 25px; border-radius: 10px; border-left: 5px solid #D4A574; margin: 25px 0;">
              <table style="width: 100%; border-collapse: collapse;" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 12px 0; color: #666; font-size: 14px; vertical-align: top; width: 130px;">📅 Data</td>
                  <td style="padding: 12px 0; color: #222; font-size: 16px; font-weight: 600; vertical-align: top;">${formattedDate}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; color: #666; font-size: 14px; vertical-align: top;">🕒 Horário</td>
                  <td style="padding: 12px 0; color: #D4A574; font-size: 22px; font-weight: 700; vertical-align: top;">${appointmentTime}</td>
                </tr>
                <tr>
                  <td colspan="2" style="padding: 8px 0;"><hr style="border: none; border-top: 1px solid #e0e0e0; margin: 0;"/></td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; color: #666; font-size: 14px; vertical-align: top;">✂️ Serviço</td>
                  <td style="padding: 12px 0; color: #222; font-size: 15px; font-weight: 500; vertical-align: top;">${serviceName}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; color: #666; font-size: 14px; vertical-align: top;">👨‍💼 Profissional</td>
                  <td style="padding: 12px 0; color: #222; font-size: 15px; font-weight: 500; vertical-align: top;">${staffName}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; color: #666; font-size: 14px; vertical-align: top;">⏱️ Duração</td>
                  <td style="padding: 12px 0; color: #222; font-size: 15px; vertical-align: top;">${serviceDuration} minutos</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; color: #666; font-size: 14px; vertical-align: top;">💰 Valor</td>
                  <td style="padding: 12px 0; color: #222; font-size: 18px; font-weight: 700; vertical-align: top;">R$ ${formattedPrice}</td>
                </tr>
              </table>
            </div>
            
            <!-- Reminder Notice -->
            <div style="background: #e8f5e9; border: 1px solid #a5d6a7; padding: 18px 20px; border-radius: 10px; margin: 25px 0;">
              <p style="margin: 0; color: #2e7d32; font-size: 14px; line-height: 1.5;">
                ${reminderText}
              </p>
            </div>
            
            <!-- Important Notice -->
            <div style="background: #fff8e1; border: 1px solid #ffe082; padding: 18px 20px; border-radius: 10px; margin: 25px 0;">
              <p style="margin: 0; color: #f57c00; font-size: 14px; line-height: 1.5;">
                ⚠️ <strong>Importante:</strong> Chegue com 10 minutos de antecedência. Pontualidade é estilo! 😎
              </p>
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; margin-top: 35px; padding-top: 25px; border-top: 1px solid #eee;">
              <p style="color: #888; margin: 0 0 8px 0; font-size: 13px;">📞 Dúvidas? Entre em contato conosco!</p>
              <p style="color: #D4A574; font-weight: 600; font-size: 17px; margin: 15px 0;">
                Nos vemos em breve! ✂️
              </p>
              <p style="color: #aaa; font-size: 11px; margin: 20px 0 0 0;">
                © Barbearia Costa Urbana
              </p>
            </div>
          </div>
        </div>
      `,
    });

    console.log(`Email confirmation sent successfully to: ${clientEmail}`);

    return new Response(JSON.stringify({ 
      message: "Email sent successfully",
      emailId: emailResponse.id
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending confirmation email:", error);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        details: error.message 
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);
