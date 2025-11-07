import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

/**
 * Edge Function: create-financial-transaction
 * Cria transações financeiras completas no sistema ERP
 * Integra serviços + produtos + pagamentos
 */

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const {
      appointment_id,
      client_id,
      barber_id,
      items, // Array de { type: 'service' | 'product', id, name, quantity, price, discount }
      payment_method,
      discount_amount = 0,
      notes
    } = await req.json()

    console.log('💰 Criando transação financeira:', {
      appointment_id,
      client_id,
      items: items?.length
    })

    // Validar dados obrigatórios
    if (!items || items.length === 0) {
      throw new Error('Nenhum item fornecido para a transação')
    }

    // 1. Calcular valores totais
    const gross_amount = items.reduce((sum: number, item: any) => 
      sum + (item.quantity * item.price), 0
    )
    
    const total_discount = discount_amount + items.reduce((sum: number, item: any) => 
      sum + (item.discount || 0), 0
    )
    
    const net_amount = gross_amount - total_discount

    console.log('📊 Valores calculados:', {
      gross_amount,
      total_discount,
      net_amount
    })

    // 2. Gerar número de transação único
    const { data: transactionNumber } = await supabase
      .rpc('generate_transaction_number')

    if (!transactionNumber) {
      throw new Error('Erro ao gerar número de transação')
    }

    // 3. Criar registro financeiro principal
    const { data: financialRecord, error: recordError } = await supabase
      .from('financial_records')
      .insert({
        transaction_number: transactionNumber,
        transaction_type: 'revenue',
        category: 'service',
        subcategory: items.find((i: any) => i.type === 'product') ? 'service_product' : 'service_only',
        gross_amount,
        discount_amount: total_discount,
        net_amount,
        status: payment_method === 'pix' ? 'pending' : 'completed',
        description: `Atendimento ${appointment_id ? `#${appointment_id}` : 'direto'}`,
        notes,
        transaction_date: new Date().toISOString().split('T')[0],
        completed_at: payment_method !== 'pix' ? new Date().toISOString() : null,
        appointment_id,
        client_id,
        barber_id,
        metadata: {
          source: appointment_id ? 'appointment' : 'direct_sale',
          items_count: items.length
        }
      })
      .select()
      .single()

    if (recordError) {
      console.error('❌ Erro ao criar registro financeiro:', recordError)
      throw new Error('Erro ao criar registro financeiro')
    }

    console.log('✅ Registro financeiro criado:', financialRecord.id)

    // 4. Criar itens da transação
    const transactionItems = items.map((item: any) => ({
      financial_record_id: financialRecord.id,
      item_type: item.type,
      item_id: item.id,
      item_name: item.name,
      quantity: item.quantity,
      unit_price: item.price,
      discount: item.discount || 0,
      subtotal: (item.quantity * item.price) - (item.discount || 0)
    }))

    const { error: itemsError } = await supabase
      .from('transaction_items')
      .insert(transactionItems)

    if (itemsError) {
      console.error('❌ Erro ao criar itens:', itemsError)
      throw new Error('Erro ao criar itens da transação')
    }

    console.log('✅ Itens criados:', transactionItems.length)

    // 5. Criar registro de pagamento
    const { data: paymentNumber } = await supabase
      .rpc('generate_payment_number')

    if (!paymentNumber) {
      throw new Error('Erro ao gerar número de pagamento')
    }

    const { data: paymentRecord, error: paymentError } = await supabase
      .from('payment_records')
      .insert({
        payment_number: paymentNumber,
        financial_record_id: financialRecord.id,
        payment_method,
        amount: net_amount,
        status: payment_method === 'pix' ? 'pending' : 'paid',
        payment_date: payment_method !== 'pix' ? new Date().toISOString() : null,
        confirmed_at: payment_method !== 'pix' ? new Date().toISOString() : null
      })
      .select()
      .single()

    if (paymentError) {
      console.error('❌ Erro ao criar registro de pagamento:', paymentError)
      throw new Error('Erro ao criar registro de pagamento')
    }

    console.log('✅ Pagamento registrado:', paymentRecord.id)

    // 6. Atualizar estoque de produtos (se houver)
    for (const item of items.filter((i: any) => i.type === 'product')) {
      await supabase.rpc('update_product_stock', {
        product_id: item.id,
        quantity: -item.quantity
      })
    }

    // 7. Gerar comissão do barbeiro (se houver)
    if (barber_id) {
      const { data: staff } = await supabase
        .from('staff')
        .select('commission_rate')
        .eq('id', barber_id)
        .single()

      if (staff?.commission_rate) {
        const commission_amount = net_amount * (staff.commission_rate / 100)

        // Criar registro de comissão
        await supabase
          .from('financial_records')
          .insert({
            transaction_number: `COM-${transactionNumber}`,
            transaction_type: 'commission',
            category: 'barber_commission',
            gross_amount: commission_amount,
            net_amount: commission_amount,
            status: 'pending',
            description: `Comissão ${staff.commission_rate}% - ${transactionNumber}`,
            transaction_date: new Date().toISOString().split('T')[0],
            appointment_id,
            client_id,
            barber_id,
            metadata: {
              commission_rate: staff.commission_rate,
              source_transaction: financialRecord.id
            }
          })

        // Criar na tabela de comissões do barbeiro
        await supabase
          .from('barber_commissions')
          .insert({
            barber_id,
            appointment_id,
            amount: commission_amount,
            commission_rate: staff.commission_rate,
            status: 'pending',
            appointment_source: appointment_id ? 'painel' : 'totem'
          })

        console.log('✅ Comissão gerada:', commission_amount)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Transação financeira criada com sucesso',
        data: {
          financial_record_id: financialRecord.id,
          transaction_number: transactionNumber,
          payment_number: paymentNumber,
          gross_amount,
          discount_amount: total_discount,
          net_amount,
          status: financialRecord.status,
          payment_status: paymentRecord.status
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Erro ao criar transação financeira:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
