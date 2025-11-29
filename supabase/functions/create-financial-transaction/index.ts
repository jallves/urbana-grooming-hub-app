import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

// Função auxiliar para obter data/hora no timezone do Brasil
function getBrazilDateTime() {
  const now = new Date();
  // Converter para timezone do Brasil (UTC-3)
  const brazilTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  return {
    date: brazilTime.toISOString().split('T')[0], // YYYY-MM-DD
    datetime: brazilTime.toISOString()
  };
}

/**
 * Edge Function: create-financial-transaction
 * Cria transações financeiras completas no sistema ERP
 * - Receitas: produtos e serviços separados
 * - Comissões para serviços: 40% baseado na configuração do barbeiro
 * - Comissões para produtos: baseado na configuração individual de cada produto (% ou valor fixo)
 * - Sempre cria registro de comissão, mesmo se valor for R$ 0,00
 * - Inclui forma de pagamento, data e horário completo
 * - Sistema de retry automático em caso de falhas
 * - Logs de erro para monitoramento
 */

// Função auxiliar para registrar erros
async function logError(
  supabase: any,
  errorType: string,
  appointmentId: string | null,
  sessionId: string | null,
  errorMessage: string,
  errorDetails: any,
  stackTrace?: string
) {
  try {
    await supabase
      .from('integration_error_logs')
      .insert({
        error_type: errorType,
        appointment_id: appointmentId,
        session_id: sessionId,
        error_message: errorMessage,
        error_details: errorDetails,
        stack_trace: stackTrace,
        status: 'pending'
      })
    console.log('📝 Erro registrado no sistema de monitoramento')
  } catch (logErr) {
    console.error('❌ Falha ao registrar erro:', logErr)
  }
}

