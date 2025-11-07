import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentRequest {
  terminalId: string;
  amount: number;
  paymentType: 'credit' | 'debit' | 'pix';
  installments?: number;
  callbackUrl?: string;
  reference?: string;
  softDescriptor?: string;
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

    const url = new URL(req.url);
    const path = url.pathname.split('/tef-mock')[1] || '/';

    // POST /payments - Criar nova transação
    if (req.method === 'POST' && path === '/payments') {
      const body: PaymentRequest = await req.json();
      
      // Validar campos obrigatórios
      if (!body.terminalId || !body.amount || !body.paymentType) {
        return new Response(
          JSON.stringify({ error: 'Campos obrigatórios: terminalId, amount, paymentType' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Gerar ID único para o pagamento
      const paymentId = `mock_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      // Inserir transação no banco
      const { data, error } = await supabase
        .from('tef_mock_transactions')
        .insert({
          payment_id: paymentId,
          terminal_id: body.terminalId,
          amount: body.amount,
          payment_type: body.paymentType,
          installments: body.installments || 1,
          callback_url: body.callbackUrl,
          reference: body.reference,
          soft_descriptor: body.softDescriptor,
          status: 'processing'
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar transação:', error);
        return new Response(
          JSON.stringify({ error: 'Erro ao criar transação' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Transação criada:', paymentId);

      return new Response(
        JSON.stringify({
          paymentId: data.payment_id,
          status: data.status,
          createdAt: data.created_at
        }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET /payments/:paymentId - Consultar transação
    if (req.method === 'GET' && path.startsWith('/payments/')) {
      const paymentId = path.split('/payments/')[1];
      
      const { data, error } = await supabase
        .from('tef_mock_transactions')
        .select('*')
        .eq('payment_id', paymentId)
        .single();

      if (error || !data) {
        return new Response(
          JSON.stringify({ error: 'Transação não encontrada' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          paymentId: data.payment_id,
          status: data.status,
          amount: data.amount,
          paymentType: data.payment_type,
          authorizationCode: data.authorization_code,
          nsu: data.nsu,
          cardBrand: data.card_brand,
          createdAt: data.created_at,
          updatedAt: data.updated_at
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST /payments/:paymentId/cancel - Cancelar transação
    if (req.method === 'POST' && path.includes('/cancel')) {
      const paymentId = path.split('/payments/')[1].split('/cancel')[0];
      
      const { data, error } = await supabase
        .from('tef_mock_transactions')
        .update({ status: 'canceled', simulated_at: new Date().toISOString() })
        .eq('payment_id', paymentId)
        .select()
        .single();

      if (error || !data) {
        return new Response(
          JSON.stringify({ error: 'Transação não encontrada ou já finalizada' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Transação cancelada:', paymentId);

      return new Response(
        JSON.stringify({
          paymentId: data.payment_id,
          status: data.status,
          message: 'Transação cancelada com sucesso'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Rota não encontrada' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro no mock TEF:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno no servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});