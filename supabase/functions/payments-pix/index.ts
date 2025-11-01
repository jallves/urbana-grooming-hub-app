import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { venda_id, valor } = await req.json()

    // Buscar venda
    const { data: venda, error: vendaError } = await supabase
      .from('vendas')
      .select(`
        *,
        agendamento:painel_agendamentos(
          barbeiro_id,
          cliente:painel_clientes(nome)
        )
      `)
      .eq('id', venda_id)
      .single()

    if (vendaError || !venda) {
      return new Response(
        JSON.stringify({ error: 'Venda não encontrada' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // Gerar QR Code PIX (simulado - integrar com PSP real)
    // Aqui você integraria com Mercado Pago, PagSeguro, etc.
    const transacaoId = `PIX-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    // Payload PIX simulado
    const pixPayload = `00020126580014br.gov.bcb.pix0136${transacaoId}520400005303986540${valor.toFixed(2)}5802BR5913COSTA URBANA6009SAO PAULO62070503***6304`
    
    // Criar pagamento
    const { data: pagamento, error: pagError } = await supabase
      .from('pagamentos')
      .insert({
        venda_id,
        metodo: 'PIX',
        valor,
        status: 'PENDENTE',
        provedor: 'SIMULADO',
        transacao_id: transacaoId,
        qr_code: pixPayload,
        copia_cola: pixPayload,
        payload: {
          gerado_em: new Date().toISOString(),
          expira_em: new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutos
        }
      })
      .select()
      .single()

    if (pagError) {
      throw pagError
    }

    // Publicar evento realtime de pagamento pendente
    const channel = supabase.channel(`barbearia:${venda.agendamento?.barbeiro_id}`)
    await channel.send({
      type: 'broadcast',
      event: 'PAGAMENTO_PENDENTE',
      payload: {
        tipo: 'PAGAMENTO_PENDENTE',
        venda_id,
        pagamento_id: pagamento.id,
        metodo: 'PIX',
        valor,
        cliente_nome: venda.agendamento?.cliente?.nome,
        timestamp: new Date().toISOString()
      }
    })

    return new Response(
      JSON.stringify({
        success: true,
        pagamento_id: pagamento.id,
        transacao_id: transacaoId,
        qr_code: pixPayload,
        copia_cola: pixPayload,
        expira_em: pagamento.payload.expira_em
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Erro ao criar pagamento PIX:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