// Função auxiliar para retry com backoff exponencial
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error: any) {
      lastError = error
      
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt)
        console.log(`⚠️ Tentativa ${attempt + 1}/${maxRetries + 1} falhou. Aguardando ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  
  throw lastError
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  let appointment_id: string | null = null
  let session_id: string | null = null

  try {

    const requestBody = await req.json()
    appointment_id = requestBody.appointment_id
    session_id = requestBody.session_id || null
    
    const {
      client_id,
      barber_id,
      items, // Array de { type: 'service' | 'product', id, name, quantity, price, discount }
      payment_method: rawPaymentMethod,
      discount_amount = 0,
      notes,
      transaction_date: providedTransactionDate,
      transaction_datetime: providedTransactionDateTime,
      error_log_id // ID do log de erro se for um reprocessamento
    } = requestBody

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

    // Buscar data/hora do agendamento se disponível
    let transactionDate = providedTransactionDate
    let transactionDateTime = providedTransactionDateTime

    if (appointment_id && (!transactionDate || !transactionDateTime)) {
      const { data: appointmentData } = await supabase
        .from('painel_agendamentos')
        .select('data, hora')
        .eq('id', appointment_id)
        .single()

      if (appointmentData) {
        // Usar data e hora do agendamento
        transactionDate = appointmentData.data
        // appointmentData.hora já vem no formato HH:MM:SS, não adicionar segundos extras
        transactionDateTime = `${appointmentData.data}T${appointmentData.hora}`
        console.log('📅 Usando data/hora do agendamento:', { date: transactionDate, datetime: transactionDateTime })
      }
    }

    // Se ainda não tiver, usar data/hora atual DO BRASIL
    if (!transactionDate || !transactionDateTime) {
      const brazilTime = getBrazilDateTime();
      transactionDate = brazilTime.date;
      transactionDateTime = brazilTime.datetime;
      console.log('⏰ Usando data/hora atual do Brasil:', { date: transactionDate, datetime: transactionDateTime })
    }
    
    // IMPORTANTE: Sempre garantir que a transaction_date seja a data CORRETA do Brasil
    // Se temos um datetime, extrair a data dele considerando timezone do Brasil
    if (transactionDateTime) {
      const dt = new Date(transactionDateTime);
      const brazilDateStr = dt.toLocaleString('en-US', { 
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit', 
        day: '2-digit'
      });
      // Converter de MM/DD/YYYY para YYYY-MM-DD
      const [month, day, year] = brazilDateStr.split('/');
      transactionDate = `${year}-${month}-${day}`;
      console.log('📅 Data corrigida para timezone do Brasil:', transactionDate);
    }

    console.log('💰 Criando transação financeira:', {
      appointment_id,
      client_id,
      barber_id,
      items: items?.length,
      payment_method_original: rawPaymentMethod,
      payment_method_normalized: payment_method,
      transaction_date: transactionDate,
      transaction_datetime: transactionDateTime
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

      // 1. Criar registro financeiro de RECEITA para o serviço (com retry)
      const serviceRecord = await retryWithBackoff(async () => {
        const { data, error } = await supabase
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
              payment_method: payment_method,
              payment_time: transactionDateTime
            }
          })
          .select()
          .single()

        if (error) throw error
        return data
      })

      console.log('✅ Receita de serviço criada:', {
        id: serviceRecord.id,
        service: serviceName,
        amount: serviceNetAmount
      })

      // 2. Criar item da transação com source_table
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
          source_table: 'painel_servicos', // ✅ RASTREAMENTO DE ORIGEM
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
            payment_time: new Date(transactionDateTime).toLocaleTimeString('pt-BR'),
            payment_date_formatted: new Date(transactionDateTime).toLocaleDateString('pt-BR')
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

      // 4. Criar COMISSÃO para o serviço (Contas a Pagar)
      if (barber_id) {
        // Buscar taxa de comissão do barbeiro
        const { data: barberData, error: barberError } = await supabase
          .from('staff')
          .select('commission_rate')
          .eq('id', barber_id)
          .single()

        if (barberError) {
          console.error('❌ Erro ao buscar comissão do barbeiro:', barberError)
        }

        const commissionRate = barberData?.commission_rate || 40 // Default 40%
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

      // 1. Criar registro financeiro de RECEITA para o produto
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
          barber_id, // ✅ INCLUIR barbeiro para produtos também
          metadata: {
            source: appointment_id ? 'appointment' : 'direct_sale',
            product_id: product.id,
            product_name: productName,
            payment_method: payment_method,
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

      // 2. Criar item da transação com source_table
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
          source_table: 'painel_produtos', // ✅ RASTREAMENTO DE ORIGEM
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
            payment_time: new Date(transactionDateTime).toLocaleTimeString('pt-BR'),
            payment_date_formatted: new Date(transactionDateTime).toLocaleDateString('pt-BR')
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

      // 5. Criar COMISSÃO para produtos (se houver barbeiro)
      // ✅ BUSCAR COMISSÃO DO PRODUTO, NÃO DO BARBEIRO
      if (barber_id) {
        // Buscar configuração de comissão do PRODUTO
        const { data: productData, error: productError } = await supabase
          .from('painel_produtos')
          .select('commission_percentage, commission_value')
          .eq('id', product.id)
          .single()

        if (productError) {
          console.error('❌ Erro ao buscar comissão do produto:', productError)
        }

        // Calcular comissão baseada no produto
        let commissionAmount = 0
        let commissionType = 'none'
        let commissionRate = 0

        if (productData) {
          // Priorizar valor fixo sobre percentual
          if (productData.commission_value && productData.commission_value > 0) {
            // Comissão por valor fixo por unidade
            commissionAmount = productData.commission_value * product.quantity
            commissionType = 'fixed_value'
            console.log('💰 Comissão por valor fixo:', {
              value_per_unit: productData.commission_value,
              quantity: product.quantity,
              total: commissionAmount
            })
          } else if (productData.commission_percentage && productData.commission_percentage > 0) {
            // Comissão por percentual
            commissionRate = productData.commission_percentage
            commissionAmount = productNetAmount * (commissionRate / 100)
            commissionType = 'percentage'
            console.log('💰 Comissão por percentual:', {
              rate: `${commissionRate}%`,
              base_amount: productNetAmount,
              total: commissionAmount
            })
          } else {
            console.log('ℹ️ Produto sem comissão configurada - criando registro com valor R$ 0,00')
          }
        }

        // ✅ SEMPRE criar comissão, mesmo que seja R$ 0,00
        console.log('💰 Criando comissão de produto:', {
          barber_id,
          product: productName,
          type: commissionType,
          amount: commissionAmount
        })

        // Gerar número de transação para comissão
        const { data: commissionTransactionNumber } = await supabase
          .rpc('generate_transaction_number')

        if (commissionTransactionNumber) {
          // Criar registro financeiro de COMISSÃO (Contas a Pagar)
          const { data: commissionRecord, error: commissionError } = await supabase
            .from('financial_records')
            .insert({
              transaction_number: commissionTransactionNumber,
              transaction_type: 'commission',
              category: 'products',
              subcategory: 'product_commission',
              gross_amount: commissionAmount,
              discount_amount: 0,
              tax_amount: 0,
              net_amount: commissionAmount,
              status: 'pending',
              description: `Comissão produto: ${productName}`,
              notes: commissionType === 'percentage' 
                ? `${commissionRate}% sobre produto`
                : commissionType === 'fixed_value'
                  ? `Valor fixo: R$ ${productData?.commission_value || 0} por unidade`
                  : 'Produto sem comissão configurada',
              transaction_date: transactionDate,
              appointment_id,
              client_id,
              barber_id,
              metadata: {
                source: appointment_id ? 'appointment' : 'direct_sale',
                product_id: product.id,
                product_name: productName,
                commission_type: commissionType,
                commission_percentage: commissionRate || null,
                commission_value: productData?.commission_value || null,
                base_amount: productNetAmount
              }
            })
            .select()
            .single()

          if (commissionError) {
            console.error('❌ Erro ao criar registro de comissão:', commissionError)
          } else {
            console.log('✅ Comissão de produto registrada:', {
              id: commissionRecord.id,
              amount: commissionAmount,
              type: commissionType
            })

            // Criar registro em barber_commissions
            const { error: barberCommissionError } = await supabase
              .from('barber_commissions')
              .insert({
                barber_id,
                appointment_id,
                amount: commissionAmount,
                commission_rate: commissionRate || 0,
                status: 'pending',
                appointment_source: appointment_id ? 'totem_appointment' : 'totem_product'
              })

            if (barberCommissionError) {
              console.error('❌ Erro ao criar barber_commission:', barberCommissionError)
            } else {
              console.log('✅ Barber commission criada:', {
                amount: commissionAmount,
                rate: commissionRate
              })
            }
          }
        }
      }

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
    
    // Se for um reprocessamento, marcar erro como resolvido
    if (error_log_id) {
      await supabase.rpc('mark_error_resolved', { p_error_log_id: error_log_id })
      console.log('✅ Erro marcado como resolvido:', error_log_id)
    }

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

  } catch (error: any) {
    console.error('❌ Erro ao criar transação financeira:', error)
    
    // Registrar erro no sistema de monitoramento
    await logError(
      supabase,
      'financial_transaction',
      appointment_id,
      session_id,
      error.message || 'Erro desconhecido ao criar transação financeira',
      {
        error: error.toString(),
        stack: error.stack
      },
      error.stack
    )
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erro desconhecido',
        logged: true // Indica que o erro foi registrado para retry
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
