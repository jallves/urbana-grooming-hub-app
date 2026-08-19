import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { isEmail } from "https://deno.land/x/isemail@v1.0.1/mod.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-totem-token",
};

interface AppointmentUpdateEmailRequest {
  clientName: string;
  clientEmail: string;
  serviceName: string;
  staffName: string;
  appointmentDate: string;
  appointmentTime: string;
  servicePrice: number | string;
  serviceDuration: string;
  // Campos opcionais para mostrar o que mudou
  previousDate?: string;
  previousTime?: string;
  previousStaffName?: string;
  previousServiceName?: string;
  updateType: 'reschedule' | 'change_barber' | 'change_service' | 'general';
  updatedBy: 'client' | 'admin' | 'barber';
}

const validateRequestBody = (body: any): body is AppointmentUpdateEmailRequest => {
  const requiredFields = [
    'clientName',
    'clientEmail',
    'serviceName',
    'staffName',
    'appointmentDate',
    'appointmentTime',
    'servicePrice',
    'serviceDuration',
    'updateType',
    'updatedBy'
  ];

  return requiredFields.every(field => 
    body[field] !== undefined && 
    body[field] !== null && 
    body[field] !== ''
  );
};

const getUpdateMessage = (updateType: string, updatedBy: string): string => {
  const byText = updatedBy === 'client' ? 'Você alterou' : 
                 updatedBy === 'admin' ? 'Nosso administrador alterou' : 
                 'Seu barbeiro alterou';
  
  switch(updateType) {
    case 'reschedule':
      return `${byText} a data/horário do seu agendamento.`;
    case 'change_barber':
      return `${byText} o profissional do seu agendamento.`;
    case 'change_service':
      return `${byText} o serviço do seu agendamento.`;
    default:
      return `${byText} as informações do seu agendamento.`;
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
    
    console.log('📧 [UpdateEmail] Recebendo requisição:', JSON.stringify(body, null, 2));

    if (!validateRequestBody(body)) {
      console.error('❌ [UpdateEmail] Campos obrigatórios faltando');
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
      serviceDuration,
      previousDate,
      previousTime,
      previousStaffName,
      previousServiceName,
      updateType,
      updatedBy
    } = body;

    if (!isEmail(clientEmail)) {
      console.error('❌ [UpdateEmail] E-mail inválido:', clientEmail);
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

    // Formatar data anterior se houver
    let formattedPreviousDate = '';
    if (previousDate) {
      const [pYear, pMonth, pDay] = previousDate.split('-');
      formattedPreviousDate = `${pDay}/${pMonth}/${pYear}`;
    }

    const logoUrl = 'https://barbeariacostaurbana.com.br/images/logo-barbearia-costa-urbana.png';
    const updateMessage = getUpdateMessage(updateType, updatedBy);

    console.log('📧 [UpdateEmail] Enviando e-mail de atualização para:', clientEmail);
    console.log('📧 [UpdateEmail] Tipo:', updateType, 'Por:', updatedBy);

    // Criar seção de "O que mudou"
    let changesHtml = '';
    if (previousDate || previousTime || previousStaffName || previousServiceName) {
      changesHtml = `
        <div style="background: #fff3e0; border: 1px solid #ffcc80; padding: 18px 20px; border-radius: 10px; margin: 25px 0;">
          <p style="margin: 0 0 12px 0; color: #e65100; font-weight: 600; font-size: 14px;">📝 O que mudou:</p>
          <table style="width: 100%; border-collapse: collapse;" cellpadding="0" cellspacing="0">
            ${previousDate && previousDate !== appointmentDate ? `
              <tr>
                <td style="padding: 6px 0; color: #666; font-size: 13px;">Data:</td>
                <td style="padding: 6px 0; color: #999; font-size: 13px; text-decoration: line-through;">${formattedPreviousDate}</td>
                <td style="padding: 6px 0; color: #333; font-size: 13px;">→ ${formattedDate}</td>
              </tr>
            ` : ''}
            ${previousTime && previousTime !== appointmentTime ? `
              <tr>
                <td style="padding: 6px 0; color: #666; font-size: 13px;">Horário:</td>
                <td style="padding: 6px 0; color: #999; font-size: 13px; text-decoration: line-through;">${previousTime}</td>
                <td style="padding: 6px 0; color: #333; font-size: 13px;">→ ${appointmentTime}</td>
              </tr>
            ` : ''}
            ${previousStaffName && previousStaffName !== staffName ? `
              <tr>
                <td style="padding: 6px 0; color: #666; font-size: 13px;">Profissional:</td>
                <td style="padding: 6px 0; color: #999; font-size: 13px; text-decoration: line-through;">${previousStaffName}</td>
                <td style="padding: 6px 0; color: #333; font-size: 13px;">→ ${staffName}</td>
              </tr>
            ` : ''}
            ${previousServiceName && previousServiceName !== serviceName ? `
              <tr>
                <td style="padding: 6px 0; color: #666; font-size: 13px;">Serviço:</td>
                <td style="padding: 6px 0; color: #999; font-size: 13px; text-decoration: line-through;">${previousServiceName}</td>
                <td style="padding: 6px 0; color: #333; font-size: 13px;">→ ${serviceName}</td>
              </tr>
            ` : ''}
          </table>
        </div>
      `;
    }

    const emailResponse = await resend.emails.send({
      from: "Barbearia Costa Urbana <noreply@barbeariacostaurbana.com.br>",
      to: [clientEmail],
      subject: "🔄 Agendamento Atualizado - Barbearia Costa Urbana",
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f5f5;">
          <!-- Header -->
          <div style="text-align: center; background: linear-gradient(135deg, #1a1a2e, #16213e); color: white; padding: 40px 30px; border-radius: 12px 12px 0 0;">
            <img src="${logoUrl}" alt="Barbearia Costa Urbana" style="width: 90px; height: 90px; border-radius: 50%; margin-bottom: 20px; border: 3px solid #D4A574; object-fit: cover;" />
            <h1 style="margin: 0; font-size: 26px; color: #4FC3F7; letter-spacing: 1px;">Agendamento Atualizado!</h1>
            <p style="margin: 10px 0 0; font-size: 14px; color: #ccc;">Barbearia Costa Urbana</p>
          </div>
          
          <!-- Content -->
          <div style="background: white; padding: 35px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.08);">
            <p style="font-size: 18px; color: #333; margin: 0 0 15px 0; line-height: 1.6;">
              Olá, <strong style="color: #D4A574;">${clientName}</strong>! 👋
            </p>
            <p style="font-size: 15px; color: #666; margin: 0 0 25px 0; line-height: 1.6;">
              ${updateMessage}
            </p>
            
            ${changesHtml}
            
            <!-- New Appointment Details -->
            <div style="background: linear-gradient(135deg, #e8f5e9, #c8e6c9); padding: 25px; border-radius: 10px; border-left: 5px solid #4CAF50; margin: 25px 0;">
              <p style="margin: 0 0 15px 0; color: #2e7d32; font-weight: 600; font-size: 15px;">✅ Novo Horário Confirmado:</p>
              <table style="width: 100%; border-collapse: collapse;" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 10px 0; color: #666; font-size: 14px; vertical-align: top; width: 130px;">📅 Data</td>
                  <td style="padding: 10px 0; color: #222; font-size: 16px; font-weight: 600; vertical-align: top;">${formattedDate}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #666; font-size: 14px; vertical-align: top;">🕒 Horário</td>
                  <td style="padding: 10px 0; color: #4CAF50; font-size: 22px; font-weight: 700; vertical-align: top;">${appointmentTime}</td>
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
                  <td style="padding: 10px 0; color: #666; font-size: 14px; vertical-align: top;">⏱️ Duração</td>
                  <td style="padding: 10px 0; color: #222; font-size: 15px; vertical-align: top;">${serviceDuration} minutos</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #666; font-size: 14px; vertical-align: top;">💰 Valor</td>
                  <td style="padding: 10px 0; color: #222; font-size: 18px; font-weight: 700; vertical-align: top;">R$ ${formattedPrice}</td>
                </tr>
              </table>
            </div>
            
            <!-- Important Notice -->
            <div style="background: #fff8e1; border: 1px solid #ffe082; padding: 18px 20px; border-radius: 10px; margin: 25px 0;">
              <p style="margin: 0; color: #f57c00; font-size: 14px; line-height: 1.5;">
                ⚠️ <strong>Lembre-se:</strong> Chegue com 10 minutos de antecedência. Pontualidade é estilo! 😎
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

    console.log('✅ [UpdateEmail] E-mail enviado com sucesso:', emailResponse.id);

    return new Response(JSON.stringify({ 
      message: "Email sent successfully",
      emailId: emailResponse.id
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("❌ [UpdateEmail] Erro ao enviar e-mail:", error);
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
