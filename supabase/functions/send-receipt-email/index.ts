import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReceiptEmailRequest {
  clientName: string;
  clientEmail: string;
  transactionType: 'service' | 'product';
  items: Array<{
    name: string;
    quantity?: number;
    price: number;
  }>;
  total: number;
  paymentMethod: string;
  transactionDate: string;
  nsu?: string;
  barberName?: string;
}

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
      { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  try {
    const body: ReceiptEmailRequest = await req.json();
    
    console.log("Received receipt email request:", JSON.stringify(body, null, 2));

    const { 
      clientName,
      clientEmail,
      transactionType,
      items,
      total,
      paymentMethod,
      transactionDate,
      nsu,
      barberName
    } = body;

    if (!clientName || !clientEmail || !items || !total || !paymentMethod) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const formattedTotal = total.toFixed(2).replace('.', ',');
    const isService = transactionType === 'service';
    const title = isService ? 'Comprovante de Serviço' : 'Comprovante de Compra';
    const emoji = isService ? '✂️' : '🛍️';

    const paymentMethodText = {
      'credit': 'Cartão de Crédito',
      'debit': 'Cartão de Débito',
      'pix': 'PIX',
      'cash': 'Dinheiro'
    }[paymentMethod] || paymentMethod;

    const itemsHtml = items.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee; color: #333;">
          ${item.name}${item.quantity && item.quantity > 1 ? ` (x${item.quantity})` : ''}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; color: #333; text-align: right;">
          R$ ${item.price.toFixed(2).replace('.', ',')}
        </td>
      </tr>
    `).join('');

    const emailResponse = await resend.emails.send({
      from: "Costa Urbana Barbearia <onboarding@resend.dev>",
      to: [clientEmail],
      subject: `${emoji} ${title} - Costa Urbana Barbearia`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
          <div style="text-align: center; background: linear-gradient(135deg, #1a1a2e, #16213e); color: white; padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 24px; color: #D4A574;">${emoji} ${title}</h1>
            <p style="margin: 10px 0 0; font-size: 14px; color: #ccc;">Costa Urbana Barbearia</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
              Olá <strong>${clientName}</strong>! Segue o comprovante da sua ${isService ? 'visita' : 'compra'}:
            </p>
            
            <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; border-left: 4px solid #D4A574; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">📅 Data:</td>
                  <td style="padding: 8px 0; color: #333;">${transactionDate}</td>
                </tr>
                ${barberName ? `
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">👨‍💼 Profissional:</td>
                  <td style="padding: 8px 0; color: #333;">${barberName}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">💳 Pagamento:</td>
                  <td style="padding: 8px 0; color: #333;">${paymentMethodText}</td>
                </tr>
                ${nsu ? `
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">🔢 NSU:</td>
                  <td style="padding: 8px 0; color: #333;">${nsu}</td>
                </tr>
                ` : ''}
              </table>
            </div>

            <h3 style="color: #1a1a2e; margin: 20px 0 10px; border-bottom: 2px solid #D4A574; padding-bottom: 10px;">
              ${isService ? '📋 Serviços' : '📦 Produtos'}
            </h3>
            
            <table style="width: 100%; border-collapse: collapse;">
              ${itemsHtml}
              <tr style="background: #1a1a2e;">
                <td style="padding: 15px; color: white; font-weight: bold; font-size: 16px;">TOTAL</td>
                <td style="padding: 15px; color: #D4A574; font-weight: bold; font-size: 18px; text-align: right;">
                  R$ ${formattedTotal}
                </td>
              </tr>
            </table>

            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #666; margin: 5px 0; font-size: 14px;">
                Obrigado pela preferência! 🙏
              </p>
              <p style="color: #D4A574; font-weight: bold; font-size: 16px; margin: 15px 0;">
                Costa Urbana Barbearia ✂️
              </p>
              <p style="color: #999; font-size: 12px; font-style: italic;">
                Este é um comprovante eletrônico gerado automaticamente.
              </p>
            </div>
          </div>
        </div>
      `,
    });

    console.log(`Receipt email sent successfully to: ${clientEmail}, ID: ${emailResponse.id}`);

    return new Response(JSON.stringify({ 
      message: "Receipt email sent successfully",
      emailId: emailResponse.id
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending receipt email:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
