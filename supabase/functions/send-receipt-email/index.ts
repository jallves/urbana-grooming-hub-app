import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReceiptItem {
  name: string;
  quantity?: number;
  price: number;
  type?: 'service' | 'product';
}

interface ReceiptEmailRequest {
  clientName: string;
  clientEmail: string;
  transactionType: 'service' | 'product' | 'mixed';
  items: ReceiptItem[];
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
    const title = 'Comprovante de Pagamento';
    
    // URL da logo hospedada publicamente
    const logoUrl = 'https://barbeariacostaurbana.com.br/images/logo-barbearia-costa-urbana.png';

    const paymentMethodText = {
      'credit': 'Cartão de Crédito',
      'debit': 'Cartão de Débito',
      'pix': 'PIX',
      'cash': 'Dinheiro'
    }[paymentMethod] || paymentMethod;

    // Separar itens por tipo usando o campo type explícito
    // IMPORTANTE: Agora confiamos no campo 'type' que vem do frontend
    const services = items.filter(item => item.type === 'service');
    const products = items.filter(item => item.type === 'product');
    
    // Se nenhum item tem type definido, usar fallback baseado no transactionType
    const untyped = items.filter(item => !item.type);
    if (untyped.length > 0) {
      if (transactionType === 'product') {
        products.push(...untyped);
      } else {
        services.push(...untyped);
      }
    }
    
    console.log(`📧 Email: ${services.length} serviços, ${products.length} produtos`);

    // Calcular subtotais
    const servicesSubtotal = services.reduce((sum, item) => sum + item.price, 0);
    const productsSubtotal = products.reduce((sum, item) => sum + item.price, 0);

    // Gerar HTML dos serviços
    const servicesHtml = services.map(item => `
      <tr>
        <td style="padding: 12px 15px; border-bottom: 1px solid #eee; color: #333; font-size: 14px;">
          ${item.name}
        </td>
        <td style="padding: 12px 15px; border-bottom: 1px solid #eee; color: #333; text-align: right; font-size: 14px; white-space: nowrap; font-weight: 500;">
          R$ ${item.price.toFixed(2).replace('.', ',')}
        </td>
      </tr>
    `).join('');

    // Gerar HTML dos produtos
    const productsHtml = products.map(item => `
      <tr>
        <td style="padding: 12px 15px; border-bottom: 1px solid #eee; color: #333; font-size: 14px;">
          ${item.name} ${item.quantity && item.quantity > 1 ? `<span style="color: #888; font-weight: normal;">(${item.quantity}x)</span>` : ''}
        </td>
        <td style="padding: 12px 15px; border-bottom: 1px solid #eee; color: #333; text-align: right; font-size: 14px; white-space: nowrap; font-weight: 500;">
          R$ ${item.price.toFixed(2).replace('.', ',')}
        </td>
      </tr>
    `).join('');

    // Verificar o que tem
    const hasServices = services.length > 0;
    const hasProducts = products.length > 0;

