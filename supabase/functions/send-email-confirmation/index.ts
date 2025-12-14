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
  servicePrice: number;
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

    // Formatação do preço
    const formattedPrice = servicePrice.toFixed(2).replace('.', ',');

    const emailResponse = await resend.emails.send({
      from: "Costa Urbana Barbearia <noreply@barbeariacostaurbana.com.br>",
      to: [clientEmail],
      subject: "🎉 Agendamento Confirmado - Costa Urbana Barbearia",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; background: linear-gradient(135deg, #1a1a2e, #16213e); color: white; padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px; color: #D4A574;">🎉 Agendamento Confirmado!</h1>
            <p style="margin: 10px 0 0; font-size: 16px;">Costa Urbana Barbearia</p>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 18px; color: #333; margin-bottom: 20px;">
              Olá <strong>${clientName}</strong>! Seu horário está marcado:
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #D4A574; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #555; font-weight: bold;">📅 Data:</td>
                  <td style="padding: 8px 0; color: #333;">${appointmentDate}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #555; font-weight: bold;">🕒 Horário:</td>
                  <td style="padding: 8px 0; color: #333;">${appointmentTime}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #555; font-weight: bold;">✂️ Serviço:</td>
                  <td style="padding: 8px 0; color: #333;">${serviceName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #555; font-weight: bold;">👨‍💼 Profissional:</td>
                  <td style="padding: 8px 0; color: #333;">${staffName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #555; font-weight: bold;">⏱️ Duração:</td>
                  <td style="padding: 8px 0; color: #333;">${serviceDuration} minutos</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #555; font-weight: bold;">💰 Valor:</td>
                  <td style="padding: 8px 0; color: #333;">R$ ${formattedPrice}</td>
                </tr>
              </table>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #856404; font-weight: bold;">
                ⚠️ <strong>Importante:</strong> Chegue com 10 minutos de antecedência. Pontualidade é estilo! 😎
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #666; margin: 5px 0;">📞 Dúvidas? Entre em contato conosco!</p>
              <p style="color: #D4A574; font-weight: bold; font-size: 18px; margin: 15px 0;">
                Nos vemos em breve! 🔥
              </p>
              <p style="color: #888; font-style: italic;">
                Costa Urbana Barbearia ✂️
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
