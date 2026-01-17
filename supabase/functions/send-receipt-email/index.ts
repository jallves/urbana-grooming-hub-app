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
  unitPrice?: number;
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
  tipAmount?: number;
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
      barberName,
      tipAmount
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

    // Calcular subtotais (apenas dos itens, gorjeta é separada)
    const servicesSubtotal = services.reduce((sum, item) => sum + item.price, 0);
    const productsSubtotal = products.reduce((sum, item) => sum + item.price, 0);
    const tipValue = Number(tipAmount || 0);

    // Gerar HTML dos serviços (formato mobile-first em lista)
    const servicesHtml = services.map(item => {
      const qty = item.quantity || 1;
      const unitPrice = item.unitPrice ?? (item.price / qty);
      const subtotal = item.price;
      return `
      <div style="background: #fff; border: 1px solid #e5e5e5; border-radius: 8px; padding: 14px; margin-bottom: 10px;">
        <div style="margin-bottom: 8px;">
          <span style="color: #333; font-weight: 600; font-size: 14px;">✂️ ${item.name}</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="color: #888; font-size: 13px;">${qty} un. × R$ ${unitPrice.toFixed(2).replace('.', ',')}</span>
          <span style="color: #1a1a2e; font-weight: 700; font-size: 16px; margin-left: 20px;">R$ ${subtotal.toFixed(2).replace('.', ',')}</span>
        </div>
      </div>
    `
    }).join('');

    // Função para determinar emoji baseado no nome do produto
    const getProductEmoji = (productName: string): string => {
      const name = productName.toLowerCase();
      if (name.includes('pomada') || name.includes('cera')) return '🫙';
      if (name.includes('shampoo') || name.includes('xampu')) return '🧴';
      if (name.includes('óleo') || name.includes('oleo')) return '💧';
      if (name.includes('balm') || name.includes('bálsamo')) return '✨';
      if (name.includes('condicionador')) return '🧴';
      if (name.includes('gel')) return '💈';
      if (name.includes('creme')) return '🧴';
      if (name.includes('toalha')) return '🧣';
      if (name.includes('pente') || name.includes('escova')) return '🪥';
      if (name.includes('navalha') || name.includes('gilete')) return '🪒';
      if (name.includes('tesoura')) return '✂️';
      if (name.includes('perfume') || name.includes('colônia') || name.includes('colonia')) return '🌸';
      if (name.includes('desodorante')) return '🧊';
      if (name.includes('loção') || name.includes('locao')) return '🧴';
      return '📦'; // emoji padrão para produtos não identificados
    };

    // Gerar HTML dos produtos (formato mobile-first em lista)
    const productsHtml = products.map(item => {
      const qty = item.quantity || 1;
      const unitPrice = item.unitPrice || (item.price / qty);
      const subtotal = item.price || (unitPrice * qty);
      const emoji = getProductEmoji(item.name);
      
      console.log(`📦 Produto: ${item.name}, Qtd: ${qty}, Unit: ${unitPrice}, Total: ${subtotal}, Emoji: ${emoji}`);
      
      return `
      <div style="background: #fff; border: 1px solid #e5e5e5; border-radius: 8px; padding: 14px; margin-bottom: 10px;">
        <div style="margin-bottom: 8px;">
          <span style="color: #333; font-weight: 600; font-size: 14px;">${emoji} ${item.name}</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="color: #888; font-size: 13px;">${qty} un. × R$ ${unitPrice.toFixed(2).replace('.', ',')}</span>
          <span style="color: #1a1a2e; font-weight: 700; font-size: 16px; margin-left: 20px;">R$ ${subtotal.toFixed(2).replace('.', ',')}</span>
        </div>
      </div>
    `}).join('');

    // Verificar o que tem
    const hasServices = services.length > 0;
    const hasProducts = products.length > 0;

    const emailResponse = await resend.emails.send({
      from: "Barbearia Costa Urbana <noreply@barbeariacostaurbana.com.br>",
      to: [clientEmail],
      subject: `✂️ ${title} - Barbearia Costa Urbana`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
          <div style="max-width: 480px; margin: 0 auto; padding: 16px;">
            
            <!-- HEADER -->
            <div style="text-align: center; background: linear-gradient(135deg, #1a1a2e, #16213e); color: white; padding: 24px 16px; border-radius: 12px 12px 0 0;">
              <img src="${logoUrl}" alt="Logo" style="width: 70px; height: 70px; border-radius: 50%; margin-bottom: 12px; border: 2px solid #D4A574;" />
              <h1 style="margin: 0; font-size: 18px; color: #D4A574;">✂️ ${title}</h1>
              <p style="margin: 8px 0 0; font-size: 12px; color: #ccc;">Barbearia Costa Urbana</p>
            </div>
            
            <!-- CONTENT -->
            <div style="background: white; padding: 20px 16px; border-radius: 0 0 12px 12px;">
              
              <p style="font-size: 14px; color: #333; margin: 0 0 20px;">
                Olá <strong>${clientName}</strong>! Segue seu comprovante:
              </p>
              
              <!-- INFO BOX -->
              <div style="background: #f8f8f8; padding: 14px; border-radius: 8px; border-left: 3px solid #D4A574; margin-bottom: 20px;">
                <div style="margin-bottom: 8px;">
                  <span style="color: #666; font-size: 12px;">📅 Data:</span>
                  <span style="color: #333; font-size: 13px; font-weight: 500; margin-left: 8px;">${transactionDate}</span>
                </div>
                ${barberName ? `
                <div style="margin-bottom: 8px;">
                  <span style="color: #666; font-size: 12px;">👨‍💼 Profissional:</span>
                  <span style="color: #333; font-size: 13px; font-weight: 500; margin-left: 8px;">${barberName}</span>
                </div>
                ` : ''}
                <div style="margin-bottom: ${nsu ? '8px' : '0'};">
                  <span style="color: #666; font-size: 12px;">💳 Pagamento:</span>
                  <span style="color: #333; font-size: 13px; font-weight: 500; margin-left: 8px;">${paymentMethodText}</span>
                </div>
                ${nsu ? `
                <div>
                  <span style="color: #666; font-size: 12px;">🔢 NSU:</span>
                  <span style="color: #333; font-size: 13px; font-weight: 500; margin-left: 8px;">${nsu}</span>
                </div>
                ` : ''}
              </div>

              ${hasServices ? `
              <!-- SERVIÇOS -->
              <div style="margin-bottom: 24px;">
                <h3 style="color: #1a1a2e; margin: 0 0 12px; font-size: 14px; padding-bottom: 8px; border-bottom: 2px solid #D4A574;">
                  ✂️ SERVIÇOS
                </h3>
                ${servicesHtml}
                <div style="display: flex; justify-content: space-between; padding: 12px 14px; background: #f0f0f0; border-radius: 6px; margin-top: 12px;">
                  <span style="color: #555; font-size: 13px; font-weight: 600;">Subtotal Serviços</span>
                  <span style="color: #333; font-size: 15px; font-weight: 700; margin-left: 20px;">R$ ${servicesSubtotal.toFixed(2).replace('.', ',')}</span>
                </div>
              </div>
              ` : ''}

              ${hasProducts ? `
              <!-- PRODUTOS -->
              <div style="margin-bottom: 24px;">
                <h3 style="color: #1a1a2e; margin: 0 0 12px; font-size: 14px; padding-bottom: 8px; border-bottom: 2px solid #D4A574;">
                  🛍️ PRODUTOS
                </h3>
                ${productsHtml}
                <div style="display: flex; justify-content: space-between; padding: 12px 14px; background: #f0f0f0; border-radius: 6px; margin-top: 12px;">
                  <span style="color: #555; font-size: 13px; font-weight: 600;">Subtotal Produtos</span>
                  <span style="color: #333; font-size: 15px; font-weight: 700; margin-left: 20px;">R$ ${productsSubtotal.toFixed(2).replace('.', ',')}</span>
                </div>
              </div>
              ` : ''}

              <!-- GORJETA (se houver) -->
              ${tipValue > 0 ? `
              <div style="background: #fff; border: 1px solid #f3d7ac; border-radius: 10px; padding: 14px; margin-top: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="color: #333; font-weight: 700; font-size: 14px;">💖 Gorjeta</span>
                  <span style="color: #1a1a2e; font-weight: 800; font-size: 16px; margin-left: 20px;">R$ ${tipValue.toFixed(2).replace('.', ',')}</span>
                </div>
              </div>
              ` : ''}

              <!-- TOTAL -->
              <div style="background: linear-gradient(135deg, #1a1a2e, #16213e); border-radius: 10px; padding: 18px 16px; margin-top: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="color: white; font-weight: 700; font-size: 17px; letter-spacing: 0.5px;">TOTAL</span>
                  <span style="color: #D4A574; font-weight: 800; font-size: 24px; margin-left: 20px;">R$ ${formattedTotal}</span>
                </div>
              </div>

              <!-- FOOTER -->
              <div style="text-align: center; margin-top: 24px; padding-top: 20px; border-top: 1px solid #eee;">
                <p style="color: #666; margin: 0 0 8px; font-size: 13px;">Obrigado pela preferência! 🙏</p>
                <p style="color: #D4A574; font-weight: bold; font-size: 15px; margin: 0;">Barbearia Costa Urbana ✂️</p>
                <p style="color: #999; font-size: 10px; margin: 12px 0 0;">Comprovante eletrônico gerado automaticamente.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
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
