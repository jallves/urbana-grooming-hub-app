import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

/**
 * Edge Function: create-financial-transaction
 * Cria transações financeiras completas no sistema ERP
 * - Receitas: produtos e serviços separados
 * - Comissões: 40% apenas para serviços
 * - Inclui forma de pagamento, data e horário completo
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
      payment_method: rawPaymentMethod,
      discount_amount = 0,
      notes
    } = await req.json()

    // Mapear payment_method do totem para os valores corretos do ENUM
    const paymentMethodMap: Record<string, string> = {
      'credit': 'credit_card',
      'debit': 'debit_card',
      'pix': 'pix',
      'cash': 'cash',
      'bank_transfer': 'bank_transfer',
      // Aceitar também os valores corretos diretamente
      'credit_card': 'credit_card',
      'debit_card': 'debit_card'
    }

    const payment_method = paymentMethodMap[rawPaymentMethod] || rawPaymentMethod

    console.log('💰 Criando transação financeira:', {
      appointment_id,
      client_id,
      barber_id,
      items: items?.length,
      payment_method_original: rawPaymentMethod,
      payment_method_normalized: payment_method
    })

    // Validar dados obrigatórios
    if (!items || items.length === 0) {
      throw new Error('Nenhum item fornecido para a transação')
    }

    if (!payment_method) {
      throw new Error('Forma de pagamento é obrigatória')
    }

    // Validar que o payment_method é válido
    const validPaymentMethods = ['cash', 'credit_card', 'debit_card', 'pix', 'bank_transfer']
    if (!validPaymentMethods.includes(payment_method)) {
      throw new Error(`Forma de pagamento inválida: ${payment_method}. Use: ${validPaymentMethods.join(', ')}`)
    }

    const now = new Date()
    const transactionDate = now.toISOString().split('T')[0]
    const transactionDateTime = now.toISOString()

    // Separar itens por tipo
    const serviceItems = items.filter((i: any) => i.type === 'service')
    const productItems = items.filter((i: any) => i.type === 'product')

    console.log('📦 Itens separados:', {
      services: serviceItems.length,
      products: productItems.length
    })

    const createdRecords = []

    // ========================================
    // PROCESSAR SERVIÇOS
    // ========================================
    for (const service of serviceItems) {
      // Buscar nome real do serviço do banco de dados
      const { data: serviceData, error: serviceDataError } = await supabase
        .from('painel_servicos')
        .select('nome, preco')
        .eq('id', service.id)
        .single()

      if (serviceDataError || !serviceData) {
        console.error('❌ Serviço não encontrado:', service.id, serviceDataError)
        throw new Error(`Serviço não encontrado: ${service.id}`)
      }

      const serviceName = serviceData.nome
      const serviceGrossAmount = service.quantity * service.price
      const serviceDiscount = service.discount || 0
      const serviceNetAmount = serviceGrossAmount - serviceDiscount

      console.log('📋 Processando serviço:', {
        id: service.id,
        name: serviceName,
        price: service.price
      })

      // Gerar número de transação único
      const { data: transactionNumber } = await supabase
        .rpc('generate_transaction_number')

      if (!transactionNumber) {
        throw new Error('Erro ao gerar número de transação')
      }

      // 1. Criar registro financeiro de RECEITA para o serviço
      const { data: serviceRecord, error: serviceError } = await supabase
        .from('financial_records')
        .insert({
          transaction_number: transactionNumber,
          transaction_type: 'revenue',
          category: 'services',
          subcategory: 'service',
          gross_amount: serviceGrossAmount,
          discount_amount: serviceDiscount,
          tax_amount: 0,
          net_amount: serviceNetAmount,
          status: 'completed',
          description: `Serviço: ${serviceName}`,
          notes,
          transaction_date: transactionDate,
          completed_at: transactionDateTime,
          appointment_id,
          client_id,
          barber_id,
          metadata: {
            source: appointment_id ? 'appointment' : 'direct_sale',
            service_id: service.id,
            service_name: serviceName,
            payment_time: transactionDateTime
          }
        })
        .select()
        .single()

      if (serviceError) {
        console.error('❌ Erro ao criar registro de serviço:', serviceError)
        throw new Error(`Erro ao criar registro de serviço: ${service.name}`)
      }

      console.log('✅ Receita de serviço criada:', {
        id: serviceRecord.id,
        service: serviceName,
        amount: serviceNetAmount
      })

      // 2. Criar item da transação
      await supabase
        .from('transaction_items')
        .insert({
          financial_record_id: serviceRecord.id,
          item_type: 'service',
          item_id: service.id,
          item_name: serviceName,
          quantity: service.quantity,
          unit_price: service.price,
          discount: serviceDiscount,
          subtotal: serviceNetAmount,
          metadata: {}
        })

      // 3. Criar registro de pagamento com forma de pagamento e data/hora
      const { data: paymentNumber } = await supabase
        .rpc('generate_payment_number')

      if (!paymentNumber) {
        throw new Error('Erro ao gerar número de pagamento')
      }

      const { error: paymentError } = await supabase
        .from('payment_records')
        .insert({
          payment_number: paymentNumber,
          financial_record_id: serviceRecord.id,
          payment_method,
          amount: serviceNetAmount,
          status: 'paid',
          payment_date: transactionDateTime,
          confirmed_at: transactionDateTime,
          metadata: {
            payment_datetime: transactionDateTime,
            payment_time: now.toLocaleTimeString('pt-BR'),
            payment_date_formatted: now.toLocaleDateString('pt-BR')
          }
        })

      if (paymentError) {
        console.error('❌ Erro ao criar pagamento:', paymentError)
        throw new Error('Erro ao criar registro de pagamento')
      }

      console.log('✅ Pagamento registrado:', {
        method: payment_method,
        datetime: transactionDateTime
      })

      // 4. Criar COMISSÃO de 40% para o serviço (Contas a Pagar)
      if (barber_id) {
        const commissionRate = 40 // 40% fixo
        const commissionAmount = serviceNetAmount * (commissionRate / 100)

        const { data: commissionRecord, error: commissionError } = await supabase
          .from('financial_records')
          .insert({
            transaction_number: `COM-${transactionNumber}`,
            transaction_type: 'commission',
            category: 'staff_payments',
            subcategory: 'commission',
            gross_amount: commissionAmount,
            discount_amount: 0,
            tax_amount: 0,
            net_amount: commissionAmount,
            status: 'pending', // Comissões sempre pendentes
            description: `Comissão ${commissionRate}% - Serviço: ${serviceName}`,
            notes: `Comissão sobre serviço realizado`,
            transaction_date: transactionDate,
            appointment_id,
            client_id,
            barber_id,
            metadata: {
              commission_rate: commissionRate,
              source_transaction: serviceRecord.id,
              service_id: service.id,
              service_name: serviceName,
              service_amount: serviceNetAmount
            }
          })
          .select()
          .single()

        if (commissionError) {
          console.error('❌ Erro ao criar comissão:', commissionError)
          throw new Error('Erro ao criar comissão')
        }

        // Criar também na tabela de comissões do barbeiro
        await supabase
          .from('barber_commissions')
          .insert({
            barber_id,
            appointment_id,
            amount: commissionAmount,
            commission_rate: commissionRate,
            status: 'pending',
            appointment_source: appointment_id ? 'painel' : 'totem'
          })

        console.log('✅ Comissão criada:', {
          id: commissionRecord.id,
          rate: commissionRate,
          amount: commissionAmount,
          service: serviceName
        })
      }

      createdRecords.push({
        type: 'service',
        name: serviceName,
        revenue_id: serviceRecord.id,
        amount: serviceNetAmount
      })
    }

    // ========================================
    // PROCESSAR PRODUTOS
    // ========================================
    for (const product of productItems) {
      // Buscar nome real do produto do banco de dados
      const { data: productData, error: productDataError } = await supabase
        .from('painel_produtos')
        .select('nome, preco')
        .eq('id', product.id)
        .single()

      if (productDataError || !productData) {
        console.error('❌ Produto não encontrado:', product.id, productDataError)
        throw new Error(`Produto não encontrado: ${product.id}`)
      }

      const productName = productData.nome
      const productGrossAmount = product.quantity * product.price
      const productDiscount = product.discount || 0
      const productNetAmount = productGrossAmount - productDiscount

      console.log('📦 Processando produto:', {
        id: product.id,
        name: productName,
        price: product.price
      })

      // Gerar número de transação único
      const { data: transactionNumber } = await supabase
        .rpc('generate_transaction_number')

      if (!transactionNumber) {
        throw new Error('Erro ao gerar número de transação')
      }

      // 1. Criar registro financeiro de RECEITA para o produto (APENAS CONTAS A RECEBER)
      const { data: productRecord, error: productError } = await supabase
        .from('financial_records')
        .insert({
          transaction_number: transactionNumber,
          transaction_type: 'revenue',
          category: 'products',
          subcategory: 'product',
          gross_amount: productGrossAmount,
          discount_amount: productDiscount,
          tax_amount: 0,
          net_amount: productNetAmount,
          status: 'completed',
          description: `Produto: ${productName}`,
          notes,
          transaction_date: transactionDate,
          completed_at: transactionDateTime,
          appointment_id,
          client_id,
          barber_id: null, // Produtos não têm comissão, então não vincula barbeiro
          metadata: {
            source: appointment_id ? 'appointment' : 'direct_sale',
            product_id: product.id,
            product_name: productName,
            payment_time: transactionDateTime
          }
        })
        .select()
        .single()

      if (productError) {
        console.error('❌ Erro ao criar registro de produto:', productError)
        throw new Error(`Erro ao criar registro de produto: ${product.name}`)
      }

      console.log('✅ Receita de produto criada:', {
        id: productRecord.id,
        product: productName,
        amount: productNetAmount
      })

      // 2. Criar item da transação
      await supabase
        .from('transaction_items')
        .insert({
          financial_record_id: productRecord.id,
          item_type: 'product',
          item_id: product.id,
          item_name: productName,
          quantity: product.quantity,
          unit_price: product.price,
          discount: productDiscount,
          subtotal: productNetAmount,
          metadata: {}
        })

      // 3. Criar registro de pagamento com forma de pagamento e data/hora
      const { data: paymentNumber } = await supabase
        .rpc('generate_payment_number')

      if (!paymentNumber) {
        throw new Error('Erro ao gerar número de pagamento')
      }

      const { error: paymentError } = await supabase
        .from('payment_records')
        .insert({
          payment_number: paymentNumber,
          financial_record_id: productRecord.id,
          payment_method,
          amount: productNetAmount,
          status: 'paid',
          payment_date: transactionDateTime,
          confirmed_at: transactionDateTime,
          metadata: {
            payment_datetime: transactionDateTime,
            payment_time: now.toLocaleTimeString('pt-BR'),
            payment_date_formatted: now.toLocaleDateString('pt-BR')
          }
        })

      if (paymentError) {
        console.error('❌ Erro ao criar pagamento de produto:', paymentError)
        throw new Error('Erro ao criar registro de pagamento do produto')
      }

      console.log('✅ Pagamento de produto registrado:', {
        method: payment_method,
        datetime: transactionDateTime
      })

      // 4. Atualizar estoque do produto
      await supabase.rpc('update_product_stock', {
        product_id: product.id,
        quantity: -product.quantity
      })

      console.log('✅ Estoque atualizado:', {
        product: productName,
        quantity: -product.quantity
      })

      createdRecords.push({
        type: 'product',
        name: productName,
        revenue_id: productRecord.id,
        amount: productNetAmount
      })
    }

    // Calcular totais
    const totalRevenue = createdRecords.reduce((sum, r) => sum + r.amount, 0)
    const totalCommissions = serviceItems.length > 0 && barber_id 
      ? serviceItems.reduce((sum: number, s: any) => {
          const netAmount = (s.quantity * s.price) - (s.discount || 0)
          return sum + (netAmount * 0.4)
        }, 0)
      : 0

    console.log('✅ Transação financeira concluída:', {
      total_items: createdRecords.length,
      services: serviceItems.length,
      products: productItems.length,
      total_revenue: totalRevenue,
      total_commissions: totalCommissions,
      payment_method,
      datetime: transactionDateTime
    })

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Transação financeira criada com sucesso',
        data: {
          records: createdRecords,
          summary: {
            total_items: createdRecords.length,
            services_count: serviceItems.length,
            products_count: productItems.length,
            total_revenue: totalRevenue,
            total_commissions: totalCommissions,
            payment_method,
            transaction_datetime: transactionDateTime,
            transaction_date: transactionDate
          }
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
