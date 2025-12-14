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
  transactionType: 'service' | 'product';
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

    // Separar itens por tipo (serviços e produtos)
    const services = items.filter((item, index) => index === 0 || !item.quantity || item.quantity === 1);
    const products = items.filter(item => item.quantity && item.quantity > 0 && items.indexOf(item) > 0);
    
    // Calcular subtotais
    const servicesSubtotal = items.reduce((sum, item) => {
      // Primeiro item é sempre o serviço principal
      const isProduct = item.quantity && item.quantity > 0 && items.indexOf(item) > 0;
      return isProduct ? sum : sum + item.price;
    }, 0);
    
    const productsSubtotal = items.reduce((sum, item) => {
      const isProduct = item.quantity && item.quantity > 0 && items.indexOf(item) > 0;
      return isProduct ? sum + item.price : sum;
    }, 0);

    // Gerar HTML dos itens de serviço
    const servicesHtml = items
      .filter((item, index) => {
        const isProduct = item.quantity && item.quantity > 1;
        return !isProduct || index === 0;
      })
      .map(item => `
        <tr>
          <td style="padding: 10px 12px; border-bottom: 1px solid #eee; color: #333; font-size: 14px;">
            ${item.name}
          </td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #eee; color: #333; text-align: right; font-size: 14px; white-space: nowrap;">
            R$ ${item.price.toFixed(2).replace('.', ',')}
          </td>
        </tr>
      `).join('');

    // Gerar HTML dos produtos (se houver)
    const productsHtml = items
      .filter(item => item.quantity && item.quantity > 0 && items.indexOf(item) > 0)
      .map(item => `
        <tr>
          <td style="padding: 10px 12px; border-bottom: 1px solid #eee; color: #333; font-size: 14px;">
            ${item.name} ${item.quantity && item.quantity > 1 ? `<span style="color: #666;">(${item.quantity}x)</span>` : ''}
          </td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #eee; color: #333; text-align: right; font-size: 14px; white-space: nowrap;">
            R$ ${item.price.toFixed(2).replace('.', ',')}
          </td>
        </tr>
      `).join('');

    // Verificar se tem produtos
    const hasProducts = productsHtml.length > 0;

    const emailResponse = await resend.emails.send({
      from: "Barbearia Costa Urbana <noreply@barbeariacostaurbana.com.br>",
      to: [clientEmail],
      subject: `✂️ ${title} - Barbearia Costa Urbana`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
          <div style="text-align: center; background: linear-gradient(135deg, #1a1a2e, #16213e); color: white; padding: 30px; border-radius: 10px 10px 0 0;">
            <img src="${logoUrl}" alt="Barbearia Costa Urbana" style="width: 120px; height: 120px; border-radius: 50%; margin-bottom: 15px; border: 3px solid #D4A574;" />
            <h1 style="margin: 0; font-size: 22px; color: #D4A574;">✂️ ${title}</h1>
            <p style="margin: 8px 0 0; font-size: 14px; color: #ccc;">Barbearia Costa Urbana</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
              Olá <strong>${clientName}</strong>! Segue o comprovante da sua visita:
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

            <!-- SERVIÇOS -->
            <h3 style="color: #1a1a2e; margin: 20px 0 10px; border-bottom: 2px solid #D4A574; padding-bottom: 10px; font-size: 16px;">
              ✂️ SERVIÇOS
            </h3>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <thead>
                <tr style="background: #f0f0f0;">
                  <th style="padding: 10px 12px; text-align: left; color: #333; font-size: 12px; font-weight: bold; text-transform: uppercase;">Descrição</th>
                  <th style="padding: 10px 12px; text-align: right; color: #333; font-size: 12px; font-weight: bold; text-transform: uppercase;">Valor</th>
                </tr>
              </thead>
              <tbody>
                ${servicesHtml}
              </tbody>
            </table>

            ${hasProducts ? `
            <!-- PRODUTOS -->
            <h3 style="color: #1a1a2e; margin: 20px 0 10px; border-bottom: 2px solid #D4A574; padding-bottom: 10px; font-size: 16px;">
              🛍️ PRODUTOS
            </h3>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <thead>
                <tr style="background: #f0f0f0;">
                  <th style="padding: 10px 12px; text-align: left; color: #333; font-size: 12px; font-weight: bold; text-transform: uppercase;">Descrição</th>
                  <th style="padding: 10px 12px; text-align: right; color: #333; font-size: 12px; font-weight: bold; text-transform: uppercase;">Valor</th>
                </tr>
              </thead>
              <tbody>
                ${productsHtml}
              </tbody>
            </table>
            ` : ''}

            <!-- TOTAL -->
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
              <tr style="background: linear-gradient(135deg, #1a1a2e, #16213e);">
                <td style="padding: 15px; color: white; font-weight: bold; font-size: 16px; border-radius: 6px 0 0 6px;">
                  TOTAL
                </td>
                <td style="padding: 15px; color: #D4A574; font-weight: bold; font-size: 20px; text-align: right; border-radius: 0 6px 6px 0;">
                  R$ ${formattedTotal}
                </td>
              </tr>
            </table>

            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #666; margin: 5px 0; font-size: 14px;">
                Obrigado pela preferência! 🙏
              </p>
              <p style="color: #D4A574; font-weight: bold; font-size: 16px; margin: 15px 0;">
                Barbearia Costa Urbana ✂️
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
