import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, CreditCard, Loader2, CheckCircle2, WifiOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTEFAndroid } from '@/hooks/useTEFAndroid';
import { useTEFPaymentResult } from '@/hooks/useTEFPaymentResult';
import { TEFResultado, confirmarTransacaoTEF } from '@/lib/tef/tefAndroidBridge';
import { logTEFTransaction } from '@/lib/tef/tefTransactionLogger';
import { sendReceiptEmail } from '@/services/receiptEmailService';
import { format } from 'date-fns';
import TotemReceiptOptionsModal from '@/components/totem/TotemReceiptOptionsModal';
import barbershopBg from '@/assets/barbershop-background.jpg';

const TotemProductPaymentCard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { sale: saleFromState, client, barber, cart } = location.state || {};

  // Garantir que sale tenha campo total
  const sale = saleFromState ? {
    ...saleFromState,
    total: saleFromState.total || saleFromState.valor_total || 0
  } : null;

  const [processing, setProcessing] = useState(false);
  const [paymentType, setPaymentType] = useState<'credit' | 'debit' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paymentStarted, setPaymentStarted] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(true);

  // Estado para modal de opções de comprovante
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [pendingTransactionData, setPendingTransactionData] = useState<{
    nsu?: string;
    autorizacao?: string;
    bandeira?: string;
    confirmationId?: string;
  } | null>(null);

  // Refs para evitar duplicatas
  const finalizingRef = useRef(false);
  const paymentTypeRef = useRef<'credit' | 'debit' | null>(null);

  // Atualizar ref quando paymentType mudar
  useEffect(() => {
    paymentTypeRef.current = paymentType;
  }, [paymentType]);

  // CRÍTICO: Limpar storage de resultados TEF antigos ao montar
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

  // Função para enviar e-mail de comprovante (IDÊNTICA AO SERVIÇO)
  const handleSendReceiptEmail = useCallback(async (): Promise<boolean> => {
    if (!client?.email) return false;

    try {
      const items: Array<{ name: string; quantity?: number; unitPrice?: number; price: number; type: 'service' | 'product' }> = [];

      // Produtos do carrinho
      if (cart && cart.length > 0) {
        cart.forEach((item: any) => {
          const product = item.product || item;
          const qty = item.quantity || item.quantidade || 1;
          const price = product.preco || item.preco || 0;
          items.push({
            name: product.nome || item.nome,
            quantity: qty,
            unitPrice: price,
            price: price * qty,
            type: 'product'
          });
        });
      }

      if (items.length === 0) {
        items.push({ name: 'Produto', price: sale?.total || 0, type: 'product' });
      }

      const result = await sendReceiptEmail({
        clientName: client.nome,
        clientEmail: client.email,
        transactionType: 'product',
        items,
        total: sale?.total || 0,
        paymentMethod: paymentTypeRef.current === 'credit' ? 'Crédito' : 'Débito',
        transactionDate: format(new Date(), "dd/MM/yyyy HH:mm"),
        nsu: pendingTransactionData?.nsu,
        barberName: barber?.nome,
        tipAmount: 0,
      });

      return result.success;
    } catch (error) {
      console.error('[PRODUCT-CARD] Erro ao enviar e-mail:', error);
      return false;
    }
  }, [client, cart, sale, barber, pendingTransactionData]);

  // Função chamada após comprovante enviado - finaliza tudo (IDÊNTICA AO SERVIÇO)
  const handleReceiptComplete = useCallback(async () => {
    if (!pendingTransactionData) return;

    console.log('✅ [PRODUCT-CARD] ═══════════════════════════════════════');
    console.log('✅ [PRODUCT-CARD] COMPROVANTE PROCESSADO - FINALIZANDO');
    console.log('✅ [PRODUCT-CARD] ═══════════════════════════════════════');

    // NOTA: Confirmação TEF já foi enviada IMEDIATAMENTE pelo useTEFAndroid
    // ao receber aprovação. NÃO confirmar novamente aqui para evitar duplicata.
    console.log('[PRODUCT-CARD] Confirmação TEF já enviada pelo useTEFAndroid (imediata)');

    // 2. Finalizar venda no backend
    try {
      const paymentMethod = paymentTypeRef.current === 'debit' ? 'DEBITO' : 'CREDITO';

      const { error: finishError } = await supabase.functions.invoke('totem-direct-sale', {
        body: {
          action: 'finish',
          venda_id: sale?.id,
          payment_method: paymentMethod,
          transaction_data: pendingTransactionData
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
          .eq('venda_id', sale?.id)
          .eq('tipo', 'PRODUTO');

        saleItems = fetchedItems || [];
      } catch (e) {
        console.warn('[PRODUCT-CARD] Erro ao buscar itens:', e);
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

      console.log('✅ [PRODUCT-CARD] Checkout finalizado com sucesso!');

      // 3. Navegar para tela de sucesso (emailAlreadySent = true)
      navigate('/totem/product-payment-success', {
        state: {
          sale: { ...sale, items: saleItems, total: sale?.total },
          client,
          transactionData: {
            ...pendingTransactionData,
            paymentMethod: paymentTypeRef.current
          },
          emailAlreadySent: true
        }
      });
    } catch (err) {
      console.error('❌ [PRODUCT-CARD] Erro crítico:', err);

      // Se pagamento foi aprovado na maquininha, ainda navegar para sucesso
      if (pendingTransactionData?.nsu || pendingTransactionData?.autorizacao) {
        toast.warning('Pagamento aprovado com observações');
        navigate('/totem/product-payment-success', {
          state: {
            sale: { ...sale, items: [], total: sale?.total },
            client,
            transactionData: { ...pendingTransactionData, paymentMethod: paymentTypeRef.current },
            emailAlreadySent: true
          }
        });
      } else {
        toast.error('Erro ao finalizar checkout', {
          description: 'O pagamento foi aprovado. Procure a recepção.'
        });
        navigate('/totem/home');
      }
    }
  }, [pendingTransactionData, sale, client, cart, navigate]);

  // Handler TEF Result - IDÊNTICO AO SERVIÇO
  const handleTEFResult = useCallback((resultado: TEFResultado) => {
    console.log('📞 [PRODUCT-CARD] ═══════════════════════════════════════');
    console.log('📞 [PRODUCT-CARD] handleTEFResult CHAMADO');
    console.log('📞 [PRODUCT-CARD] Status:', resultado.status);
    console.log('📞 [PRODUCT-CARD] ═══════════════════════════════════════');

    // Log centralizado para análise no PDV
    logTEFTransaction('checkout_produto',
      resultado.status === 'aprovado' ? 'success' : resultado.status === 'negado' ? 'error' : 'warning',
      `[PRODUTO] Resultado: ${resultado.status.toUpperCase()}`,
      {
        status: resultado.status,
        nsu: resultado.nsu,
        autorizacao: resultado.autorizacao,
        bandeira: resultado.bandeira,
        mensagem: resultado.mensagem,
        codigoResposta: resultado.codigoResposta,
        confirmationTransactionId: resultado.confirmationTransactionId,
        valor: sale?.total,
        venda_id: sale?.id,
        tipo: paymentTypeRef.current
      }
    );

    switch (resultado.status) {
      case 'aprovado':
        console.log('✅ [PRODUCT-CARD] Pagamento APROVADO - Mostrando opções de comprovante');
        setPendingTransactionData({
          nsu: resultado.nsu,
          autorizacao: resultado.autorizacao,
          bandeira: resultado.bandeira,
          confirmationId: resultado.confirmationTransactionId
        });
        setShowReceiptModal(true);
        break;

      case 'negado':
        console.log('❌ [PRODUCT-CARD] Pagamento NEGADO');
        toast.error('Pagamento negado', { description: resultado.mensagem || 'Tente novamente' });
        setError(resultado.mensagem || 'Pagamento negado');
        setProcessing(false);
        setPaymentType(null);
        setPaymentStarted(false);
        break;

      case 'cancelado':
        console.log('⚠️ [PRODUCT-CARD] Pagamento CANCELADO');
        toast.info('Pagamento cancelado');
        setProcessing(false);
        setPaymentType(null);
        setPaymentStarted(false);
        break;

      case 'erro':
        console.log('❌ [PRODUCT-CARD] ERRO no pagamento');
        toast.error('Erro no pagamento', { description: resultado.mensagem });
        setError(resultado.mensagem || 'Erro desconhecido');
        setProcessing(false);
        setPaymentType(null);
        setPaymentStarted(false);
        break;
    }
  }, [sale]);

  // Hook TEF Result - IDÊNTICO AO SERVIÇO
  useTEFPaymentResult({
    enabled: paymentStarted && processing,
    onResult: handleTEFResult,
    pollingInterval: 500,
    maxWaitTime: 180000
  });

  // Hook TEF Android - SEM callbacks (resultado via useTEFPaymentResult)
  const {
    isAndroidAvailable,
    isPinpadConnected,
    isProcessing: tefProcessing,
    iniciarPagamento: iniciarPagamentoTEF,
    cancelarPagamento: cancelarPagamentoTEF,
    verificarConexao
  } = useTEFAndroid({});

  // Delay inicial para verificar conexão TEF
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsCheckingConnection(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Log status TEF
  useEffect(() => {
    console.log('🔌 [PRODUCT-CARD] Status TEF:', { isAndroidAvailable, isPinpadConnected, isCheckingConnection });
  }, [isAndroidAvailable, isPinpadConnected, isCheckingConnection]);

  // Verificar dados ao montar
  useEffect(() => {
    if (!sale || !client) {
      console.warn('[PRODUCT-CARD] Dados incompletos, redirecionando...');
      navigate('/totem/home');
    }
  }, []);

  // INICIAR PAGAMENTO - IDÊNTICO AO handlePaymentType DO SERVIÇO
  const handlePaymentType = async (type: 'credit' | 'debit') => {
    console.log('💳 [PRODUCT-CARD] ═══════════════════════════════════════');
    console.log('💳 [PRODUCT-CARD] INICIANDO PAGAMENTO');
    console.log('💳 [PRODUCT-CARD] Tipo:', type);
    console.log('💳 [PRODUCT-CARD] Venda ID:', sale?.id);
    console.log('💳 [PRODUCT-CARD] Total:', sale?.total);
    console.log('💳 [PRODUCT-CARD] ═══════════════════════════════════════');

    logTEFTransaction('checkout_produto', 'info', `[PRODUTO] Iniciando pagamento ${type.toUpperCase()}`, {
      tipo: type, venda_id: sale?.id, total: sale?.total, isAndroidAvailable, isPinpadConnected
    });

    // Evitar duplo clique / reentrada
    if (processing || paymentStarted) return;

    setPaymentType(type);
    setError(null);
    finalizingRef.current = false;

    // Checar bridge TEF diretamente
    const hasNativeBridge = typeof window !== 'undefined' && typeof (window as any).TEF !== 'undefined';

    if (!hasNativeBridge) {
      toast.error('PayGo indisponível', {
        description: 'O WebView não detectou a bridge TEF (window.TEF). Verifique se está no APK do Totem.'
      });
      return;
    }

    // Revalidar pinpad antes de iniciar
    const status = verificarConexao();
    const connected = !!status?.conectado;

    if (!connected) {
      toast.error('Pinpad não conectado', {
        description: 'Verifique a conexão da maquininha e tente novamente.'
      });
      return;
    }

    setProcessing(true);
    setPaymentStarted(true);

    try {
      const ordemId = (sale?.id as string) || `CARD_PRODUCT_${Date.now()}`;

      const success = await iniciarPagamentoTEF({
        ordemId,
        valor: sale?.total,
        tipo: type,
        parcelas: 1
      });

      if (!success) {
        toast.error('Erro ao iniciar pagamento', {
          description: 'A bridge TEF retornou falha ao iniciar a transação.'
        });
        setProcessing(false);
        setPaymentType(null);
        setPaymentStarted(false);
      }
    } catch (error) {
      console.error('❌ [PRODUCT-CARD] Erro no pagamento:', error);
      toast.error('Erro no pagamento');
      setProcessing(false);
      setPaymentType(null);
      setPaymentStarted(false);
    }
  };

  const handleCancelPayment = () => {
    cancelarPagamentoTEF();
    setProcessing(false);
    setPaymentType(null);
    setPaymentStarted(false);
    toast.info('Pagamento cancelado');
  };

  if (!sale) return null;

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
              <Button onClick={() => navigate(-1)} variant="outline" className="w-full border-muted text-muted-foreground">
                Voltar
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // RENDERIZAÇÃO PRINCIPAL - IDÊNTICA AO SERVIÇO
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="fixed inset-0 w-screen h-screen flex flex-col p-3 sm:p-4 md:p-6 font-poppins overflow-hidden relative">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img src={barbershopBg} alt="Barbearia" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-urbana-black/60" />
      </div>

      {/* Premium background effects */}
      <div className="absolute inset-0 overflow-hidden z-0">
        <div className="absolute top-1/4 right-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-urbana-gold/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-urbana-gold-vibrant/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4 md:mb-6 z-10">
        <Button
          onClick={() => navigate(-1)}
          variant="ghost"
          size="lg"
          className="h-10 sm:h-12 md:h-14 px-3 sm:px-4 md:px-6 text-sm sm:text-base md:text-lg text-urbana-light hover:text-urbana-gold hover:bg-urbana-gold/10"
          disabled={processing}
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Voltar</span>
        </Button>
        <div className="text-center flex-1">
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-urbana-gold via-urbana-gold-light to-urbana-gold">
            Pagamento com Cartão
          </h1>
          {isAndroidAvailable && isPinpadConnected ? (
            <p className="text-xs sm:text-sm md:text-base text-green-400 mt-0.5 flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              PayGo conectado
            </p>
          ) : (
            <p className="text-xs sm:text-sm md:text-base text-red-400 mt-0.5 flex items-center justify-center gap-1">
              <WifiOff className="w-3 h-3" />
              PayGo / Pinpad desconectado
            </p>
          )}
        </div>
        <div className="w-12 sm:w-16 md:w-24"></div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center z-10 py-2">
        <Card className="w-full max-w-lg sm:max-w-xl md:max-w-2xl p-3 sm:p-5 md:p-6 space-y-3 sm:space-y-4 bg-black/30 backdrop-blur-xl border-2 border-urbana-gold/30 shadow-[0_8px_32px_rgba(212,175,55,0.3)] rounded-2xl">

          {/* Amount Display */}
          <div className="text-center space-y-1 sm:space-y-2 p-3 sm:p-4 bg-gradient-to-r from-urbana-gold/10 via-urbana-gold-vibrant/10 to-urbana-gold/10 rounded-xl border-2 border-urbana-gold/30">
            <p className="text-sm sm:text-base md:text-lg text-urbana-light/70 font-medium">Valor total</p>
            <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-urbana-gold via-urbana-gold-light to-urbana-gold">
              R$ {sale?.total?.toFixed(2)}
            </p>
          </div>

          {!processing ? (
            <>
              {/* Card Type Selection - IDÊNTICO AO SERVIÇO */}
              <div className="space-y-3 sm:space-y-4">
                <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-urbana-light via-urbana-gold-light to-urbana-light text-center">
                  Escolha o tipo de cartão
                </h3>

                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {/* Credit Card */}
                  <button
                    onClick={() => handlePaymentType('credit')}
                    className="group relative h-28 sm:h-32 md:h-36 bg-gradient-to-br from-urbana-gold/20 to-urbana-gold-dark/20 active:from-urbana-gold/30 active:to-urbana-gold-dark/30 border-2 border-urbana-gold/50 active:border-urbana-gold rounded-xl transition-all duration-100 active:scale-98 overflow-hidden"
                  >
                    <div className="relative h-full flex flex-col items-center justify-center gap-2 p-2">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl bg-urbana-gold/20 flex items-center justify-center">
                        <CreditCard className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-urbana-gold" />
                      </div>
                      <div className="text-center">
                        <span className="text-xl sm:text-2xl md:text-3xl font-black text-urbana-gold block">CRÉDITO</span>
                        <span className="text-[10px] sm:text-xs text-urbana-gray-light">Parcelamento disponível</span>
                      </div>
                    </div>
                  </button>

                  {/* Debit Card */}
                  <button
                    onClick={() => handlePaymentType('debit')}
                    className="group relative h-28 sm:h-32 md:h-36 bg-gradient-to-br from-urbana-gold/20 to-urbana-gold-dark/20 active:from-urbana-gold/30 active:to-urbana-gold-dark/30 border-2 border-urbana-gold/50 active:border-urbana-gold rounded-xl transition-all duration-100 active:scale-98 overflow-hidden"
                  >
                    <div className="relative h-full flex flex-col items-center justify-center gap-2 p-2">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl bg-urbana-gold/20 flex items-center justify-center">
                        <CreditCard className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-urbana-gold" />
                      </div>
                      <div className="text-center">
                        <span className="text-xl sm:text-2xl md:text-3xl font-black text-urbana-gold block">DÉBITO</span>
                        <span className="text-[10px] sm:text-xs text-urbana-gray-light">Pagamento à vista</span>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Info */}
              <div className="text-center pt-2">
                <p className="text-sm sm:text-base md:text-lg text-urbana-gray-light">
                  Após selecionar, siga as instruções na maquininha
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Processing State - IDÊNTICO AO SERVIÇO */}
              <div className="flex flex-col items-center justify-center py-6 sm:py-8 space-y-4 sm:space-y-6">
                {/* Status TEF */}
                <div className="bg-gradient-to-r from-green-500/15 to-green-600/10 border border-green-500/40 rounded-xl p-4 w-full">
                  <div className="flex items-center justify-center gap-2 text-green-400">
                    <div className="relative">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-ping absolute" />
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                    </div>
                    <p className="text-base font-bold">
                      ✅ PayGo Integrado - Aguardando pagamento no pinpad
                    </p>
                  </div>
                </div>

                <div className="relative w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-urbana-gold/30 to-urbana-gold-vibrant/30 flex items-center justify-center shadow-lg shadow-urbana-gold/20">
                    <CreditCard className="w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18 text-urbana-gold" />
                  </div>
                  <Loader2 className="absolute inset-0 w-full h-full text-urbana-gold/40 animate-spin" />
                </div>

                <div className="text-center space-y-2 sm:space-y-3">
                  <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-urbana-gold via-urbana-gold-light to-urbana-gold">
                    Processando Pagamento
                  </h3>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-urbana-gold/90">
                    {paymentType === 'credit' ? 'CRÉDITO' : 'DÉBITO'}
                  </p>
                  <p className="text-lg sm:text-xl text-urbana-light/80">
                    Aproxime ou insira seu cartão na máquina
                  </p>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-center gap-2 sm:gap-3 mt-4">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                    <span className="text-xs sm:text-sm text-urbana-light">TEF</span>
                  </div>
                  <div className="w-6 sm:w-8 h-0.5 bg-urbana-gold/30" />
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                    <span className="text-xs sm:text-sm text-urbana-light">Pinpad</span>
                  </div>
                  <div className="w-6 sm:w-8 h-0.5 bg-urbana-gold/30" />
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-urbana-gold rounded-full animate-pulse" />
                    <span className="text-xs sm:text-sm text-urbana-light">Pagamento</span>
                  </div>
                </div>

                {/* Cancel Button */}
                <Button
                  onClick={handleCancelPayment}
                  variant="outline"
                  className="mt-4 sm:mt-6 border-red-500/50 text-red-400 hover:bg-red-500/10"
                >
                  Cancelar pagamento
                </Button>
              </div>
            </>
          )}

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3">
              <div>
                <p className="text-red-400 font-medium">Erro no pagamento</p>
                <p className="text-red-300/70 text-sm">{error}</p>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Modal de opções de comprovante - IDÊNTICO AO SERVIÇO */}
      <TotemReceiptOptionsModal
        isOpen={showReceiptModal}
        onClose={() => {}}
        onComplete={handleReceiptComplete}
        clientName={client?.nome || ''}
        clientEmail={client?.email}
        total={sale?.total || 0}
        onSendEmail={handleSendReceiptEmail}
        isPrintAvailable={false}
      />
    </div>
  );
};

export default TotemProductPaymentCard;
