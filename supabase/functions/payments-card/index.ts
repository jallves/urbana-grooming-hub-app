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

    const { venda_id, valor, tipo } = await req.json() // tipo: CARTAO_DEBITO | CARTAO_CREDITO

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

    // Simular integração com adquirente (Stone, Cielo, etc.)
    // Aqui você integraria com o SDK da operadora
    const transacaoId = `CARD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    // Criar pagamento
    const { data: pagamento, error: pagError } = await supabase
      .from('pagamentos')
      .insert({
        venda_id,
        metodo: tipo,
        valor,
        status: 'PENDENTE',
        provedor: 'SIMULADO',
        transacao_id: transacaoId,
        payload: {
          iniciado_em: new Date().toISOString(),
          tipo
        }
      })
      .select()
      .single()

    if (pagError) {
      throw pagError
    }

    // Simular autorização (em produção, aguardaria resposta do POS/adquirente)
    // Por enquanto, vamos simular aprovação imediata
    setTimeout(async () => {
      // Atualizar para APROVADO
      await supabase
        .from('pagamentos')
        .update({ 
          status: 'APROVADO',
          payload: {
            ...pagamento.payload,
            aprovado_em: new Date().toISOString()
          }
        })
        .eq('id', pagamento.id)

      // Atualizar venda para PAGA
      await supabase
        .from('vendas')
        .update({ status: 'PAGA' })
        .eq('id', venda_id)

      // Publicar evento realtime
      const channel = supabase.channel(`barbearia:${venda.agendamento?.barbeiro_id}`)
      await channel.send({
        type: 'broadcast',
        event: 'PAGAMENTO_APROVADO',
        payload: {
          tipo: 'PAGAMENTO_APROVADO',
          venda_id,
          pagamento_id: pagamento.id,
          metodo: tipo,
          valor,
          cliente_nome: venda.agendamento?.cliente?.nome,
          timestamp: new Date().toISOString()
        }
      })
    }, 3000) // Simula 3 segundos de processamento

    return new Response(
      JSON.stringify({
        success: true,
        pagamento_id: pagamento.id,
        transacao_id: transacaoId,
        status: 'PROCESSANDO',
        mensagem: 'Aguarde a confirmação do pagamento...'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Erro ao processar pagamento com cartão:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
