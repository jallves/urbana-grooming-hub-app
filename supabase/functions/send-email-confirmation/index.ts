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
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f5f5;">
          <!-- Header -->
          <div style="text-align: center; background: linear-gradient(135deg, #1a1a2e, #16213e); color: white; padding: 40px 30px; border-radius: 12px 12px 0 0;">
            <img src="${logoUrl}" alt="Barbearia Costa Urbana" style="width: 90px; height: 90px; border-radius: 50%; margin-bottom: 20px; border: 3px solid #D4A574; object-fit: cover;" />
            <h1 style="margin: 0; font-size: 26px; color: #D4A574; letter-spacing: 1px; font-weight: 700;">Agendamento Confirmado!</h1>
            <p style="margin: 10px 0 0; font-size: 15px; color: #ffffff; font-weight: 500;">Barbearia Costa Urbana</p>
          </div>
          
          <!-- Content -->
          <div style="background: #ffffff; padding: 35px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.08);">
            <p style="font-size: 18px; color: #1a1a1a; margin: 0 0 25px 0; line-height: 1.6; font-weight: 500;">
              Olá, <strong style="color: #C4956A;">${clientName}</strong>! 👋<br/>
              <span style="color: #333333; font-weight: 400;">Seu horário está garantido!</span>
            </p>
            
            <!-- Appointment Details Box -->
            <div style="background: #f8f8f8; padding: 25px; border-radius: 10px; border-left: 5px solid #C4956A; margin: 25px 0;">
              <table style="width: 100%; border-collapse: collapse;" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 12px 0; color: #444444; font-size: 14px; font-weight: 600; vertical-align: top; width: 130px;">📅 Data</td>
                  <td style="padding: 12px 0; color: #1a1a1a; font-size: 16px; font-weight: 700; vertical-align: top;">${formattedDate}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; color: #444444; font-size: 14px; font-weight: 600; vertical-align: top;">🕒 Horário</td>
                  <td style="padding: 12px 0; color: #B8864A; font-size: 22px; font-weight: 800; vertical-align: top;">${appointmentTime}</td>
                </tr>
                <tr>
                  <td colspan="2" style="padding: 8px 0;"><hr style="border: none; border-top: 1px solid #d0d0d0; margin: 0;"/></td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; color: #444444; font-size: 14px; font-weight: 600; vertical-align: top;">✂️ Serviço</td>
                  <td style="padding: 12px 0; color: #1a1a1a; font-size: 15px; font-weight: 600; vertical-align: top;">${serviceName}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; color: #444444; font-size: 14px; font-weight: 600; vertical-align: top;">👨‍💼 Profissional</td>
                  <td style="padding: 12px 0; color: #1a1a1a; font-size: 15px; font-weight: 600; vertical-align: top;">${staffName}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; color: #444444; font-size: 14px; font-weight: 600; vertical-align: top;">⏱️ Duração</td>
                  <td style="padding: 12px 0; color: #1a1a1a; font-size: 15px; font-weight: 500; vertical-align: top;">${serviceDuration} minutos</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; color: #444444; font-size: 14px; font-weight: 600; vertical-align: top;">💰 Valor</td>
                  <td style="padding: 12px 0; color: #1a1a1a; font-size: 18px; font-weight: 800; vertical-align: top;">R$ ${formattedPrice}</td>
                </tr>
              </table>
            </div>
            
            <!-- Reminder Notice -->
            <div style="background: #d4edda; border: 2px solid #28a745; padding: 18px 20px; border-radius: 10px; margin: 25px 0;">
              <p style="margin: 0; color: #155724; font-size: 15px; line-height: 1.5; font-weight: 600;">
                ${reminderText}
              </p>
            </div>
            
            <!-- Important Notice -->
            <div style="background: #fff3cd; border: 2px solid #e0a800; padding: 18px 20px; border-radius: 10px; margin: 25px 0;">
              <p style="margin: 0; color: #856404; font-size: 15px; line-height: 1.5; font-weight: 600;">
                ⚠️ <strong>Importante:</strong> Chegue com 10 minutos de antecedência. Pontualidade é estilo! 😎
              </p>
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; margin-top: 35px; padding-top: 25px; border-top: 2px solid #e0e0e0;">
              <p style="color: #444444; margin: 0 0 8px 0; font-size: 14px; font-weight: 500;">📞 Dúvidas? Entre em contato conosco!</p>
              <p style="color: #B8864A; font-weight: 700; font-size: 18px; margin: 15px 0;">
                Nos vemos em breve! ✂️
              </p>
              <p style="color: #666666; font-size: 12px; margin: 20px 0 0 0; font-weight: 500;">
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
