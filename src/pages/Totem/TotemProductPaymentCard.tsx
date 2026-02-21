import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, CreditCard, CheckCircle2, Loader2, WifiOff } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { TotemErrorFeedback } from '@/components/totem/TotemErrorFeedback';
import { useTEFAndroid } from '@/hooks/useTEFAndroid';
import { useTEFPaymentResult } from '@/hooks/useTEFPaymentResult';
import { TEFResultado, resolverPendenciaAndroid, confirmarTransacaoTEF } from '@/lib/tef/tefAndroidBridge';
import barbershopBg from '@/assets/barbershop-background.jpg';

const TotemProductPaymentCard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { sale: saleFromState, client, cardType, barber, cart } = location.state || {};
  
  // Garantir que sale tenha campo total para compatibilidade
  const sale = saleFromState ? { 
    ...saleFromState, 
    total: saleFromState.total || saleFromState.valor_total || 0 
  } : null;
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<{ title: string; message: string } | null>(null);
  const [paymentStarted, setPaymentStarted] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(true);
  
  const finalizingRef = useRef(false);
  const lastFailureRef = useRef<TEFResultado | null>(null);
  const successNavigatedRef = useRef(false);

  // ═══════════════════════════════════════════════════════════
  // SUCESSO DO PAGAMENTO - IDÊNTICO AO CHECKOUT DE SERVIÇO
  // Chama totem-direct-sale finish SEM precisar de payment_id
  // ═══════════════════════════════════════════════════════════
  const handlePaymentSuccess = useCallback(async (transactionData?: {
    nsu?: string;
    autorizacao?: string;
    bandeira?: string;
    confirmationId?: string;
  }) => {
    if (!sale?.id) {
      console.error('[PRODUCT-CARD] ❌ sale.id não existe!');
      toast.error('Erro crítico: ID da venda não encontrado');
      return;
    }
    
    // Prevenir múltiplas finalizações
    if (finalizingRef.current || successNavigatedRef.current) {
      console.log('[PRODUCT-CARD] ⚠️ Finalização já em andamento ou já navegou');
      return;
    }
    
    finalizingRef.current = true;

    // CRÍTICO: Confirmar transação TEF ANTES de finalizar (igual ao serviço)
    if (transactionData?.confirmationId) {
      console.log('✅ [PRODUCT-CARD] Confirmando transação TEF:', transactionData.confirmationId);
      confirmarTransacaoTEF(transactionData.confirmationId, 'CONFIRMADO_AUTOMATICO');
    }
    
    console.log('✅ [PRODUCT-CARD] ═══════════════════════════════════════');
    console.log('✅ [PRODUCT-CARD] FINALIZANDO PAGAMENTO VIA EDGE FUNCTION');
    console.log('✅ [PRODUCT-CARD] Sale ID:', sale.id);
    console.log('✅ [PRODUCT-CARD] Transaction:', transactionData);
    console.log('✅ [PRODUCT-CARD] ═══════════════════════════════════════');
    
    try {
      const paymentMethod = cardType === 'debit' ? 'debit_card' : 'credit_card';
      
      // Chamar finish SEM payment_id - a edge function cria o registro automaticamente
      const { error: finishError } = await supabase.functions.invoke('totem-direct-sale', {
        body: {
          action: 'finish',
          venda_id: sale.id,
          payment_method: paymentMethod,
          transaction_data: transactionData
        }
      });

      if (finishError) {
        console.error('❌ [PRODUCT-CARD] Erro ao finalizar:', finishError);
        // Não bloquear - pagamento já foi aprovado na maquininha
      } else {
        console.log('✅ [PRODUCT-CARD] Edge function executada com sucesso');
      }
      
      // Buscar itens da venda para exibir no comprovante
      let saleItems: any[] = [];
      try {
        const { data: fetchedItems } = await supabase
          .from('vendas_itens')
          .select('*')
          .eq('venda_id', sale.id)
          .eq('tipo', 'PRODUTO');
        
        saleItems = fetchedItems || [];
      } catch (e) {
        console.warn('[PRODUCT-CARD] Erro ao buscar itens para comprovante:', e);
        if (cart && cart.length > 0) {
          saleItems = cart.map((item: any) => ({
            item_id: item.product?.id || item.id,
            nome: item.product?.nome || item.nome,
            quantidade: item.quantity || 1,
            preco_unitario: item.product?.preco || item.preco,
            subtotal: (item.product?.preco || item.preco) * (item.quantity || 1)
          }));
        }
      }
      
      // Navegar para tela de sucesso - GARANTIDO
      successNavigatedRef.current = true;
      toast.success('Pagamento aprovado!');
      
      const saleWithItems = { 
        ...sale, 
        items: saleItems,
        total: sale.total || sale.valor_total
      };
      
      console.log('🚀 [PRODUCT-CARD] Navegando para tela de sucesso');
      
      navigate('/totem/product-payment-success', { 
        state: { 
          sale: saleWithItems, 
          client, 
          transactionData: { 
            ...transactionData, 
            paymentMethod: cardType 
          } 
        } 
      });
      
    } catch (err) {
      console.error('❌ [PRODUCT-CARD] Erro crítico:', err);
      
      // Se pagamento foi aprovado na maquininha, ainda navegar para sucesso
      if (transactionData?.nsu || transactionData?.autorizacao) {
        console.log('⚠️ [PRODUCT-CARD] Pagamento aprovado - navegando para sucesso mesmo com erro');
        successNavigatedRef.current = true;
        toast.warning('Pagamento aprovado com observações');
        
        navigate('/totem/product-payment-success', { 
          state: { 
            sale: { ...sale, items: [], total: sale.total || sale.valor_total }, 
            client, 
            transactionData: { ...transactionData, paymentMethod: cardType } 
          } 
        });
      } else {
        setError({
          title: 'Erro inesperado',
          message: 'Ocorreu um erro ao processar o pagamento. Por favor, procure um atendente.'
        });
        setIsProcessing(false);
        finalizingRef.current = false;
      }
    }
  }, [sale, client, cardType, cart, navigate]);

  // ═══════════════════════════════════════════════════════════
  // HANDLER TEF RESULT - IDÊNTICO AO CHECKOUT DE SERVIÇO
  // ═══════════════════════════════════════════════════════════
  const handleTEFResult = useCallback((resultado: TEFResultado) => {
    console.log('📞 [PRODUCT-CARD] handleTEFResult:', resultado.status);
    
    switch (resultado.status) {
      case 'aprovado':
        handlePaymentSuccess({
          nsu: resultado.nsu,
          autorizacao: resultado.autorizacao,
          bandeira: resultado.bandeira,
          confirmationId: resultado.confirmationTransactionId
        });
        break;
        
      case 'negado': {
        lastFailureRef.current = resultado;
        const code = resultado.codigoResposta ? ` (cód. ${resultado.codigoResposta})` : '';
        toast.error(`Pagamento negado${code}`, { description: resultado.mensagem || 'Tente novamente' });
        setError({
          title: 'Pagamento Negado',
          message: `${resultado.mensagem || 'Tente novamente'}${code}`
        });
        setIsProcessing(false);
        setPaymentStarted(false);
        break;
      }
        
      case 'cancelado':
        toast.info('Pagamento cancelado');
        setIsProcessing(false);
        setPaymentStarted(false);
        break;
        
      case 'erro': {
        lastFailureRef.current = resultado;
        const code = resultado.codigoResposta ? ` (cód. ${resultado.codigoResposta})` : '';
        toast.error(`Erro no pagamento${code}`, { description: resultado.mensagem });
        setError({
          title: 'Erro no Pagamento',
          message: `${resultado.mensagem || 'Erro desconhecido'}${code}`
        });
        setIsProcessing(false);
        setPaymentStarted(false);
        break;
      }
    }
  }, [handlePaymentSuccess]);

  // Hook TEF Android - NÃO passar callbacks (resultado via useTEFPaymentResult)
  const {
    isAndroidAvailable,
    isPinpadConnected,
    isProcessing: tefProcessing,
    iniciarPagamento: iniciarPagamentoTEF,
    cancelarPagamento: cancelarPagamentoTEF,
    verificarConexao
  } = useTEFAndroid({});

  // Hook para receber resultado do PayGo - IDÊNTICO AO SERVIÇO
  useTEFPaymentResult({
    enabled: paymentStarted && isProcessing,
    onResult: handleTEFResult,
    pollingInterval: 500,
    maxWaitTime: 180000
  });

  // CRÍTICO: Limpar storage de resultados TEF antigos ao montar o componente
  // Isso evita que resultados de transações anteriores sejam processados
  useEffect(() => {
    try {
      sessionStorage.removeItem('lastTefResult');
      sessionStorage.removeItem('lastTefResultTime');
      localStorage.removeItem('lastTefResult');
      localStorage.removeItem('lastTefResultTime');
      console.log('[PRODUCT-CARD] 🧹 Storage TEF limpo ao montar componente');
    } catch (e) {
      console.warn('[PRODUCT-CARD] Erro ao limpar storage:', e);
    }
  }, []);

  // Delay inicial para verificar conexão TEF
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsCheckingConnection(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Log status do TEF
  useEffect(() => {
    console.log('🔌 [PRODUCT-CARD] Status TEF:', { isAndroidAvailable, isPinpadConnected, isCheckingConnection });
  }, [isAndroidAvailable, isPinpadConnected, isCheckingConnection]);

  // ═══════════════════════════════════════════════════════════
  // INICIAR PAGAMENTO - IDÊNTICO AO handlePaymentType DO SERVIÇO
  // SEM chamada start, SEM paymentId, direto pro PayGo
  // ═══════════════════════════════════════════════════════════
  const handleStartPayment = async () => {
    console.log('💳 [PRODUCT-CARD] ═══════════════════════════════════════');
    console.log('💳 [PRODUCT-CARD] INICIANDO PAGAMENTO DE PRODUTO');
    console.log('💳 [PRODUCT-CARD] Tipo:', cardType);
    console.log('💳 [PRODUCT-CARD] Valor:', sale?.total);
    console.log('💳 [PRODUCT-CARD] ═══════════════════════════════════════');

    if (!sale) {
      toast.error('Dados da venda não encontrados');
      return;
    }

    // Evitar duplo clique / reentrada (IGUAL AO SERVIÇO)
    if (isProcessing || paymentStarted) return;

    setError(null);
    finalizingRef.current = false;
    successNavigatedRef.current = false;

    // Checar bridge TEF (IGUAL AO SERVIÇO)
    const hasNativeBridge = typeof window !== 'undefined' && typeof (window as any).TEF !== 'undefined';

    if (!hasNativeBridge) {
      toast.error('PayGo indisponível', {
        description: 'O WebView não detectou a bridge TEF (window.TEF).'
      });
      return;
    }

    // Revalidar pinpad (IGUAL AO SERVIÇO)
    const status = verificarConexao();
    const connected = !!status?.conectado;

    if (!connected) {
      toast.error('Pinpad não conectado', {
        description: 'Verifique a conexão da maquininha e tente novamente.'
      });
      return;
    }

    // ROBUSTEZ: SEMPRE resolver pendências INCONDICIONALMENTE antes de qualquer pagamento
    // Não depender de hasPendingTransaction() que pode ser falso-negativo
    console.log('[PRODUCT-CARD] 🔧 Resolvendo pendências incondicionalmente...');
    try {
      resolverPendenciaAndroid('desfazer');
    } catch (e) {
      console.warn('[PRODUCT-CARD] resolverPendenciaAndroid erro (ignorado):', e);
    }

    // Aguardar 5 segundos - cooldown obrigatório do PayGo após resolução
    toast.info('Preparando terminal...', { description: 'Aguarde um instante', duration: 4000 });
    await new Promise(r => setTimeout(r, 5000));

    // Limpar storage de resultados anteriores
    try {
      sessionStorage.removeItem('lastTefResult');
      sessionStorage.removeItem('lastTefResultTime');
      localStorage.removeItem('lastTefResult');
      localStorage.removeItem('lastTefResultTime');
    } catch (e) {
      console.warn('[PRODUCT-CARD] Erro ao limpar storage:', e);
    }

    // Ativar estados ANTES de chamar PayGo (IGUAL AO SERVIÇO)
    setIsProcessing(true);
    setPaymentStarted(true);

    // Chamar PayGo DIRETAMENTE - sem edge function start (IGUAL AO SERVIÇO)
    try {
      const ordemId = (sale.id as string) || `CARD_PRODUCT_${Date.now()}`;

      const success = await iniciarPagamentoTEF({
        ordemId,
        valor: sale.total,
        tipo: cardType === 'debit' ? 'debit' : 'credit',
        parcelas: 1
      });

      if (!success) {
        toast.error('Erro ao iniciar pagamento', {
          description: 'A bridge TEF retornou falha ao iniciar a transação.'
        });
        setIsProcessing(false);
        setPaymentStarted(false);
      }
    } catch (error) {
      console.error('❌ [PRODUCT-CARD] Erro no pagamento:', error);
      toast.error('Erro no pagamento');
      setIsProcessing(false);
      setPaymentStarted(false);
    }
  };

  // Verificar dados ao montar
  useEffect(() => {
    if (!sale || !client || !barber) {
      console.warn('[PRODUCT-CARD] Dados incompletos, redirecionando...');
      navigate('/totem/home');
    }
  }, []);

  const handleCancel = () => {
    cancelarPagamentoTEF();
    setIsProcessing(false);
    setPaymentStarted(false);
    navigate('/totem/product-card-type', { state: { client, cart, barber, sale } });
  };

  if (!sale) return null;

  if (error) {
    return (
      <TotemErrorFeedback
        title={error.title}
        message={error.message}
        onRetry={async () => {
          setError(null);
          finalizingRef.current = false;
          lastFailureRef.current = null;
          // handleStartPayment já faz resolução incondicional
          handleStartPayment();
        }}
        onGoHome={() => navigate('/totem')}
      />
    );
  }

  // Tela quando TEF não está disponível
  if (!isCheckingConnection && (!isAndroidAvailable || !isPinpadConnected)) {
    return (
      <div className="fixed inset-0 w-screen h-screen flex flex-col p-6 font-poppins overflow-hidden relative">
        <div className="absolute inset-0 z-0">
          <img src={barbershopBg} alt="Barbearia" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-urbana-black/80" />
        </div>
        <div className="flex-1 flex items-center justify-center z-10">
          <Card className="max-w-lg p-8 bg-background/50 backdrop-blur-xl border-2 border-destructive/50 text-center">
            <WifiOff className="w-20 h-20 text-destructive mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-foreground mb-4">
              {!isAndroidAvailable ? 'TEF Não Disponível' : 'Pinpad Não Conectado'}
            </h2>
            <p className="text-muted-foreground mb-6">
              {!isAndroidAvailable 
                ? 'O sistema TEF (PayGo) não está disponível neste dispositivo.'
                : 'A maquininha de cartão não está conectada.'}
            </p>
            <div className="space-y-3">
              <Button onClick={() => window.location.reload()} className="w-full bg-urbana-gold hover:bg-urbana-gold-dark">
                Tentar Novamente
              </Button>
              <Button onClick={handleCancel} variant="outline" className="w-full border-muted text-muted-foreground">
                Voltar
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const cardTypeLabel = cardType === 'credit' ? 'Crédito' : 'Débito';

  return (
    <div className="fixed inset-0 w-screen h-screen flex flex-col p-4 font-poppins relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img src={barbershopBg} alt="Barbearia" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-urbana-black/95 via-urbana-black/90 to-urbana-brown/85" />
      </div>

      <div className="absolute inset-0 overflow-hidden z-0">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-urbana-gold/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-urbana-gold-vibrant/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4 z-10">
        <Button
          onClick={handleCancel}
          variant="ghost"
          size="lg"
          className="h-12 px-4 text-urbana-light hover:text-urbana-gold hover:bg-urbana-gold/10"
          disabled={tefProcessing || isProcessing}
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Voltar
        </Button>
        <div className="text-center flex-1">
          <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-urbana-gold via-urbana-gold-light to-urbana-gold">
            Pagamento {cardTypeLabel}
          </h1>
        </div>
        <div className="w-24"></div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center z-10">
        <Card className="relative w-full max-w-2xl p-8 space-y-6 bg-urbana-black/60 backdrop-blur-2xl border-2 border-urbana-gold/40 shadow-2xl text-center">
          
          {!isProcessing ? (
            // TELA INICIAL
            <>
              <div className="flex justify-center">
                <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-urbana-gold to-urbana-gold-dark flex items-center justify-center">
                  <CreditCard className="w-16 h-16 text-urbana-black" />
                </div>
              </div>
              
              <div>
                <h2 className="text-3xl font-bold text-urbana-gold mb-2">R$ {sale.total?.toFixed(2)}</h2>
                <p className="text-muted-foreground">{cardTypeLabel}</p>
              </div>
              
              <Button
                onClick={handleStartPayment}
                size="lg"
                className="w-full h-16 text-xl font-bold bg-gradient-to-r from-urbana-gold to-urbana-gold-dark hover:from-urbana-gold-dark hover:to-urbana-gold text-urbana-black"
              >
                <CreditCard className="w-6 h-6 mr-3" />
                Iniciar Pagamento
              </Button>
              
              <p className="text-sm text-muted-foreground">
                Clique para iniciar o pagamento na maquininha
              </p>
            </>
          ) : (
            // TELA DE PROCESSAMENTO
            <>
              <div className="bg-gradient-to-r from-green-500/15 to-green-600/10 border border-green-500/40 rounded-xl p-4">
                <div className="flex items-center justify-center gap-2 text-green-400">
                  <div className="relative">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-ping absolute" />
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                  </div>
                  <p className="font-bold">PayGo Conectado - Processando</p>
                </div>
              </div>

              <div className="flex justify-center">
                <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-urbana-gold/30 to-urbana-gold/10 flex items-center justify-center animate-pulse">
                  <CreditCard className="w-16 h-16 text-urbana-gold" />
                </div>
              </div>
              
              <div>
                <h2 className="text-3xl font-bold text-urbana-gold mb-2">R$ {sale.total?.toFixed(2)}</h2>
                <p className="text-urbana-light text-lg">{cardTypeLabel}</p>
              </div>
              
              <div className="flex items-center justify-center gap-3 text-urbana-gold">
                <Loader2 className="w-6 h-6 animate-spin" />
                <p className="text-lg font-medium">Aproxime ou insira o cartão na maquininha...</p>
              </div>
              
              <Button
                onClick={handleCancel}
                variant="outline"
                size="lg"
                className="w-full h-14 border-destructive/50 text-destructive hover:bg-destructive/10"
              >
                Cancelar Pagamento
              </Button>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default TotemProductPaymentCard;
