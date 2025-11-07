import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebhookPayload {
  paymentId: string;
  status: 'approved' | 'declined' | 'canceled' | 'expired';
  authorizationCode?: string;
  nsu?: string;
  cardBrand?: string;
  amount: number;
  reference?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Método não permitido' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload: WebhookPayload = await req.json();
    
    console.log('Webhook recebido:', payload);

    // Validar payload
    if (!payload.paymentId || !payload.status || !payload.amount) {
      return new Response(
        JSON.stringify({ error: 'Payload inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Atualizar transação no banco
    const { data: transaction, error: updateError } = await supabase
      .from('tef_mock_transactions')
      .update({
        status: payload.status,
        authorization_code: payload.authorizationCode,
        nsu: payload.nsu,
        card_brand: payload.cardBrand,
        simulated_at: new Date().toISOString()
      })
      .eq('payment_id', payload.paymentId)
      .select()
      .single();

    if (updateError || !transaction) {
      console.error('Erro ao atualizar transação:', updateError);
      return new Response(
        JSON.stringify({ error: 'Transação não encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Transação atualizada:', transaction.payment_id, 'Status:', transaction.status);

    // Aqui você pode adicionar lógica adicional, como:
    // - Atualizar status do agendamento no Totem
    // - Enviar notificação ao cliente
    // - Registrar no fluxo de caixa
    
    // Se houver uma referência (order_id, appointment_id, etc), processar
    if (payload.reference) {
      console.log('Processando referência:', payload.reference);
      
      // Exemplo: Se for um agendamento do totem
      if (payload.reference.startsWith('totem_')) {
        const totemOrderId = payload.reference.replace('totem_', '');
        
        // Atualizar status do pedido/atendimento
        if (payload.status === 'approved') {
          console.log('Pagamento aprovado para pedido:', totemOrderId);
          // Aqui você pode atualizar a tabela de pedidos/atendimentos
        } else {
          console.log('Pagamento não aprovado para pedido:', totemOrderId);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Webhook processado com sucesso',
        paymentId: transaction.payment_id,
        status: transaction.status
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro no webhook TEF:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno no servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});