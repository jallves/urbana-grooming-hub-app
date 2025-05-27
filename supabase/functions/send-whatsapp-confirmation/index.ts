
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WhatsAppConfirmationRequest {
  clientName: string;
  clientPhone: string;
  serviceName: string;
  staffName: string;
  appointmentDate: string;
  appointmentTime: string;
  servicePrice: string;
  serviceDuration: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      clientName,
      clientPhone,
      serviceName,
      staffName,
      appointmentDate,
      appointmentTime,
      servicePrice,
      serviceDuration
    }: WhatsAppConfirmationRequest = await req.json();

    // Limpar o número de telefone (remover caracteres especiais)
    const cleanPhone = clientPhone.replace(/[^\d]/g, '');
    
    // Adicionar código do país se não estiver presente (assumindo Brasil +55)
    const phoneWithCountry = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

    // Criar mensagem de confirmação
    const message = `🎉 *Agendamento Confirmado na Urbana Barbearia!*

Olá ${clientName}! Seu horário está marcado:

📅 *Data:* ${appointmentDate}
🕒 *Horário:* ${appointmentTime}
✂️ *Serviço:* ${serviceName}
👨‍💼 *Profissional:* ${staffName}
⏱️ *Duração:* ${serviceDuration} minutos
💰 *Valor:* R$ ${servicePrice}

⚠️ *Importante:* Chegue com 10 minutos de antecedência. Pontualidade é estilo! 😎

📞 Dúvidas? Entre em contato conosco!

Nos vemos em breve! 🔥
*Urbana Barbearia - Onde o estilo encontra a tradição*`;

    // Codificar a mensagem para URL
    const encodedMessage = encodeURIComponent(message);
    
    // Criar URL do WhatsApp
    const whatsappUrl = `https://wa.me/${phoneWithCountry}?text=${encodedMessage}`;

    console.log("WhatsApp confirmation created for:", clientName, "Phone:", phoneWithCountry);

    return new Response(JSON.stringify({ 
      success: true, 
      whatsappUrl,
      message: "Link do WhatsApp criado com sucesso"
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-whatsapp-confirmation function:", error);
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
