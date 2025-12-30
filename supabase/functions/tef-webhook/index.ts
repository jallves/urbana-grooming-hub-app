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
  // Campos para suporte a pendências (Passos 33/34 Homologação PayGo)
  requiresConfirmation?: boolean;
  confirmationTransactionId?: string;
  pendingTransactionExists?: boolean;
  message?: string;
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
    if (!payload.paymentId || !payload.status) {
      return new Response(
        JSON.stringify({ error: 'Payload inválido - paymentId e status são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Preparar dados para atualização
    const updateData: Record<string, unknown> = {
      status: payload.status,
      simulated_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Campos opcionais
    if (payload.authorizationCode) {
      updateData.authorization_code = payload.authorizationCode;
    }
    if (payload.nsu) {
      updateData.nsu = payload.nsu;
    }
    if (payload.cardBrand) {
      updateData.card_brand = payload.cardBrand;
    }

    // Campos de pendência (Passos 33/34 PayGo)
    if (payload.requiresConfirmation !== undefined) {
      updateData.requires_confirmation = payload.requiresConfirmation;
    }
    if (payload.confirmationTransactionId) {
      updateData.confirmation_transaction_id = payload.confirmationTransactionId;
    }
    if (payload.pendingTransactionExists !== undefined) {
      updateData.pending_transaction_exists = payload.pendingTransactionExists;
    }

    console.log('Dados para atualização:', updateData);

    // Atualizar transação no banco
    const { data: transaction, error: updateError } = await supabase
      .from('tef_mock_transactions')
      .update(updateData)
      .eq('payment_id', payload.paymentId)
      .select()
      .single();

    if (updateError || !transaction) {
      console.error('Erro ao atualizar transação:', updateError);
      return new Response(
        JSON.stringify({ error: 'Transação não encontrada', details: updateError?.message }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Transação atualizada:', transaction.payment_id, 'Status:', transaction.status);
    
    // Log de pendência se aplicável
    if (payload.requiresConfirmation || payload.pendingTransactionExists) {
      console.log('[PENDÊNCIA] Transação requer confirmação:', {
        paymentId: payload.paymentId,
        confirmationId: payload.confirmationTransactionId,
        pendingExists: payload.pendingTransactionExists
      });
    }

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
        message: payload.message || 'Webhook processado com sucesso',
        paymentId: transaction.payment_id,
        status: transaction.status,
        requiresConfirmation: payload.requiresConfirmation || false,
        pendingTransactionExists: payload.pendingTransactionExists || false
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro no webhook TEF:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno no servidor', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});