    const emailResponse = await resend.emails.send({
      from: "Barbearia Costa Urbana <noreply@barbeariacostaurbana.com.br>",
      to: [clientEmail],
      subject: `✂️ ${title} - Barbearia Costa Urbana`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
          <div style="text-align: center; background: linear-gradient(135deg, #1a1a2e, #16213e); color: white; padding: 30px; border-radius: 12px 12px 0 0;">
            <img src="${logoUrl}" alt="Barbearia Costa Urbana" style="width: 100px; height: 100px; border-radius: 50%; margin-bottom: 15px; border: 3px solid #D4A574;" />
            <h1 style="margin: 0; font-size: 24px; color: #D4A574; letter-spacing: 1px;">✂️ ${title}</h1>
            <p style="margin: 10px 0 0; font-size: 14px; color: #ccc;">Barbearia Costa Urbana</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
            <p style="font-size: 16px; color: #333; margin-bottom: 25px;">
              Olá <strong style="color: #1a1a2e;">${clientName}</strong>! Segue o comprovante da sua visita:
            </p>
            
            <!-- INFORMAÇÕES DA TRANSAÇÃO -->
            <div style="background: linear-gradient(135deg, #f9f9f9, #f0f0f0); padding: 20px; border-radius: 10px; border-left: 4px solid #D4A574; margin-bottom: 25px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; color: #666; font-weight: 600; width: 140px; vertical-align: top;">📅 Data:</td>
                  <td style="padding: 10px 0; color: #333; font-weight: 500;">${transactionDate}</td>
                </tr>
                ${barberName ? `
                <tr>
                  <td style="padding: 10px 0; color: #666; font-weight: 600; width: 140px; vertical-align: top;">👨‍💼 Profissional:</td>
                  <td style="padding: 10px 0; color: #333; font-weight: 500;">${barberName}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 10px 0; color: #666; font-weight: 600; width: 140px; vertical-align: top;">💳 Pagamento:</td>
                  <td style="padding: 10px 0; color: #333; font-weight: 500;">${paymentMethodText}</td>
                </tr>
                ${nsu ? `
                <tr>
                  <td style="padding: 10px 0; color: #666; font-weight: 600; width: 140px; vertical-align: top;">🔢 NSU:</td>
                  <td style="padding: 10px 0; color: #333; font-weight: 500;">${nsu}</td>
                </tr>
                ` : ''}
              </table>
            </div>

            ${hasServices ? `
            <!-- SERVIÇOS -->
            <div style="margin-bottom: 25px;">
              <h3 style="color: #1a1a2e; margin: 0 0 15px; padding-bottom: 10px; font-size: 16px; border-bottom: 2px solid #D4A574; display: flex; align-items: center;">
                ✂️ SERVIÇOS
              </h3>
              
              <table style="width: 100%; border-collapse: collapse; background: #fafafa; border-radius: 8px; overflow: hidden;">
                <thead>
                  <tr style="background: linear-gradient(135deg, #e8e8e8, #f0f0f0);">
                    <th style="padding: 12px 15px; text-align: left; color: #555; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Descrição</th>
                    <th style="padding: 12px 15px; text-align: right; color: #555; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  ${servicesHtml}
                </tbody>
                <tfoot>
                  <tr style="background: #f5f5f5;">
                    <td style="padding: 12px 15px; color: #666; font-weight: 600; font-size: 13px;">Subtotal Serviços</td>
                    <td style="padding: 12px 15px; color: #333; text-align: right; font-weight: 600; font-size: 14px;">R$ ${servicesSubtotal.toFixed(2).replace('.', ',')}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            ` : ''}

            ${hasProducts ? `
            <!-- PRODUTOS -->
            <div style="margin-bottom: 25px;">
              <h3 style="color: #1a1a2e; margin: 0 0 15px; padding-bottom: 10px; font-size: 16px; border-bottom: 2px solid #D4A574; display: flex; align-items: center;">
                🛍️ PRODUTOS
              </h3>
              
              <table style="width: 100%; border-collapse: collapse; background: #fafafa; border-radius: 8px; overflow: hidden;">
                <thead>
                  <tr style="background: linear-gradient(135deg, #e8e8e8, #f0f0f0);">
                    <th style="padding: 12px 15px; text-align: left; color: #555; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Descrição</th>
                    <th style="padding: 12px 15px; text-align: right; color: #555; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  ${productsHtml}
                </tbody>
                <tfoot>
                  <tr style="background: #f5f5f5;">
                    <td style="padding: 12px 15px; color: #666; font-weight: 600; font-size: 13px;">Subtotal Produtos</td>
                    <td style="padding: 12px 15px; color: #333; text-align: right; font-weight: 600; font-size: 14px;">R$ ${productsSubtotal.toFixed(2).replace('.', ',')}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            ` : ''}

            <!-- TOTAL GERAL -->
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <tr style="background: linear-gradient(135deg, #1a1a2e, #16213e);">
                <td style="padding: 18px 20px; color: white; font-weight: 700; font-size: 18px; letter-spacing: 1px;">
                  TOTAL
                </td>
                <td style="padding: 18px 20px; color: #D4A574; font-weight: 800; font-size: 24px; text-align: right; letter-spacing: 0.5px;">
                  R$ ${formattedTotal}
                </td>
              </tr>
            </table>

            <div style="text-align: center; margin-top: 35px; padding-top: 25px; border-top: 1px solid #eee;">
              <p style="color: #666; margin: 5px 0; font-size: 15px;">
                Obrigado pela preferência! 🙏
              </p>
              <p style="color: #D4A574; font-weight: bold; font-size: 18px; margin: 15px 0;">
                Barbearia Costa Urbana ✂️
              </p>
              <p style="color: #999; font-size: 12px; font-style: italic; margin-top: 15px;">
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
