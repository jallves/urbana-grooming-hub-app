import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

const WEBHOOK_SECRET = Deno.env.get('WEBHOOK_SECRET') || 'your-webhook-secret'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Validar assinatura do webhook
    const signature = req.headers.get('x-webhook-signature')
    // Aqui você validaria a assinatura com HMAC

    const payload = await req.json()
    const { transacao_id, status, valor, tipo } = payload

    // Buscar pagamento
    const { data: pagamento, error: pagError } = await supabase
      .from('pagamentos')
      .select(`
        *,
        venda:vendas(
          id,
          agendamento_id,
          agendamento:painel_agendamentos(
            barbeiro_id,
            cliente:painel_clientes(nome)
          )
        )
      `)
      .eq('transacao_id', transacao_id)
      .single()

    if (pagError || !pagamento) {
      return new Response(
        JSON.stringify({ error: 'Pagamento não encontrado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // Atualizar status do pagamento
    let novoStatus = 'PENDENTE'
    if (status === 'approved' || status === 'paid') {
      novoStatus = 'APROVADO'
    } else if (status === 'rejected' || status === 'cancelled') {
      novoStatus = 'FALHOU'
    }

    await supabase
      .from('pagamentos')
      .update({ 
        status: novoStatus,
        payload: {
          ...pagamento.payload,
          webhook_recebido: new Date().toISOString(),
          webhook_data: payload
        }
      })
      .eq('id', pagamento.id)

    // Se aprovado, atualizar venda
    if (novoStatus === 'APROVADO') {
      await supabase
        .from('vendas')
        .update({ status: 'PAGA' })
        .eq('id', pagamento.venda_id)

      // Publicar evento realtime
      const channel = supabase.channel(`barbearia:${pagamento.venda?.agendamento?.barbeiro_id}`)
      await channel.send({
        type: 'broadcast',
        event: 'PAGAMENTO_APROVADO',
        payload: {
          tipo: 'PAGAMENTO_APROVADO',
          venda_id: pagamento.venda_id,
          pagamento_id: pagamento.id,
          metodo: pagamento.metodo,
          valor: pagamento.valor,
          cliente_nome: pagamento.venda?.agendamento?.cliente?.nome,
          timestamp: new Date().toISOString()
        }
      })
    }

    return new Response(
      JSON.stringify({ success: true, status: novoStatus }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Erro no webhook:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
