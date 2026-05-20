import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

const COMMISSION_RATE = 40 // 40% default

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const body = await req.json()
    const { action, session_id, checkout_type, custom_value, pay_commission, extra_services, extra_products, payment_method } = body

    // ==================== ACTION: LIST ====================
    if (action === 'list') {
      console.log('📋 Listando agendamentos com check-in sem checkout...')

      const { data: sessoesPendentes, error: listError } = await supabase
        .from('appointment_totem_sessions')
        .select(`
          id, appointment_id, status, totem_session_id,
          totem_sessions!inner(id, token, is_valid, created_at)
        `)
        .in('status', ['check_in', 'checked_in'])
        .order('created_at', { ascending: false })

      if (listError) throw listError

      if (!sessoesPendentes || sessoesPendentes.length === 0) {
        return new Response(
          JSON.stringify({ success: true, count: 0, appointments: [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const appointmentIds = sessoesPendentes.map(s => s.appointment_id).filter(Boolean)

      const { data: agendamentos, error: agendError } = await supabase
        .from('painel_agendamentos')
        .select(`
          id, data, hora, status, cliente_id, barbeiro_id, servico_id,
          painel_clientes(nome, whatsapp, telefone),
          painel_barbeiros(nome),
          painel_servicos(nome, preco)
        `)
        .in('id', appointmentIds)

      if (agendError) throw agendError

      const agendamentosPendentes = sessoesPendentes.map(sessao => {
        const agendamento = agendamentos?.find(a => a.id === sessao.appointment_id)
        return {
          ...agendamento,
          session_id: sessao.totem_session_id,
          session_status: sessao.status,
          totem_session: sessao.totem_sessions
        }
      }).filter(a => a.id)

      return new Response(
        JSON.stringify({ success: true, count: agendamentosPendentes.length, appointments: agendamentosPendentes }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ==================== ACTION: FORCE_CHECKOUT ====================
    if (action === 'force_checkout') {
      const type = checkout_type || 'full'
      const shouldPayCommission = pay_commission !== false // default true
      const payMethod: string = payment_method || 'admin'
      const addedServices: Array<{ id: string; quantidade: number }> = Array.isArray(extra_services) ? extra_services : []
      const addedProducts: Array<{ id: string; quantidade: number }> = Array.isArray(extra_products) ? extra_products : []
      console.log('🔧 Checkout admin:', { session_id, type, shouldPayCommission, custom_value, payMethod, addedServices, addedProducts })

      if (!session_id) throw new Error('session_id é obrigatório')

      // 1. Buscar sessão - tentar por totem_session_id primeiro, depois por appointment_id
      let appointmentSession: any = null

      const { data: bySession, error: sessionError } = await supabase
        .from('appointment_totem_sessions')
        .select('*, totem_sessions(*)')
        .eq('totem_session_id', session_id)
        .in('status', ['check_in', 'checked_in'])
        .maybeSingle()

      if (sessionError) throw sessionError

      if (bySession) {
        appointmentSession = bySession
      } else {
        // Fallback: session_id pode ser o appointment_id quando não há totem_session vinculada
        console.log('⚠️ Sessão não encontrada por totem_session_id, tentando por appointment_id...')
        const { data: byAppointment, error: apptError } = await supabase
          .from('appointment_totem_sessions')
          .select('*, totem_sessions(*)')
          .eq('appointment_id', session_id)
          .in('status', ['check_in', 'checked_in'])
          .maybeSingle()

        if (apptError) throw apptError
        appointmentSession = byAppointment
      }

      // Se ainda não encontrou, pode ser agendamento sem sessão de totem - criar checkout direto
      let appointment_id: string

      if (appointmentSession) {
        appointment_id = appointmentSession.appointment_id
      } else {
        // Verificar se session_id é na verdade um appointment_id válido com status_totem CHEGOU
        const { data: directAppt } = await supabase
          .from('painel_agendamentos')
          .select('id')
          .eq('id', session_id)
          .eq('status_totem', 'CHEGOU')
          .maybeSingle()

        if (!directAppt) throw new Error('Sessão não encontrada ou já finalizada')
        appointment_id = directAppt.id
        console.log('✅ Checkout direto por appointment_id (sem sessão totem):', appointment_id)
      }

      // 2. Buscar agendamento (including servicos_extras)
      const { data: agendamento, error: agendError } = await supabase
        .from('painel_agendamentos')
        .select(`
          *,
          painel_servicos(nome, preco),
          painel_barbeiros(id, nome, staff_id, taxa_comissao, commission_rate)
        `)
        .eq('id', appointment_id)
        .single()

      if (agendError || !agendamento) throw new Error('Agendamento não encontrado')

      const originalPrice = agendamento.painel_servicos?.preco || 0
      const nomeServico = agendamento.painel_servicos?.nome || 'Serviço'
      const barbeiro_id = agendamento.barbeiro_id
      const barberName = agendamento.painel_barbeiros?.nome || 'N/A'

      // Calculate extras from servicos_extras
      const appointmentExtras: any[] = agendamento.servicos_extras && Array.isArray(agendamento.servicos_extras) 
        ? agendamento.servicos_extras 
        : []
      
      // Fetch real prices for extras from DB
      const extraItems: { id: string; nome: string; preco: number }[] = []
      for (const extra of appointmentExtras) {
        const { data: servicoExtra } = await supabase
          .from('painel_servicos')
          .select('id, nome, preco')
          .eq('id', extra.id)
          .maybeSingle()
        if (servicoExtra) {
          extraItems.push(servicoExtra)
        }
      }
      const extrasTotal = extraItems.reduce((sum, e) => sum + Number(e.preco), 0)

      // Added services at checkout time
      const addedServicesData: { id: string; nome: string; preco: number; quantidade: number }[] = []
      for (const s of addedServices) {
        if (!s?.id) continue
        const qty = Math.max(1, Number(s.quantidade) || 1)
        const { data: svc } = await supabase
          .from('painel_servicos')
          .select('id, nome, preco')
          .eq('id', s.id)
          .maybeSingle()
        if (svc) addedServicesData.push({ id: svc.id, nome: svc.nome, preco: Number(svc.preco), quantidade: qty })
      }
      const addedServicesTotal = addedServicesData.reduce((sum, e) => sum + e.preco * e.quantidade, 0)

      // Added products
      const addedProductsData: { id: string; nome: string; preco: number; quantidade: number; commission_value: number; commission_percentage: number }[] = []
      for (const p of addedProducts) {
        if (!p?.id) continue
        const qty = Math.max(1, Number(p.quantidade) || 1)
        const { data: prd } = await supabase
          .from('painel_produtos')
          .select('id, nome, preco, commission_value, commission_percentage')
          .eq('id', p.id)
          .maybeSingle()
        if (prd) addedProductsData.push({
          id: prd.id, nome: prd.nome, preco: Number(prd.preco), quantidade: qty,
          commission_value: Number(prd.commission_value || 0),
          commission_percentage: Number(prd.commission_percentage || 0),
        })
      }
      const addedProductsTotal = addedProductsData.reduce((sum, e) => sum + e.preco * e.quantidade, 0)

      // 3. Calculate prices (including extras)
      const fullServicePrice = originalPrice + extrasTotal
      let revenueAmount: number
      let commissionBase: number
      let observacao: string

      switch (type) {
        case 'courtesy':
          revenueAmount = 0
          commissionBase = fullServicePrice + addedServicesTotal // Commission on FULL price (main + extras + added)
          observacao = `Cortesia administrativa - ${nomeServico}${extraItems.length > 0 ? ` + ${extraItems.length} extra(s)` : ''}`
          break
        case 'custom':
          revenueAmount = typeof custom_value === 'number' ? custom_value : fullServicePrice
          commissionBase = revenueAmount + addedServicesTotal
          observacao = `Checkout admin (R$ ${revenueAmount.toFixed(2)}) - ${nomeServico}${extraItems.length > 0 ? ` + ${extraItems.length} extra(s)` : ''}`
          break
        default:
          revenueAmount = fullServicePrice
          commissionBase = fullServicePrice + addedServicesTotal
          observacao = `Checkout administrativo - ${nomeServico}${extraItems.length > 0 ? ` + ${extraItems.length} extra(s)` : ''}`
      }

      // Add added services + products into revenue total
      revenueAmount = revenueAmount + addedServicesTotal + addedProductsTotal
      const commissionAmount = shouldPayCommission ? commissionBase * (COMMISSION_RATE / 100) : 0

      // Product commissions (independent of barber service commission rate)
      const productCommissions = addedProductsData.map(p => {
        let amount = 0
        if (p.commission_value > 0) amount = p.commission_value * p.quantidade
        else if (p.commission_percentage > 0) amount = (p.preco * p.quantidade) * (p.commission_percentage / 100)
        return { ...p, commission_amount: Number(amount.toFixed(2)) }
      })

      console.log('💰 Cálculos:', {
        originalPrice,
        revenueAmount,
        commissionBase,
        commissionAmount,
        shouldPayCommission,
        type
      })

      // 4. Criar venda
      const { data: novaVenda, error: vendaError } = await supabase
        .from('vendas')
        .insert({
          cliente_id: agendamento.cliente_id,
          barbeiro_id,
          valor_total: revenueAmount,
          desconto: Math.max(0, (fullServicePrice + addedServicesTotal + addedProductsTotal) - revenueAmount),
          status: 'PAGA',
          observacoes: observacao
        })
        .select()
        .single()

      if (vendaError) throw vendaError
      console.log('✅ Venda criada:', novaVenda.id)

      // 5. Criar itens da venda (serviço principal + extras)
      const vendaItems: any[] = [{
        venda_id: novaVenda.id,
        tipo: 'servico',
        item_id: agendamento.servico_id || agendamento.id,
        nome: nomeServico,
        quantidade: 1,
        preco_unitario: type === 'courtesy' ? 0 : originalPrice,
        subtotal: type === 'courtesy' ? 0 : originalPrice,
        barbeiro_id
      }]

      // Add extra service items
      for (const extra of extraItems) {
        vendaItems.push({
          venda_id: novaVenda.id,
          tipo: 'SERVICO_EXTRA',
          item_id: extra.id,
          nome: extra.nome,
          quantidade: 1,
          preco_unitario: type === 'courtesy' ? 0 : extra.preco,
          subtotal: type === 'courtesy' ? 0 : extra.preco,
          barbeiro_id
        })
      }

      // Added services (cobrados integralmente mesmo em cortesia do principal)
      for (const svc of addedServicesData) {
        vendaItems.push({
          venda_id: novaVenda.id,
          tipo: 'SERVICO_EXTRA',
          item_id: svc.id,
          nome: svc.nome,
          quantidade: svc.quantidade,
          preco_unitario: svc.preco,
          subtotal: svc.preco * svc.quantidade,
          barbeiro_id,
        })
      }

      // Added products
      for (const prd of addedProductsData) {
        vendaItems.push({
          venda_id: novaVenda.id,
          tipo: 'PRODUTO',
          item_id: prd.id,
          nome: prd.nome,
          quantidade: prd.quantidade,
          preco_unitario: prd.preco,
          subtotal: prd.preco * prd.quantidade,
          barbeiro_id,
        })
      }

      await supabase.from('vendas_itens').insert(vendaItems)

      // Decrement product stock
      for (const prd of addedProductsData) {
        try {
          await supabase.rpc('decrease_product_stock', { p_product_id: prd.id, p_quantity: prd.quantidade })
        } catch (e) {
          console.error('❌ Falha ao baixar estoque do produto', prd.id, e)
        }
      }

      // 6. Contas a Receber — separar por categoria (serviço x produto)
      const today = new Date().toISOString().split('T')[0]
      const servicesRevenue = type === 'courtesy' ? 0 : (originalPrice + extrasTotal + addedServicesTotal)
      const productsRevenue = addedProductsTotal

      // 6a. Receita de SERVIÇOS (principal + extras agendados + extras adicionados no checkout)
      if (servicesRevenue > 0 || type === 'courtesy') {
        const extrasCount = extraItems.length + addedServicesData.reduce((s, x) => s + x.quantidade, 0)
        await supabase.from('contas_receber').insert({
          descricao: type === 'courtesy'
            ? `Cortesia - ${nomeServico} (${barberName})`
            : `${nomeServico}${extrasCount > 0 ? ` + ${extrasCount} extra(s)` : ''} - Checkout admin`,
          valor: type === 'courtesy' ? 0 : servicesRevenue,
          data_vencimento: today,
          data_recebimento: today,
          status: 'recebido',
          categoria: 'servico',
          forma_pagamento: type === 'courtesy' && servicesRevenue === 0 ? 'cortesia' : payMethod,
          cliente_id: agendamento.cliente_id,
          observacoes: observacao,
          venda_id: novaVenda.id,
        })
        console.log('✅ Contas a receber (serviços):', servicesRevenue)
      }

      // 6b. Receita de PRODUTOS
      if (productsRevenue > 0) {
        const productsList = addedProductsData.map(p => `${p.nome} x${p.quantidade}`).join(', ')
        await supabase.from('contas_receber').insert({
          descricao: `Produtos: ${productsList}`,
          valor: productsRevenue,
          data_vencimento: today,
          data_recebimento: today,
          status: 'recebido',
          categoria: 'produto',
          forma_pagamento: payMethod,
          cliente_id: agendamento.cliente_id,
          observacoes: `Venda de produtos no checkout admin - ${barberName}`,
          venda_id: novaVenda.id,
        })
        console.log('✅ Contas a receber (produtos):', productsRevenue)
      }

      // 7. Comissão + Contas a Pagar (if commission should be paid)
      if (shouldPayCommission && commissionAmount > 0) {
        // Verificar comissão existente
        const { data: existingCommission } = await supabase
          .from('barber_commissions')
          .select('id')
          .eq('appointment_id', appointment_id)
          .maybeSingle()

        if (!existingCommission) {
          await supabase.from('barber_commissions').insert({
            barber_id: barbeiro_id,
            appointment_id,
            venda_id: novaVenda.id,
            valor: commissionAmount,
            amount: commissionAmount,
            commission_rate: COMMISSION_RATE,
            barber_name: barberName,
            tipo: type === 'courtesy' ? 'cortesia' : 'servico',
            status: 'pending',
            appointment_source: 'admin_checkout'
          })
          console.log('✅ Comissão criada:', commissionAmount)
        }

        // Contas a pagar - barbeiro
        await supabase.from('contas_pagar').insert({
          descricao: `Comissão ${barberName} - ${nomeServico}${type === 'courtesy' ? ' (cortesia)' : ''}`,
          valor: commissionAmount,
          data_vencimento: today,
          status: 'pendente',
          categoria: 'comissao',
          fornecedor: barberName,
          forma_pagamento: payMethod,
          observacoes: `Comissão ${COMMISSION_RATE}% sobre R$ ${commissionBase.toFixed(2)} - ${observacao}`,
          venda_id: novaVenda.id, // FK padronizada para vendas.id
        })
        console.log('✅ Contas a pagar (comissão):', commissionAmount)

        // Financial record for commission
        await supabase.from('financial_records').insert({
          transaction_type: 'commission',
          amount: commissionAmount,
          description: `Comissão ${barberName} - ${nomeServico}${type === 'courtesy' ? ' (cortesia)' : ''}`,
          category: 'comissao',
          status: 'pending',
          barber_id: barbeiro_id,
          barber_name: barberName,
          client_id: agendamento.cliente_id,
          service_id: agendamento.servico_id,
          service_name: nomeServico,
          reference_id: novaVenda.id,
          reference_type: 'venda',
          payment_method: payMethod,
        })
      }

      // Product commissions
      for (const pc of productCommissions) {
        if (pc.commission_amount <= 0) continue
        await supabase.from('barber_commissions').insert({
          barber_id: barbeiro_id,
          appointment_id,
          venda_id: novaVenda.id,
          valor: pc.commission_amount,
          amount: pc.commission_amount,
          commission_rate: pc.commission_value > 0 ? 0 : pc.commission_percentage,
          barber_name: barberName,
          tipo: 'produto',
          status: 'pending',
          appointment_source: 'admin_checkout',
        })
        await supabase.from('contas_pagar').insert({
          descricao: `Comissão produto ${pc.nome} - ${barberName}`,
          valor: pc.commission_amount,
          data_vencimento: today,
          status: 'pendente',
          categoria: 'comissao_produto',
          fornecedor: barberName,
          forma_pagamento: payMethod,
          observacoes: `Comissão produto ${pc.nome} x${pc.quantidade}`,
          venda_id: novaVenda.id,
        })
        await supabase.from('financial_records').insert({
          transaction_type: 'commission',
          amount: pc.commission_amount,
          description: `Comissão produto ${pc.nome} - ${barberName}`,
          category: 'produto',
          subcategory: 'produto_comissao',
          status: 'pending',
          barber_id: barbeiro_id,
          barber_name: barberName,
          client_id: agendamento.cliente_id,
          reference_id: novaVenda.id,
          reference_type: 'venda',
          payment_method: payMethod,
        })
      }

      // 8. Financial transaction (receita) - separar serviços x produtos
      if (servicesRevenue > 0) {
        await supabase.from('financial_transactions').insert({
          transaction_type: 'income',
          amount: servicesRevenue,
          description: `Checkout admin - ${nomeServico}`,
          category: 'servico',
          payment_method: payMethod,
          status: 'completed',
          barber_id: barbeiro_id,
          client_id: agendamento.cliente_id,
          reference_id: novaVenda.id
        })
      }
      if (productsRevenue > 0) {
        await supabase.from('financial_transactions').insert({
          transaction_type: 'income',
          amount: productsRevenue,
          description: `Venda produtos - Checkout admin`,
          category: 'produto',
          payment_method: payMethod,
          status: 'completed',
          barber_id: barbeiro_id,
          client_id: agendamento.cliente_id,
          reference_id: novaVenda.id
        })
      }

      // Financial record (receita) - serviços
      if (servicesRevenue > 0 || type === 'courtesy') {
        await supabase.from('financial_records').insert({
          transaction_type: type === 'courtesy' ? 'courtesy' : 'income',
          amount: type === 'courtesy' ? 0 : servicesRevenue,
          description: type === 'courtesy'
            ? `Cortesia - ${nomeServico} (${barberName})`
            : `Checkout admin - ${nomeServico}`,
          category: 'servico',
          status: 'completed',
          barber_id: barbeiro_id,
          barber_name: barberName,
          client_id: agendamento.cliente_id,
          service_id: agendamento.servico_id,
          service_name: nomeServico,
          reference_id: novaVenda.id,
          reference_type: 'venda',
          payment_method: type === 'courtesy' && servicesRevenue === 0 ? 'cortesia' : payMethod,
        })
      }

      // Financial record (receita) - produtos
      if (productsRevenue > 0) {
        await supabase.from('financial_records').insert({
          transaction_type: 'income',
          amount: productsRevenue,
          description: `Venda produtos - Checkout admin (${barberName})`,
          category: 'produto',
          status: 'completed',
          barber_id: barbeiro_id,
          barber_name: barberName,
          client_id: agendamento.cliente_id,
          reference_id: novaVenda.id,
          reference_type: 'venda',
          payment_method: payMethod,
        })
      }

      // 8b. Cash Flow - serviços
      if (servicesRevenue > 0 || type === 'courtesy') {
        await supabase.from('cash_flow').insert({
          transaction_type: type === 'courtesy' ? 'courtesy' : 'income',
          amount: type === 'courtesy' ? 0 : servicesRevenue,
          description: type === 'courtesy'
            ? `Cortesia - ${nomeServico} (${barberName})`
            : `Checkout admin - ${nomeServico}`,
          category: 'servico',
          payment_method: type === 'courtesy' && servicesRevenue === 0 ? 'cortesia' : payMethod,
          transaction_date: today,
          reference_id: novaVenda.id,
          notes: observacao
        })
        console.log('✅ Cash flow (serviços):', servicesRevenue)
      }

      // Cash Flow - produtos
      if (productsRevenue > 0) {
        await supabase.from('cash_flow').insert({
          transaction_type: 'income',
          amount: productsRevenue,
          description: `Venda produtos - Checkout admin (${barberName})`,
          category: 'produto',
          payment_method: payMethod,
          transaction_date: today,
          reference_id: novaVenda.id,
          notes: addedProductsData.map(p => `${p.nome} x${p.quantidade}`).join(', ')
        })
        console.log('✅ Cash flow (produtos):', productsRevenue)
      }

      // Cash Flow - comissão (despesa)
      if (shouldPayCommission && commissionAmount > 0) {
        await supabase.from('cash_flow').insert({
          transaction_type: 'expense',
          amount: commissionAmount,
          description: `Comissão ${barberName} - ${nomeServico}${type === 'courtesy' ? ' (cortesia)' : ''}`,
          category: 'comissao',
          payment_method: payMethod,
          transaction_date: today,
          reference_id: novaVenda.id,
          notes: `Comissão ${COMMISSION_RATE}% sobre R$ ${commissionBase.toFixed(2)}`
        })
        console.log('✅ Cash flow (comissão):', commissionAmount)
      }

      // 9. Update session + appointment
      if (appointmentSession) {
        await supabase
          .from('appointment_totem_sessions')
          .update({ status: 'completed' })
          .eq('id', appointmentSession.id)

        if (appointmentSession.totem_session_id) {
          await supabase
            .from('totem_sessions')
            .update({ is_valid: false })
            .eq('id', appointmentSession.totem_session_id)
        }
      }

      await supabase
        .from('painel_agendamentos')
        .update({
          status: 'concluido',
          status_totem: 'FINALIZADO',
          venda_id: novaVenda.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', appointment_id)

      console.log('✅ Checkout admin finalizado!', { type, revenueAmount, commissionAmount })

      return new Response(
        JSON.stringify({
          success: true,
          message: type === 'courtesy' ? 'Cortesia registrada com sucesso' : 'Checkout realizado com sucesso',
          session_id,
          venda_id: novaVenda.id,
          appointment_id,
          checkout_type: type,
          revenue: revenueAmount,
          commission: commissionAmount,
          pay_commission: shouldPayCommission
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Action inválida. Use "list" ou "force_checkout"' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )

  } catch (error) {
    console.error('❌ Erro em pending-checkouts:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
