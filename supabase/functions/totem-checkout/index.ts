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

    const { agendamento_id, extras, action } = await req.json()

    if (action === 'start') {
      // Buscar agendamento com serviço
      const { data: agendamento, error: agendError } = await supabase
        .from('painel_agendamentos')
        .select(`
          *,
          cliente:painel_clientes(*),
          barbeiro:painel_barbeiros(*),
          servico:painel_servicos(*)
        `)
        .eq('id', agendamento_id)
        .single()

      if (agendError || !agendamento) {
        return new Response(
          JSON.stringify({ error: 'Agendamento não encontrado' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        )
      }

      // Criar venda
      const { data: venda, error: vendaError } = await supabase
        .from('vendas')
        .insert({
          agendamento_id: agendamento.id,
          cliente_id: agendamento.cliente_id,
          barbeiro_id: agendamento.barbeiro_id,
          status: 'ABERTA'
        })
        .select()
        .single()

      if (vendaError) {
        throw vendaError
      }

      // Adicionar serviço principal
      const itens = [{
        venda_id: venda.id,
        tipo: 'SERVICO',
        ref_id: agendamento.servico_id,
        nome: agendamento.servico.nome,
        quantidade: 1,
        preco_unit: agendamento.servico.preco,
        total: agendamento.servico.preco
      }]

      let subtotal = Number(agendamento.servico.preco)

      // Adicionar extras
      if (extras && extras.length > 0) {
        for (const extra of extras) {
          if (extra.tipo === 'SERVICO') {
            const { data: servico } = await supabase
              .from('painel_servicos')
              .select('*')
              .eq('id', extra.ref_id)
              .single()

            if (servico) {
              const total = Number(servico.preco) * extra.quantidade
              itens.push({
                venda_id: venda.id,
                tipo: 'SERVICO',
                ref_id: servico.id,
                nome: servico.nome,
                quantidade: extra.quantidade,
                preco_unit: servico.preco,
                total
              })
              subtotal += total
            }
          } else if (extra.tipo === 'PRODUTO') {
            const { data: produto } = await supabase
              .from('produtos')
              .select('*')
              .eq('id', extra.ref_id)
              .single()

            if (produto) {
              const total = Number(produto.preco) * extra.quantidade
              itens.push({
                venda_id: venda.id,
                tipo: 'PRODUTO',
                ref_id: produto.id,
                nome: produto.nome,
                quantidade: extra.quantidade,
                preco_unit: produto.preco,
                total
              })
              subtotal += total
            }
          }
        }
      }

      // Inserir itens
      const { error: itensError } = await supabase
        .from('vendas_itens')
        .insert(itens)

      if (itensError) {
        throw itensError
      }

      // Atualizar totais da venda
      const desconto = 0 // Pode implementar lógica de desconto aqui
      const total = subtotal - desconto

      await supabase
        .from('vendas')
        .update({ subtotal, desconto, total })
        .eq('id', venda.id)

      // Buscar itens criados
      const { data: itensCreated } = await supabase
        .from('vendas_itens')
        .select('*')
        .eq('venda_id', venda.id)

      // Publicar evento realtime
      const channel = supabase.channel(`barbearia:${agendamento.barbeiro_id}`)
      await channel.send({
        type: 'broadcast',
        event: 'CHECKOUT_INICIADO',
        payload: {
          tipo: 'CHECKOUT_INICIADO',
          agendamento_id: agendamento.id,
          venda_id: venda.id,
          cliente_nome: agendamento.cliente?.nome,
          total,
          timestamp: new Date().toISOString()
        }
      })

      return new Response(
        JSON.stringify({
          success: true,
          venda_id: venda.id,
          resumo: {
            itens: itensCreated,
            subtotal,
            desconto,
            total
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else if (action === 'finish') {
      const { venda_id } = await req.json()

      // Atualizar status do agendamento
      await supabase
        .from('painel_agendamentos')
        .update({ status_totem: 'FINALIZADO', status: 'concluido' })
        .eq('id', agendamento_id)

      // Buscar venda
      const { data: venda } = await supabase
        .from('vendas')
        .select('*, agendamento:painel_agendamentos(barbeiro_id)')
        .eq('id', venda_id)
        .single()

      // Publicar evento realtime
      if (venda) {
        const channel = supabase.channel(`barbearia:${venda.agendamento?.barbeiro_id}`)
        await channel.send({
          type: 'broadcast',
          event: 'FINALIZADO',
          payload: {
            tipo: 'FINALIZADO',
            agendamento_id,
            venda_id,
            timestamp: new Date().toISOString()
          }
        })
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Ação inválida' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  } catch (error) {
    console.error('Erro no checkout:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
