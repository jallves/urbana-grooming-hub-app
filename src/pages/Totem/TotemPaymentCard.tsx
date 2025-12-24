import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, CreditCard, Loader2, CheckCircle2, AlertTriangle, WifiOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTEFAndroid } from '@/hooks/useTEFAndroid';
import { useTEFPaymentResult } from '@/hooks/useTEFPaymentResult';
import { TEFResultado } from '@/lib/tef/tefAndroidBridge';
import barbershopBg from '@/assets/barbershop-background.jpg';

const TotemPaymentCard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { venda_id, session_id, appointment, client, total, selectedProducts = [], extraServices = [], resumo, isDirect = false } = location.state || {};
  
  const [processing, setProcessing] = useState(false);
  const [paymentType, setPaymentType] = useState<'credit' | 'debit' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paymentStarted, setPaymentStarted] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(true);
  
  // Estado para simulação (quando TEF não disponível)
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationTimeLeft, setSimulationTimeLeft] = useState(5);
  const [simulationStatus, setSimulationStatus] = useState<'processing' | 'approved'>('processing');
  
  // Ref para evitar finalização duplicada
  const finalizingRef = useRef(false);
  const paymentTypeRef = useRef<'credit' | 'debit' | null>(null);
  
  // Atualizar ref quando paymentType mudar
  useEffect(() => {
    paymentTypeRef.current = paymentType;
  }, [paymentType]);

  // Função de finalização - NÃO depende mais de currentPaymentId
  // Usa venda_id diretamente do location.state (assim como TotemProductPaymentCard faz)
  const finalizePayment = useCallback(async (transactionData: {
    nsu?: string;
    autorizacao?: string;
    bandeira?: string;
  }) => {
    // Evitar finalização duplicada
    if (finalizingRef.current) {
      console.log('[CARD] ⚠️ Finalização já em andamento, ignorando');
      return;
    }
    finalizingRef.current = true;
    
    try {
      console.log('✅ [CARD] ═══════════════════════════════════════');
      console.log('✅ [CARD] FINALIZANDO PAGAMENTO DE SERVIÇO');
      console.log('✅ [CARD] Venda ID:', venda_id);
      console.log('✅ [CARD] Session ID:', session_id);
      console.log('✅ [CARD] NSU:', transactionData.nsu);
      console.log('✅ [CARD] Autorização:', transactionData.autorizacao);
      console.log('✅ [CARD] Bandeira:', transactionData.bandeira);
      console.log('✅ [CARD] ═══════════════════════════════════════');

      // Atualizar estoque dos produtos (se houver)
      if (selectedProducts && selectedProducts.length > 0) {
        for (const product of selectedProducts) {
          await supabase.rpc('decrease_product_stock', {
            p_product_id: product.product_id,
            p_quantity: product.quantidade
          });
        }
      }

      // Finalizar venda - usando edge function
      if (isDirect) {
        console.log('📡 [CARD] Chamando totem-direct-sale...');
        const { error: directError } = await supabase.functions.invoke('totem-direct-sale', {
          body: {
            action: 'finish',
            venda_id: venda_id,
            transaction_data: transactionData
          }
        });
        
        if (directError) {
          console.error('❌ [CARD] Erro ao finalizar venda direta:', directError);
          throw directError;
        }
      } else {
        // Finalizar checkout de serviço normal
        console.log('📡 [CARD] Chamando totem-checkout finish...');
        const { error: checkoutError } = await supabase.functions.invoke('totem-checkout', {
          body: {
            action: 'finish',
            venda_id: venda_id,
            session_id: session_id,
            transaction_data: transactionData
          }
        });
        
        if (checkoutError) {
          console.error('❌ [CARD] Erro ao finalizar checkout:', checkoutError);
          throw checkoutError;
        }
      }

      console.log('✅ [CARD] Pagamento finalizado com sucesso!');
      toast.success('Pagamento aprovado!');
      
      navigate('/totem/payment-success', { 
        state: { 
          appointment, 
          client,
          total,
          paymentMethod: paymentTypeRef.current,
          isDirect,
          transactionData,
          selectedProducts,
          extraServices,
          resumo
        } 
      });
    } catch (error) {
      console.error('❌ [CARD] Erro ao finalizar:', error);
      toast.error('Erro ao processar pagamento');
      setProcessing(false);
      finalizingRef.current = false;
    }
  }, [venda_id, session_id, isDirect, selectedProducts, appointment, client, total, navigate]);

  // Handler para resultado do TEF
  // SIMPLIFICADO: NÃO depende de currentPaymentId - usa venda_id diretamente
  const handleTEFResult = useCallback((resultado: TEFResultado) => {
    console.log('📞 [CARD] ═══════════════════════════════════════');
    console.log('📞 [CARD] handleTEFResult CHAMADO');
    console.log('📞 [CARD] Status:', resultado.status);
    console.log('📞 [CARD] Venda ID:', venda_id);
    console.log('📞 [CARD] Session ID:', session_id);
    console.log('📞 [CARD] ═══════════════════════════════════════');
    
    switch (resultado.status) {
      case 'aprovado':
        console.log('✅ [CARD] Pagamento APROVADO pelo PayGo');
        // Finalizar diretamente com transactionData - SEM depender de paymentId
        finalizePayment({
          nsu: resultado.nsu,
          autorizacao: resultado.autorizacao,
          bandeira: resultado.bandeira
        });
        break;
        
      case 'negado':
        console.log('❌ [CARD] Pagamento NEGADO pelo PayGo');
        toast.error('Pagamento negado', { description: resultado.mensagem || 'Tente novamente' });
        setError(resultado.mensagem || 'Pagamento negado');
        setProcessing(false);
        setPaymentType(null);
        setPaymentStarted(false);
        break;
        
      case 'cancelado':
        console.log('⚠️ [CARD] Pagamento CANCELADO');
        toast.info('Pagamento cancelado');
        setProcessing(false);
        setPaymentType(null);
        setPaymentStarted(false);
        break;
        
      case 'erro':
        console.log('❌ [CARD] ERRO no pagamento');
        toast.error('Erro no pagamento', { description: resultado.mensagem });
        setError(resultado.mensagem || 'Erro desconhecido');
        setProcessing(false);
        setPaymentType(null);
        setPaymentStarted(false);
        break;
    }
  }, [finalizePayment, venda_id, session_id]);

  // Hook dedicado para receber resultado do PayGo - ÚNICO receptor de resultados
  // Importante: Este hook já tem proteções contra duplicatas e múltiplos mecanismos de recepção
  useTEFPaymentResult({
    enabled: paymentStarted && processing,
    onResult: handleTEFResult,
    pollingInterval: 500,
    maxWaitTime: 180000 // 3 minutos
  });

  // Hook TEF Android (APENAS para iniciar pagamento - NÃO para receber resultado)
  // O resultado é recebido exclusivamente pelo useTEFPaymentResult acima
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

  // Log status do TEF ao montar
  useEffect(() => {
    console.log('🔌 [CARD] Status TEF Android:', {
      isAndroidAvailable,
      isPinpadConnected,
      tefProcessing,
      processing,
      paymentStarted,
      isCheckingConnection
    });
  }, [isAndroidAvailable, isPinpadConnected, tefProcessing, processing, paymentStarted, isCheckingConnection]);

  const handlePaymentType = async (type: 'credit' | 'debit') => {
    console.log('💳 [CARD] ═══════════════════════════════════════');
    console.log('💳 [CARD] INICIANDO PAGAMENTO COM CARTÃO');
    console.log('💳 [CARD] Tipo:', type);
    console.log('💳 [CARD] Venda ID:', venda_id);
    console.log('💳 [CARD] Total:', total);
    console.log('💳 [CARD] TEF disponível:', isAndroidAvailable && isPinpadConnected);
    console.log('💳 [CARD] ═══════════════════════════════════════');
    
    setPaymentType(type);
    setProcessing(true);
    setError(null);
    finalizingRef.current = false;

    // Se TEF não disponível, usar simulação
    if (!isAndroidAvailable || !isPinpadConnected) {
      console.log('🎭 [CARD] TEF não disponível, iniciando modo simulação...');
      setIsSimulating(true);
      setSimulationStatus('processing');
      setSimulationTimeLeft(5);
      return;
    }

    setPaymentStarted(true);

    try {
      const { data: payment, error: paymentError } = await supabase
        .from('totem_payments')
        .insert({
          session_id: session_id,
          payment_method: type,
          amount: total,
          status: 'processing',
          transaction_id: `CARD${Date.now()}`
        })
        .select()
        .single();

      if (paymentError) throw paymentError;

      console.log('✅ [CARD] Registro criado:', payment.id);

      const success = await iniciarPagamentoTEF({
        ordemId: payment.id,
        valor: total,
        tipo: type,
        parcelas: 1
      });

      if (!success) {
        toast.error('Erro ao iniciar pagamento');
        setProcessing(false);
        setPaymentType(null);
        setPaymentStarted(false);
      }

    } catch (error) {
      console.error('❌ Erro no pagamento:', error);
      toast.error('Erro no pagamento');
      setProcessing(false);
      setPaymentType(null);
      setPaymentStarted(false);
    }
  };

  // Timer para simulação
  useEffect(() => {
    if (!isSimulating || simulationStatus !== 'processing') return;

    const interval = setInterval(() => {
      setSimulationTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setSimulationStatus('approved');
          
          setTimeout(() => {
            finalizePayment({
              nsu: `SIM${Date.now()}`,
              autorizacao: `AUTH${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
              bandeira: paymentType === 'credit' ? 'VISA' : 'MASTERCARD'
            });
          }, 1500);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isSimulating, simulationStatus, finalizePayment, paymentType]);

  const handleCancelPayment = () => {
    if (isSimulating) {
      setIsSimulating(false);
      setSimulationStatus('processing');
    } else {
      cancelarPagamentoTEF();
    }
    setProcessing(false);
    setPaymentType(null);
    setPaymentStarted(false);
    toast.info('Pagamento cancelado');
  };

  // Tela de simulação
  if (isSimulating && paymentType) {
    const paymentTypeLabel = paymentType === 'credit' ? 'Crédito' : 'Débito';
    
    return (
      <div className="fixed inset-0 w-screen h-screen flex flex-col p-4 font-poppins overflow-hidden relative">
        <div className="absolute inset-0 z-0">
          <img src={barbershopBg} alt="Barbearia" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-urbana-black/60" />
        </div>

        <div className="flex-1 flex items-center justify-center z-10">
          <Card className="w-full max-w-xl p-6 bg-black/30 backdrop-blur-xl border-2 border-urbana-gold/30 text-center rounded-2xl">
            {simulationStatus === 'processing' ? (
              <>
                <h2 className="text-2xl font-bold text-urbana-gold mb-4">Pagamento {paymentTypeLabel}</h2>
                
                <div className="relative w-32 h-32 mx-auto my-6 rounded-full bg-gradient-to-br from-urbana-gold to-urbana-gold-dark flex items-center justify-center animate-pulse">
                  <CreditCard className="w-16 h-16 text-urbana-black" />
                </div>

                <p className="text-3xl font-bold text-urbana-gold mb-4">R$ {total?.toFixed(2)}</p>
                
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Loader2 className="w-5 h-5 animate-spin text-urbana-gold" />
                  <span className="text-gray-300">Processando... ({simulationTimeLeft}s)</span>
                </div>

                <p className="text-sm text-gray-400 mb-4">Modo simulação - Aprovação automática</p>

                <Button onClick={handleCancelPayment} variant="outline" className="border-red-500/50 text-red-400">
                  Cancelar
                </Button>
              </>
            ) : (
              <div className="py-8">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center">
                  <CheckCircle2 className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-green-400">Pagamento Aprovado!</h3>
                <p className="text-gray-300 mt-2">Finalizando...</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    );
  }

  // Renderização principal - Seleção de tipo de cartão

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
          onClick={() => navigate('/totem/checkout', { state: location.state })}
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
            <p className="text-xs sm:text-sm md:text-base text-urbana-gold mt-0.5">
              Modo demonstração
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
              R$ {total?.toFixed(2)}
            </p>
          </div>

          {!processing ? (
            <>
              {/* Card Type Selection */}
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
              {/* Processing State */}
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
              <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0" />
              <div>
                <p className="text-red-400 font-medium">Erro no pagamento</p>
                <p className="text-red-300/70 text-sm">{error}</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default TotemPaymentCard;
