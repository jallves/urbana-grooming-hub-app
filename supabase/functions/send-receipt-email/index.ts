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
  // Password reset fields
  isPasswordReset?: boolean;
  newPassword?: string;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateStr;
  }
}

function formatPaymentMethod(method: string): string {
  const methods: Record<string, string> = {
    'credit': 'Cartão de Crédito',
    'debit': 'Cartão de Débito',
    'pix': 'PIX',
    'cash': 'Dinheiro',
    'voucher': 'Vale/Voucher',
    'credit_card': 'Cartão de Crédito',
    'debit_card': 'Cartão de Débito',
  };
  return methods[method] || method;
}

function getTransactionTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    'service': 'Serviço',
    'product': 'Produto',
    'mixed': 'Serviço + Produto'
  };
  return labels[type] || type;
}

function generatePasswordResetEmailHtml(clientName: string, newPassword: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Nova Senha - Costa Urbana Barbearia</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; text-align: center;">
                  <h1 style="color: #d4af37; margin: 0; font-size: 24px; font-weight: bold;">
                    ✂️ Costa Urbana Barbearia
                  </h1>
                  <p style="color: #ffffff; margin: 8px 0 0; font-size: 14px; opacity: 0.9;">
                    Redefinição de Senha
                  </p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 30px;">
                  <h2 style="color: #1a1a2e; margin: 0 0 16px; font-size: 20px;">
                    Olá, ${clientName}! 👋
                  </h2>
                  
                  <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
                    Sua senha foi redefinida pelo administrador da barbearia. Utilize as credenciais abaixo para acessar sua conta:
                  </p>
                  
                  <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; border-left: 4px solid #d4af37; margin: 20px 0;">
                    <p style="margin: 0 0 8px; color: #666; font-size: 13px;">SUA NOVA SENHA:</p>
                    <p style="margin: 0; color: #1a1a2e; font-size: 22px; font-weight: bold; font-family: 'Courier New', monospace; letter-spacing: 2px;">
                      ${newPassword}
                    </p>
                  </div>
                  
                  <div style="background-color: #fff3cd; border-radius: 8px; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0; color: #856404; font-size: 13px;">
                      🔐 <strong>Dica de segurança:</strong> Recomendamos que você altere sua senha após o primeiro acesso.
                    </p>
                  </div>
                  
                  <p style="color: #999; font-size: 12px; margin-top: 30px; text-align: center;">
                    Se você não solicitou esta alteração, entre em contato conosco imediatamente.
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #eee;">
                  <p style="color: #999; font-size: 12px; margin: 0;">
                    Costa Urbana Barbearia — Este é um e-mail automático
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

function generateReceiptEmailHtml(data: ReceiptEmailRequest): string {
  const itemsHtml = data.items.map(item => `
    <tr>
      <td style="padding: 12px 16px; border-bottom: 1px solid #f0f0f0;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <span style="color: #333; font-size: 14px; font-weight: 500;">${item.name}</span>
            ${item.quantity && item.quantity > 1 ? `<span style="color: #888; font-size: 12px; margin-left: 8px;">(x${item.quantity})</span>` : ''}
            ${item.type ? `<span style="display: inline-block; background-color: ${item.type === 'service' ? '#e3f2fd' : '#f3e5f5'}; color: ${item.type === 'service' ? '#1565c0' : '#7b1fa2'}; font-size: 10px; padding: 2px 6px; border-radius: 4px; margin-left: 8px;">${item.type === 'service' ? 'Serviço' : 'Produto'}</span>` : ''}
          </div>
        </div>
      </td>
      <td style="padding: 12px 16px; border-bottom: 1px solid #f0f0f0; text-align: right; color: #333; font-weight: 500;">
        ${formatCurrency(item.price)}
      </td>
    </tr>
  `).join('');

  let totalsHtml = '';
  
  if (data.tipAmount && data.tipAmount > 0) {
    totalsHtml += `
      <tr>
        <td style="padding: 8px 16px; text-align: right; color: #666; font-size: 14px;">Gorjeta:</td>
        <td style="padding: 8px 16px; text-align: right; color: #333; font-size: 14px;">${formatCurrency(data.tipAmount)}</td>
      </tr>
    `;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Comprovante - Costa Urbana Barbearia</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; text-align: center;">
                  <h1 style="color: #d4af37; margin: 0; font-size: 24px; font-weight: bold;">
                    ✂️ Costa Urbana Barbearia
                  </h1>
                  <p style="color: #ffffff; margin: 8px 0 0; font-size: 14px; opacity: 0.9;">
                    Comprovante de ${getTransactionTypeLabel(data.transactionType)}
                  </p>
                </td>
              </tr>
              
              <!-- Client Info -->
              <tr>
                <td style="padding: 24px 24px 0;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding: 8px 0;">
                        <span style="color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Cliente</span>
                        <p style="color: #333; font-size: 16px; margin: 4px 0 0; font-weight: 500;">${data.clientName}</p>
                      </td>
                      <td style="padding: 8px 0; text-align: right;">
                        <span style="color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Data</span>
                        <p style="color: #333; font-size: 14px; margin: 4px 0 0;">${formatDate(data.transactionDate)}</p>
                      </td>
                    </tr>
                    ${data.barberName ? `
                    <tr>
                      <td style="padding: 8px 0;" colspan="2">
                        <span style="color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Profissional</span>
                        <p style="color: #333; font-size: 14px; margin: 4px 0 0;">${data.barberName}</p>
                      </td>
                    </tr>
                    ` : ''}
                  </table>
                </td>
              </tr>

              <!-- Items -->
              <tr>
                <td style="padding: 20px 24px;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #f0f0f0; border-radius: 8px; overflow: hidden;">
                    <thead>
                      <tr style="background-color: #fafafa;">
                        <th style="padding: 12px 16px; text-align: left; color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Item</th>
                        <th style="padding: 12px 16px; text-align: right; color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${itemsHtml}
                      ${totalsHtml}
                      <tr style="background-color: #1a1a2e;">
                        <td style="padding: 16px; color: #d4af37; font-weight: bold; font-size: 16px;">TOTAL</td>
                        <td style="padding: 16px; text-align: right; color: #d4af37; font-weight: bold; font-size: 18px;">${formatCurrency(data.total)}</td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>

              <!-- Payment Info -->
              <tr>
                <td style="padding: 0 24px 24px;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 8px; padding: 16px;">
                    <tr>
                      <td style="padding: 8px 16px;">
                        <span style="color: #888; font-size: 12px;">Forma de Pagamento</span>
                        <p style="color: #333; font-size: 14px; margin: 4px 0 0; font-weight: 500;">${formatPaymentMethod(data.paymentMethod)}</p>
                      </td>
                      ${data.nsu ? `
                      <td style="padding: 8px 16px; text-align: right;">
                        <span style="color: #888; font-size: 12px;">NSU</span>
                        <p style="color: #333; font-size: 14px; margin: 4px 0 0; font-family: monospace;">${data.nsu}</p>
                      </td>
                      ` : ''}
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #eee;">
                  <p style="color: #333; font-size: 14px; margin: 0 0 4px;">
                    Obrigado pela preferência! 🙏
                  </p>
                  <p style="color: #999; font-size: 12px; margin: 0;">
                    Costa Urbana Barbearia — Comprovante gerado automaticamente
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: ReceiptEmailRequest = await req.json();

    console.log('[send-receipt-email] Dados recebidos:', {
      clientName: data.clientName,
      clientEmail: data.clientEmail,
      isPasswordReset: data.isPasswordReset,
      transactionType: data.transactionType,
    });

    if (!data.clientEmail) {
      return new Response(
        JSON.stringify({ error: 'E-mail do cliente é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let subject: string;
    let html: string;

    if (data.isPasswordReset && data.newPassword) {
      // Password reset email
      subject = '🔐 Sua senha foi redefinida - Costa Urbana Barbearia';
      html = generatePasswordResetEmailHtml(data.clientName, data.newPassword);
    } else {
      // Receipt email
      subject = `✂️ Comprovante ${getTransactionTypeLabel(data.transactionType)} - Costa Urbana Barbearia`;
      html = generateReceiptEmailHtml(data);
    }

    console.log('[send-receipt-email] Enviando e-mail para:', data.clientEmail);

    const emailResult = await resend.emails.send({
      from: 'Costa Urbana Barbearia <atendimento@barbeariacostaurbana.com.br>',
      to: [data.clientEmail],
      subject,
      html,
    });

    console.log('[send-receipt-email] E-mail enviado com sucesso:', emailResult);

    return new Response(
      JSON.stringify({ success: true, data: emailResult }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[send-receipt-email] Erro:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
