import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, CreditCard, CheckCircle2, Loader2, WifiOff } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { TotemErrorFeedback } from '@/components/totem/TotemErrorFeedback';
import { useTEFAndroid } from '@/hooks/useTEFAndroid';
import barbershopBg from '@/assets/barbershop-background.jpg';

const TotemProductPaymentCard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { sale, client, cardType, barber } = location.state || {};
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<{ title: string; message: string } | null>(null);

  // Hook TEF Android - conexão real com PayGo
  const {
    isAndroidAvailable,
    isPinpadConnected,
    isProcessing: tefProcessing,
    iniciarPagamento: iniciarPagamentoTEF,
    cancelarPagamento: cancelarPagamentoTEF
  } = useTEFAndroid({
    onSuccess: async (resultado) => {
      console.log('✅ [TEF Produto] Pagamento aprovado:', resultado);
      await handlePaymentSuccess(resultado);
    },
    onError: (erro) => {
      console.error('❌ [TEF Produto] Erro no pagamento:', erro);
      toast.error('Pagamento negado', { description: erro });
      setError({ title: 'Pagamento Negado', message: erro });
      setIsProcessing(false);
    },
    onCancelled: () => {
      console.log('⚠️ [TEF Produto] Pagamento cancelado');
      toast.info('Pagamento cancelado');
      setIsProcessing(false);
    }
  });

  // Iniciar pagamento quando tiver cardType e TEF disponível
  useEffect(() => {
    console.log('💳 [TotemProductPaymentCard] ========== ESTADO TEF ==========');
    console.log('💳 [TotemProductPaymentCard] isAndroidAvailable:', isAndroidAvailable);
    console.log('💳 [TotemProductPaymentCard] isPinpadConnected:', isPinpadConnected);
    console.log('💳 [TotemProductPaymentCard] cardType:', cardType);
    console.log('💳 [TotemProductPaymentCard] isProcessing:', isProcessing);
    console.log('💳 [TotemProductPaymentCard] tefProcessing:', tefProcessing);
    console.log('💳 [TotemProductPaymentCard] sale:', sale?.id);
    console.log('💳 [TotemProductPaymentCard] window.TEF:', typeof window.TEF);
    console.log('💳 [TotemProductPaymentCard] ==========================================');
    
    if (!sale || !client || !barber) {
      toast.error('Dados incompletos');
      navigate('/totem/home');
      return;
    }

    // Se TEF está disponível e conectado, iniciar pagamento
    if (isAndroidAvailable && isPinpadConnected && cardType && !isProcessing && !tefProcessing) {
      console.log('💳 [TotemProductPaymentCard] ✅ Todas condições OK - iniciando pagamento real');
      iniciarPagamentoReal();
    } else {
      console.log('💳 [TotemProductPaymentCard] ⚠️ Condições não atendidas para pagamento');
    }
  }, [sale, client, barber, isAndroidAvailable, isPinpadConnected, cardType]);

  // Fallback: verificar sessionStorage para resultado pendente do PayGo
  useEffect(() => {
    if (!isProcessing) return;
    
    const checkStoredResult = () => {
      try {
        const storedResult = sessionStorage.getItem('lastTefResult');
        const storedTime = sessionStorage.getItem('lastTefResultTime');
        
        if (storedResult && storedTime) {
          const resultAge = Date.now() - parseInt(storedTime, 10);
          // Se o resultado foi salvo nos últimos 30 segundos
          if (resultAge < 30000) {
            const resultado = JSON.parse(storedResult);
            console.log('🔄 [PRODUCT-CARD] Recuperando resultado do sessionStorage:', resultado);
            
            // Limpar storage para evitar reprocessamento
            sessionStorage.removeItem('lastTefResult');
            sessionStorage.removeItem('lastTefResultTime');
            
            if (resultado.status === 'aprovado') {
              console.log('✅ [PRODUCT-CARD] Pagamento aprovado via fallback, finalizando...');
              handlePaymentSuccess({
                nsu: resultado.nsu || resultado.transactionNsu,
                autorizacao: resultado.autorizacao || resultado.authorizationCode,
                bandeira: resultado.bandeira || resultado.cardName
              });
            } else if (resultado.status === 'cancelado' || resultado.status === 'negado') {
              console.log('❌ [PRODUCT-CARD] Pagamento negado/cancelado via fallback');
              setIsProcessing(false);
              toast.error('Pagamento não aprovado', { description: resultado.mensagem || resultado.resultMessage });
            }
          }
        }
      } catch (e) {
        console.error('❌ [PRODUCT-CARD] Erro ao verificar sessionStorage:', e);
      }
    };
    
    // Verificar periodicamente enquanto está processando
    const interval = setInterval(checkStoredResult, 1000);
    return () => clearInterval(interval);
  }, [isProcessing]);

  const iniciarPagamentoReal = async () => {
    if (!isAndroidAvailable || !isPinpadConnected) {
      return;
    }

    console.log('💳 [TEF Produto] Iniciando pagamento:', {
      tipo: cardType,
      valor: sale.total,
      venda_id: sale.id
    });

    setIsProcessing(true);

    const success = await iniciarPagamentoTEF({
      ordemId: sale.id,
      valor: sale.total,
      tipo: cardType === 'debit' ? 'debit' : 'credit',
      parcelas: 1
    });

    if (!success) {
      console.error('❌ [TEF Produto] Falha ao iniciar TEF');
      toast.error('Erro ao iniciar pagamento', {
        description: 'Verifique a conexão com o pinpad'
      });
      setIsProcessing(false);
    }
  };

  const handleCancelPayment = () => {
    cancelarPagamentoTEF();
    setIsProcessing(false);
    navigate(-1);
  };

  const handlePaymentSuccess = async (transactionData?: {
    nsu?: string;
    autorizacao?: string;
    bandeira?: string;
  }) => {
    try {
      console.log('✅ Pagamento no cartão aprovado! Finalizando venda...');
      console.log('   📝 Transaction Data:', transactionData);
      
      // 1. Buscar itens da venda
      const { data: saleItems, error: itemsError } = await supabase
        .from('vendas_itens')
        .select('*')
        .eq('venda_id', sale.id)
        .eq('tipo', 'PRODUTO');

      if (itemsError) {
        console.error('Erro ao buscar itens:', itemsError);
        setError({
          title: 'Erro ao processar venda',
          message: 'Não foi possível buscar os itens da venda. Procure um atendente.'
        });
        return;
      }

      // 2. Atualizar estoque de cada produto
      if (saleItems && saleItems.length > 0) {
        for (const item of saleItems) {
          const { error: stockError } = await supabase.rpc('decrease_product_stock', {
            p_product_id: item.ref_id,
            p_quantity: item.quantidade
          });

          if (stockError) {
            console.error('Erro ao atualizar estoque:', stockError);
          }
        }
      }

      // 3. Preparar itens para o ERP (formato CheckoutItem)
      const erpItems = saleItems.map(item => ({
        type: 'product' as const,
        id: item.ref_id,
        name: item.nome,
        quantity: item.quantidade,
        price: Number(item.preco_unit),
        discount: 0
      }))

      // Normalizar payment method para valores corretos do ENUM
      const normalizedPaymentMethod = cardType === 'debit' ? 'debit_card' : 'credit_card'

      console.log('💰 Integrando venda de produtos com ERP Financeiro e comissões...', {
        client_id: sale.cliente_id,
        barber_id: barber.staff_id,
        items_count: erpItems.length,
        payment_method_original: cardType,
        payment_method_normalized: normalizedPaymentMethod,
        total: sale.total
      })

      // 4. Chamar edge function para criar registros financeiros (produtos + comissões)
      const { data: erpResult, error: erpError } = await supabase.functions.invoke(
        'create-financial-transaction',
        {
          body: {
            client_id: sale.cliente_id,
            barber_id: barber.staff_id,
            items: erpItems,
            payment_method: normalizedPaymentMethod,
            discount_amount: Number(sale.desconto) || 0,
            notes: `Venda de Produtos - Totem ${cardType === 'debit' ? 'Débito' : 'Crédito'} - Barbeiro: ${barber.nome}`,
            transaction_data: transactionData // Incluir dados TEF
          }
        }
      )

      if (erpError) {
        console.error('❌ Erro ao integrar com ERP:', erpError)
        console.log('⚠️ Continuando finalização sem integração ERP')
      } else {
        console.log('✅ ERP Financeiro integrado com sucesso (produtos):', erpResult)
      }

      // 5. Atualizar venda para PAGA
      const { error } = await supabase
        .from('vendas')
        .update({
          status: 'PAGA',
          updated_at: new Date().toISOString()
        })
        .eq('id', sale.id);

      if (error) {
        console.error('Erro ao atualizar venda:', error);
        setError({
          title: 'Erro ao finalizar pagamento',
          message: 'O pagamento foi aprovado, mas houve um erro ao finalizar a venda. Procure um atendente.'
        });
        return;
      }
      
      toast.success('Pagamento aprovado!');
      navigate('/totem/product-payment-success', { 
        state: { sale, client, transactionData } 
      });
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      setError({
        title: 'Erro inesperado',
        message: 'Ocorreu um erro ao processar o pagamento. Por favor, procure um atendente.'
      });
      setIsProcessing(false);
    }
  };

  if (!sale) return null;

  if (error) {
    return (
      <TotemErrorFeedback
        title={error.title}
        message={error.message}
        onRetry={() => {
          setError(null);
          iniciarPagamentoReal();
        }}
        onGoHome={() => navigate('/totem')}
      />
    );
  }

  // Tela quando TEF não está disponível ou pinpad desconectado
  if (!isAndroidAvailable || !isPinpadConnected) {
    return (
      <div className="fixed inset-0 w-screen h-screen flex flex-col p-6 font-poppins overflow-hidden relative">
        <div className="absolute inset-0 z-0">
          <img src={barbershopBg} alt="Barbearia" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-urbana-black/80" />
        </div>

        <div className="flex-1 flex items-center justify-center z-10">
          <Card className="max-w-lg p-8 bg-black/50 backdrop-blur-xl border-2 border-red-500/50 text-center">
            <WifiOff className="w-20 h-20 text-red-500 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-4">
              {!isAndroidAvailable ? 'TEF Não Disponível' : 'Pinpad Não Conectado'}
            </h2>
            <p className="text-gray-300 mb-2">
              {!isAndroidAvailable 
                ? 'O sistema TEF (PayGo) não está disponível neste dispositivo.'
                : 'A maquininha de cartão não está conectada.'}
            </p>
            <p className="text-sm text-gray-400 mb-6">
              Android: {isAndroidAvailable ? '✅' : '❌'} | Pinpad: {isPinpadConnected ? '✅' : '❌'}
            </p>
            <div className="space-y-3">
              <Button 
                onClick={() => window.location.reload()} 
                className="w-full bg-urbana-gold hover:bg-urbana-gold-dark"
              >
                Tentar Novamente
              </Button>
              <Button 
                onClick={() => navigate(-1)} 
                variant="outline"
                className="w-full border-gray-500 text-gray-300"
              >
                Voltar
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-screen h-screen flex flex-col p-4 font-poppins relative overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <img 
          src={barbershopBg} 
          alt="Barbearia" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-urbana-black/95 via-urbana-black/90 to-urbana-brown/85" />
      </div>

      {/* Premium background effects */}
      <div className="absolute inset-0 overflow-hidden z-0">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-urbana-gold/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-urbana-gold-vibrant/5 rounded-full blur-3xl" />
      </div>

      {/* Header com status TEF */}
      <div className="flex items-center justify-between mb-4 z-10">
        <Button
          onClick={handleCancelPayment}
          variant="ghost"
          size="lg"
          className="h-12 px-4 text-urbana-light hover:text-urbana-gold hover:bg-urbana-gold/10"
          disabled={tefProcessing}
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Cancelar
        </Button>
        <div className="text-center flex-1">
          <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-urbana-gold via-urbana-gold-light to-urbana-gold">
            Pagamento com Cartão
          </h1>
          <p className="text-sm text-green-400 mt-0.5 flex items-center justify-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            PayGo conectado
          </p>
        </div>
        <div className="w-24"></div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center z-10">
        <Card className="relative w-full max-w-2xl p-8 space-y-6 bg-urbana-black/60 backdrop-blur-2xl border-2 border-urbana-gold/40 shadow-2xl shadow-urbana-gold/10 text-center">
          
          {/* Status TEF Conectado */}
          <div className="bg-gradient-to-r from-green-500/15 to-green-600/10 border border-green-500/40 rounded-xl p-4">
            <div className="flex items-center justify-center gap-2 text-green-400">
              <div className="relative">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-ping absolute" />
                <div className="w-2 h-2 bg-green-500 rounded-full" />
              </div>
              <p className="text-base font-bold">
                ✅ PayGo Integrado Conectado - Aguardando pagamento no pinpad
              </p>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-urbana-gold/30 to-urbana-gold-vibrant/30 flex items-center justify-center shadow-lg shadow-urbana-gold/20">
              <CreditCard className="w-16 h-16 text-urbana-gold" />
              {isProcessing && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-36 h-36 text-urbana-gold/50 animate-spin" />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-urbana-gold-vibrant to-urbana-gold">
              Processando Pagamento
            </h1>
            
            <p className="text-xl text-urbana-gold/90 font-bold">
              {cardType === 'debit' ? 'DÉBITO' : 'CRÉDITO'}
            </p>
            
            <p className="text-3xl font-black text-urbana-gold">
              R$ {sale.total.toFixed(2)}
            </p>
            
            <p className="text-lg text-urbana-light/80">
              Aproxime ou insira seu cartão na máquina
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-3 mt-4">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span className="text-sm text-urbana-light">TEF OK</span>
            </div>
            <div className="w-8 h-0.5 bg-urbana-gold/30" />
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span className="text-sm text-urbana-light">Pinpad OK</span>
            </div>
            <div className="w-8 h-0.5 bg-urbana-gold/30" />
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 border-2 border-urbana-gold rounded-full animate-pulse" />
              <span className="text-sm text-urbana-light">Pagamento</span>
            </div>
          </div>

          {/* Cancel Button */}
          <Button
            onClick={handleCancelPayment}
            variant="outline"
            className="mt-4 border-red-500/50 text-red-400 hover:bg-red-500/10"
          >
            Cancelar pagamento
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default TotemProductPaymentCard;
