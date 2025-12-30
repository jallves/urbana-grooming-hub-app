import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle2, Loader2, WifiOff, QrCode } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTEFAndroid } from '@/hooks/useTEFAndroid';
import { useTEFPaymentResult } from '@/hooks/useTEFPaymentResult';
import { TEFResultado } from '@/lib/tef/tefAndroidBridge';
import { TotemErrorFeedback } from '@/components/totem/TotemErrorFeedback';
import barbershopBg from '@/assets/barbershop-background.jpg';

const TotemProductPaymentPix: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { sale, client, barber } = location.state || {};
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStarted, setPaymentStarted] = useState(false);
  const [error, setError] = useState<{ title: string; message: string } | null>(null);
  const [isCheckingConnection, setIsCheckingConnection] = useState(true); // Delay inicial para verificar conexão
  
  const finalizingRef = useRef(false);
  const isProcessingRef = useRef(false);

  // Função de sucesso
  const handlePaymentSuccess = useCallback(async (transactionData?: {
    nsu?: string;
    autorizacao?: string;
  }) => {
    if (!sale || !barber) return;
    
    // Evitar finalização duplicada
    if (finalizingRef.current) {
      console.log('[PRODUCT-PIX] ⚠️ Finalização já em andamento');
      return;
    }
    finalizingRef.current = true;
    
    try {
      console.log('✅ [PRODUCT-PIX] ═══════════════════════════════════════');
      console.log('✅ [PRODUCT-PIX] FINALIZANDO PAGAMENTO PIX DE PRODUTO');
      console.log('✅ [PRODUCT-PIX] NSU:', transactionData?.nsu);
      console.log('✅ [PRODUCT-PIX] Autorização:', transactionData?.autorizacao);
      console.log('✅ [PRODUCT-PIX] ═══════════════════════════════════════');
      
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
        finalizingRef.current = false;
        return;
      }

      // 🔒 CORREÇÃO: NÃO atualizar estoque aqui - o ERP (create-financial-transaction) já faz isso
      // Removido decremento de estoque duplicado
      console.log('📦 Itens da venda encontrados:', saleItems?.length, '- Estoque será atualizado pelo ERP');

      // 3. Preparar itens para o ERP (formato CheckoutItem)
      const erpItems = saleItems?.map(item => ({
        type: 'product' as const,
        id: item.ref_id,
        name: item.nome,
        quantity: item.quantidade,
        price: Number(item.preco_unit),
        discount: 0
      })) || [];

      console.log('💰 Integrando venda de produtos com ERP Financeiro e comissões...', {
        client_id: sale.cliente_id,
        barber_id: barber.staff_id,
        items_count: erpItems.length,
        payment_method: 'pix',
        total: sale.total
      });

      // 4. Chamar edge function para criar registros financeiros (produtos + comissões)
      const { data: erpResult, error: erpError } = await supabase.functions.invoke(
        'create-financial-transaction',
        {
          body: {
            client_id: sale.cliente_id,
            barber_id: barber.staff_id,
            items: erpItems,
            payment_method: 'pix',
            discount_amount: Number(sale.desconto) || 0,
            notes: `Venda de Produtos - Totem PIX - Barbeiro: ${barber.nome}`,
            transaction_data: transactionData
          }
        }
      );

      if (erpError) {
        console.error('❌ Erro ao integrar com ERP:', erpError);
        console.log('⚠️ Continuando finalização sem integração ERP');
      } else {
        console.log('✅ ERP Financeiro integrado com sucesso (produtos PIX):', erpResult);
      }

      // 5. Atualizar venda para PAGA
      const { error: updateError } = await supabase
        .from('vendas')
        .update({
          status: 'PAGA',
          updated_at: new Date().toISOString()
        })
        .eq('id', sale.id);

      if (updateError) {
        console.error('Erro ao atualizar venda:', updateError);
        setError({
          title: 'Erro ao finalizar pagamento',
          message: 'O pagamento foi aprovado, mas houve um erro ao finalizar a venda. Procure um atendente.'
        });
        finalizingRef.current = false;
        return;
      }
      
      console.log('✅ [PRODUCT-PIX] Pagamento finalizado com sucesso!');
      toast.success('Pagamento PIX aprovado!');
      
      // Passar sale com items incluídos para a página de sucesso
      const saleWithItems = { ...sale, items: saleItems };
      
      navigate('/totem/product-payment-success', { 
        state: { 
          sale: saleWithItems, 
          client, 
          transactionData: { ...transactionData, paymentMethod: 'pix' }
        } 
      });
    } catch (err) {
      console.error('Erro ao processar pagamento:', err);
      setError({
        title: 'Erro inesperado',
        message: 'Ocorreu um erro ao processar o pagamento PIX. Por favor, procure um atendente.'
      });
      setIsProcessing(false);
      finalizingRef.current = false;
    }
  }, [sale, client, barber, navigate]);

  // Handler para resultado do TEF
  const handleTEFResult = useCallback((resultado: TEFResultado) => {
    console.log('📞 [PRODUCT-PIX] handleTEFResult chamado:', resultado.status);
    
    switch (resultado.status) {
      case 'aprovado':
        console.log('✅ [PRODUCT-PIX] Pagamento APROVADO pelo PayGo');
        handlePaymentSuccess({
          nsu: resultado.nsu,
          autorizacao: resultado.autorizacao
        });
        break;
        
      case 'negado':
        console.log('❌ [PRODUCT-PIX] Pagamento NEGADO pelo PayGo');
        toast.error('Pagamento PIX negado', { description: resultado.mensagem || 'Tente novamente' });
        setError({ title: 'Pagamento Negado', message: resultado.mensagem || 'Tente novamente' });
        setIsProcessing(false);
        setPaymentStarted(false);
        break;
        
      case 'cancelado':
        console.log('⚠️ [PRODUCT-PIX] Pagamento CANCELADO');
        toast.info('Pagamento cancelado');
        setIsProcessing(false);
        setPaymentStarted(false);
        break;
        
      case 'erro':
        console.log('❌ [PRODUCT-PIX] ERRO no pagamento');
        toast.error('Erro no pagamento PIX', { description: resultado.mensagem });
        setError({ title: 'Erro no Pagamento', message: resultado.mensagem || 'Erro desconhecido' });
        setIsProcessing(false);
        setPaymentStarted(false);
        break;
    }
  }, [handlePaymentSuccess]);

  // Hook dedicado para receber resultado do PayGo - ÚNICO receptor de resultados
  useTEFPaymentResult({
    enabled: paymentStarted && isProcessing,
    onResult: handleTEFResult,
    pollingInterval: 500,
    maxWaitTime: 180000 // 3 minutos
  });

  // Hook TEF Android (APENAS para iniciar pagamento - NÃO para receber resultado)
  const {
    isAndroidAvailable,
    isPinpadConnected,
    isProcessing: tefProcessing,
    iniciarPagamento: iniciarPagamentoTEF,
    cancelarPagamento: cancelarPagamentoTEF
  } = useTEFAndroid({
    // NÃO passamos callbacks aqui para evitar processamento duplicado
    // O useTEFPaymentResult é o único responsável por receber e processar resultados
  });

  // Delay inicial para verificar conexão TEF (evita flash da tela de erro)
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsCheckingConnection(false);
    }, 1500); // Aguarda 1.5s para TEF inicializar
    
    return () => clearTimeout(timer);
  }, []);

  // Função para iniciar pagamento
  const iniciarPagamentoReal = useCallback(async () => {
    if (!isAndroidAvailable || !isPinpadConnected || !sale) {
      return;
    }

    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    console.log('💚 [PRODUCT-PIX] ═══════════════════════════════════════');
    console.log('💚 [PRODUCT-PIX] INICIANDO PAGAMENTO PIX DE PRODUTO');
    console.log('💚 [PRODUCT-PIX] Valor:', sale.total);
    console.log('💚 [PRODUCT-PIX] Venda ID:', sale.id);
    console.log('💚 [PRODUCT-PIX] ═══════════════════════════════════════');

    setIsProcessing(true);
    setPaymentStarted(true);
    finalizingRef.current = false;

    const success = await iniciarPagamentoTEF({
      ordemId: sale.id,
      valor: sale.total,
      tipo: 'pix',
      parcelas: 1
    });

    if (!success) {
      console.error('❌ [PRODUCT-PIX] Falha ao iniciar TEF');
      toast.error('Erro ao iniciar pagamento PIX', {
        description: 'Verifique a conexão com o pinpad'
      });
      setIsProcessing(false);
      setPaymentStarted(false);
      isProcessingRef.current = false;
    } else {
      console.log('✅ [PRODUCT-PIX] TEF iniciado, aguardando resposta do PayGo...');
    }
  }, [isAndroidAvailable, isPinpadConnected, sale, iniciarPagamentoTEF]);

  // Iniciar pagamento quando TEF estiver disponível
  useEffect(() => {
    console.log('💚 [TotemProductPaymentPix] Estado:', {
      isAndroidAvailable,
      isPinpadConnected,
      isProcessing,
      tefProcessing,
      sale_id: sale?.id
    });
    
    if (!sale || !client || !barber) {
      toast.error('Dados incompletos');
      navigate('/totem/home');
      return;
    }

    // Se TEF está disponível e conectado, iniciar pagamento
    if (isAndroidAvailable && isPinpadConnected && !isProcessing && !tefProcessing) {
      console.log('💚 [TotemProductPaymentPix] ✅ Todas condições OK - iniciando pagamento');
      iniciarPagamentoReal();
    }
  }, [sale, client, barber, isAndroidAvailable, isPinpadConnected, isProcessing, tefProcessing, navigate, iniciarPagamentoReal]);

  const handleCancelPayment = () => {
    cancelarPagamentoTEF();
    setIsProcessing(false);
    setPaymentStarted(false);
    isProcessingRef.current = false;
    // Voltar para o checkout de produtos onde mostra as opções de pagamento
    navigate('/totem/product-checkout', { 
      state: { client, cart: location.state?.cart, barber } 
    });
  };

  if (!sale) return null;

  if (error) {
    return (
      <TotemErrorFeedback
        title={error.title}
        message={error.message}
        onRetry={() => {
          setError(null);
          finalizingRef.current = false;
          isProcessingRef.current = false;
          iniciarPagamentoReal();
        }}
        onGoHome={() => navigate('/totem')}
      />
    );
  }

  // Tela quando TEF não está disponível (APENAS após delay)
  if (!isCheckingConnection && (!isAndroidAvailable || !isPinpadConnected)) {
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
            <p className="text-gray-300 mb-6">
              {!isAndroidAvailable 
                ? 'O sistema TEF (PayGo) não está disponível neste dispositivo.'
                : 'A maquininha de cartão não está conectada.'}
            </p>
            <div className="space-y-3">
              <Button 
                onClick={() => window.location.reload()} 
                className="w-full bg-urbana-gold hover:bg-urbana-gold-dark"
              >
                Tentar Novamente
              </Button>
              <Button 
                onClick={() => navigate('/totem/product-checkout', { 
                  state: { client, cart: location.state?.cart, barber } 
                })} 
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
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-green-400/10 rounded-full blur-3xl animate-pulse" />
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
          Cancelar
        </Button>
        <div className="text-center flex-1">
          <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-green-300 to-green-400">
            Pagamento PIX
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
        <Card className="relative w-full max-w-2xl p-8 space-y-6 bg-urbana-black/60 backdrop-blur-2xl border-2 border-green-500/40 shadow-2xl shadow-green-500/10 text-center">
          
          {/* Status TEF Conectado */}
          <div className="bg-gradient-to-r from-green-500/15 to-green-600/10 border border-green-500/40 rounded-xl p-4">
            <div className="flex items-center justify-center gap-2 text-green-400">
              <div className="relative">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-ping absolute" />
                <div className="w-2 h-2 bg-green-500 rounded-full" />
              </div>
              <p className="text-base font-bold">
                ✅ PayGo Integrado - Escaneie o QR Code no pinpad
              </p>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-green-500/30 to-green-600/30 flex items-center justify-center shadow-lg shadow-green-500/20">
              <QrCode className="w-16 h-16 text-green-400" />
              {isProcessing && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-36 h-36 text-green-500/50 animate-spin" />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-green-300">
              Processando Pagamento PIX
            </h1>
            
            <p className="text-3xl font-black text-green-400">
              R$ {sale.total.toFixed(2)}
            </p>
            
            <p className="text-lg text-urbana-light/80">
              Escaneie o QR Code exibido na maquininha
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-3 mt-4">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span className="text-sm text-urbana-light">TEF OK</span>
            </div>
            <div className="w-8 h-0.5 bg-green-500/30" />
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span className="text-sm text-urbana-light">QR Code</span>
            </div>
            <div className="w-8 h-0.5 bg-green-500/30" />
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 border-2 border-green-400 rounded-full animate-pulse" />
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

export default TotemProductPaymentPix;
