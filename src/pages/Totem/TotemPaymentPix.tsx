import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, CheckCircle2, Loader2, WifiOff, QrCode } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTEFAndroid } from '@/hooks/useTEFAndroid';
import { useTEFPaymentResult } from '@/hooks/useTEFPaymentResult';
import { TEFResultado } from '@/lib/tef/tefAndroidBridge';
import barbershopBg from '@/assets/barbershop-background.jpg';

const TotemPaymentPix: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { venda_id, session_id, appointment, client, total, selectedProducts = [], isDirect = false } = location.state || {};
  
  const [processing, setProcessing] = useState(false);
  const [currentPaymentId, setCurrentPaymentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paymentStarted, setPaymentStarted] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(true); // Delay inicial para verificar conexão
  
  const isProcessingRef = useRef(false);
  const finalizingRef = useRef(false);
  const currentPaymentIdRef = useRef<string | null>(null);

  // CRÍTICO: Recuperar payment ID do localStorage ao montar
  // Isso garante que o ID não seja perdido se o WebView for recriado
  useEffect(() => {
    const storedPaymentId = localStorage.getItem('currentPaymentId');
    const storedPaymentTime = localStorage.getItem('currentPaymentIdTime');
    
    if (storedPaymentId && storedPaymentTime) {
      const age = Date.now() - parseInt(storedPaymentTime, 10);
      // Aceitar se foi criado nos últimos 5 minutos
      if (age < 300000) {
        console.log('[PIX] 🔄 Recuperando payment ID do localStorage:', storedPaymentId);
        currentPaymentIdRef.current = storedPaymentId;
        setCurrentPaymentId(storedPaymentId);
        setPaymentStarted(true);
        setProcessing(true);
      } else {
        // Limpar dados antigos
        localStorage.removeItem('currentPaymentId');
        localStorage.removeItem('currentPaymentIdTime');
      }
    }
  }, []);

  // Atualizar ref E persistir no localStorage
  useEffect(() => {
    currentPaymentIdRef.current = currentPaymentId;
    if (currentPaymentId) {
      localStorage.setItem('currentPaymentId', currentPaymentId);
      localStorage.setItem('currentPaymentIdTime', Date.now().toString());
      console.log('[PIX] 💾 Payment ID salvo no localStorage:', currentPaymentId);
    }
  }, [currentPaymentId]);

  // Função para finalizar pagamento
  const finalizePayment = useCallback(async (paymentId: string, transactionData: {
    nsu?: string;
    autorizacao?: string;
  }) => {
    // Evitar finalização duplicada
    if (finalizingRef.current) {
      console.log('[PIX] ⚠️ Finalização já em andamento');
      return;
    }
    finalizingRef.current = true;
    
    try {
      console.log('✅ [PIX] ═══════════════════════════════════════');
      console.log('✅ [PIX] FINALIZANDO PAGAMENTO PIX');
      console.log('✅ [PIX] Payment ID:', paymentId);
      console.log('✅ [PIX] NSU:', transactionData.nsu);
      console.log('✅ [PIX] Autorização:', transactionData.autorizacao);
      console.log('✅ [PIX] ═══════════════════════════════════════');
      
      // Atualizar status do pagamento
      await supabase
        .from('totem_payments')
        .update({
          status: 'completed',
          paid_at: new Date().toISOString(),
          ...(transactionData.nsu && { nsu: transactionData.nsu }),
          ...(transactionData.autorizacao && { authorization_code: transactionData.autorizacao })
        })
        .eq('id', paymentId);

      // Finalizar venda
      if (isDirect) {
        await supabase.functions.invoke('totem-direct-sale', {
          body: {
            action: 'finish',
            venda_id: venda_id,
            payment_id: paymentId
          }
        });
      } else {
        // Atualizar estoque
        if (selectedProducts && selectedProducts.length > 0) {
          for (const product of selectedProducts) {
            await supabase.rpc('decrease_product_stock', {
              p_product_id: product.product_id,
              p_quantity: product.quantidade
            });
          }
        }

        // Finalizar checkout
        await supabase.functions.invoke('totem-checkout', {
          body: {
            action: 'finish',
            venda_id: venda_id,
            session_id: session_id,
            payment_id: paymentId
          }
        });
      }

      console.log('✅ [PIX] Pagamento finalizado com sucesso!');
      toast.success('Pagamento PIX confirmado!');
      
      // Limpar localStorage após sucesso
      localStorage.removeItem('currentPaymentId');
      localStorage.removeItem('currentPaymentIdTime');
      localStorage.removeItem('currentPaymentType');
      
      navigate('/totem/payment-success', { 
        state: { 
          appointment, 
          client,
          total,
          paymentMethod: 'pix',
          isDirect,
          transactionData
        },
        replace: true
      });
    } catch (error) {
      console.error('❌ [PIX] Erro ao finalizar:', error);
      toast.error('Erro ao processar pagamento');
      setProcessing(false);
      finalizingRef.current = false;
    }
  }, [venda_id, session_id, isDirect, selectedProducts, appointment, client, total, navigate]);

  // Handler para resultado do TEF
  // IMPORTANTE: Usa refs E localStorage para garantir acesso aos valores
  const handleTEFResult = useCallback((resultado: TEFResultado) => {
    console.log('📞 [PIX] ═══════════════════════════════════════');
    console.log('📞 [PIX] handleTEFResult CHAMADO');
    console.log('📞 [PIX] Status:', resultado.status);
    console.log('📞 [PIX] currentPaymentIdRef:', currentPaymentIdRef.current);
    console.log('📞 [PIX] currentPaymentId (state):', currentPaymentId);
    
    // CRÍTICO: Tentar múltiplas fontes para o paymentId
    let paymentId = currentPaymentIdRef.current || currentPaymentId;
    
    // Se não encontrou em ref/state, tentar localStorage (sobrevive reload do WebView)
    if (!paymentId) {
      const storedPaymentId = localStorage.getItem('currentPaymentId');
      const storedPaymentTime = localStorage.getItem('currentPaymentIdTime');
      
      if (storedPaymentId && storedPaymentTime) {
        const age = Date.now() - parseInt(storedPaymentTime, 10);
        if (age < 300000) { // 5 minutos
          console.log('[PIX] 🔄 Recuperando payment ID do localStorage:', storedPaymentId);
          paymentId = storedPaymentId;
          currentPaymentIdRef.current = storedPaymentId;
        }
      }
    }
    
    console.log('📞 [PIX] PaymentId final:', paymentId);
    console.log('📞 [PIX] ═══════════════════════════════════════');
    
    switch (resultado.status) {
      case 'aprovado':
        console.log('✅ [PIX] Pagamento APROVADO pelo PayGo');
        console.log('✅ [PIX] PaymentId disponível:', paymentId);
        if (paymentId) {
          finalizePayment(paymentId, {
            nsu: resultado.nsu,
            autorizacao: resultado.autorizacao
          });
        } else {
          console.error('❌ [PIX] currentPaymentId não disponível - tentando recuperar...');
          console.log('❌ [PIX] Dados do resultado:', JSON.stringify(resultado, null, 2));
          toast.error('Erro interno - ID do pagamento não encontrado. Procure um atendente.');
          setProcessing(false);
          setPaymentStarted(false);
        }
        break;
        
      case 'negado':
        console.log('❌ [PIX] Pagamento NEGADO pelo PayGo');
        toast.error('Pagamento PIX negado', { description: resultado.mensagem || 'Tente novamente' });
        setError(resultado.mensagem || 'Pagamento negado');
        setProcessing(false);
        setPaymentStarted(false);
        break;
        
      case 'cancelado':
        console.log('⚠️ [PIX] Pagamento CANCELADO');
        toast.info('Pagamento cancelado');
        setProcessing(false);
        setPaymentStarted(false);
        break;
        
      case 'erro':
        console.log('❌ [PIX] ERRO no pagamento');
        toast.error('Erro no pagamento PIX', { description: resultado.mensagem });
        setError(resultado.mensagem || 'Erro desconhecido');
        setProcessing(false);
        setPaymentStarted(false);
        break;
    }
  }, [finalizePayment, currentPaymentId]);

  // Hook dedicado para receber resultado do PayGo - ÚNICO receptor de resultados
  useTEFPaymentResult({
    enabled: paymentStarted && processing,
    onResult: handleTEFResult,
    pollingInterval: 500,
    maxWaitTime: 180000 // 3 minutos
  });

  // Hook TEF Android (APENAS para iniciar pagamento - NÃO para receber resultado)
  const {
    isAndroidAvailable,
    isPinpadConnected,
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

  // Iniciar pagamento PIX via TEF quando componente montar
  useEffect(() => {
    if (!venda_id || !total) {
      console.error('❌ [PIX] Dados incompletos');
      toast.error('Dados de pagamento incompletos');
      navigate('/totem/home');
      return;
    }

    if (!isAndroidAvailable || !isPinpadConnected) {
      console.log('⚠️ [PIX] TEF não disponível, aguardando...');
      return;
    }

    if (isProcessingRef.current) {
      return;
    }

    iniciarPagamentoPix();
  }, [isAndroidAvailable, isPinpadConnected, venda_id, total]);

  const iniciarPagamentoPix = async () => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    
    console.log('💚 [PIX] ═══════════════════════════════════════');
    console.log('💚 [PIX] INICIANDO PAGAMENTO PIX VIA TEF PAYGO');
    console.log('💚 [PIX] Venda ID:', venda_id);
    console.log('💚 [PIX] Total:', total);
    console.log('💚 [PIX] ═══════════════════════════════════════');
    
    setProcessing(true);
    setError(null);
    setPaymentStarted(true);
    finalizingRef.current = false;

    try {
      // Criar registro de pagamento PRIMEIRO e aguardar sincronização
      console.log('💚 [PIX] Criando registro de pagamento...');
      const { data: payment, error: paymentError } = await supabase
        .from('totem_payments')
        .insert({
          session_id: session_id,
          payment_method: 'pix',
          amount: total,
          status: 'processing',
          transaction_id: `PIX${Date.now()}`
        })
        .select()
        .single();

      if (paymentError) {
        console.error('❌ [PIX] Erro ao criar registro:', paymentError);
        throw paymentError;
      }

      console.log('✅ [PIX] Registro criado:', payment.id);
      
      // CRÍTICO: Atualizar ref IMEDIATAMENTE antes de qualquer outra operação
      currentPaymentIdRef.current = payment.id;
      setCurrentPaymentId(payment.id);
      
      // Log de confirmação
      console.log('✅ [PIX] currentPaymentIdRef.current ATUALIZADO:', currentPaymentIdRef.current);

      // Chamar TEF Android para PIX
      console.log('🔌 [PIX] Chamando TEF PayGo para PIX...');
      const success = await iniciarPagamentoTEF({
        ordemId: payment.id,
        valor: total,
        tipo: 'pix',
        parcelas: 1
      });

      if (!success) {
        console.error('❌ [PIX] Falha ao iniciar TEF');
        toast.error('Erro ao iniciar pagamento PIX');
        setProcessing(false);
        setPaymentStarted(false);
        isProcessingRef.current = false;
      } else {
        console.log('✅ [PIX] TEF iniciado, aguardando resposta do PayGo...');
      }

    } catch (error) {
      console.error('❌ [PIX] Erro:', error);
      toast.error('Erro ao processar pagamento');
      setProcessing(false);
      setPaymentStarted(false);
      isProcessingRef.current = false;
    }
  };

  const handleCancelPayment = () => {
    cancelarPagamentoTEF();
    setProcessing(false);
    setPaymentStarted(false);
    isProcessingRef.current = false;
    toast.info('Pagamento cancelado');
    navigate('/totem/checkout', { state: location.state });
  };

  // Tela de erro quando TEF não está disponível (APENAS após delay de verificação)
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
            <h2 className="text-2xl font-bold text-white mb-4">Pinpad Não Conectado</h2>
            <p className="text-gray-300 mb-6">
              A maquininha não está conectada. Verifique a conexão para realizar pagamentos PIX.
            </p>
            <div className="space-y-3">
              <Button 
                onClick={() => window.location.reload()} 
                className="w-full bg-urbana-gold hover:bg-urbana-gold-dark"
              >
                Tentar Novamente
              </Button>
              <Button 
                onClick={() => navigate('/totem/checkout', { state: location.state })} 
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
    <div className="fixed inset-0 w-screen h-screen flex flex-col p-3 sm:p-4 md:p-6 font-poppins overflow-hidden relative">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img src={barbershopBg} alt="Barbearia" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-urbana-black/60" />
      </div>

      {/* Premium background effects */}
      <div className="absolute inset-0 overflow-hidden z-0">
        <div className="absolute top-1/4 right-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-green-400/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6 z-10">
        <Button
          onClick={handleCancelPayment}
          variant="ghost"
          size="lg"
          className="h-10 sm:h-12 md:h-14 px-3 sm:px-4 md:px-6 text-sm sm:text-base md:text-lg text-urbana-light hover:text-urbana-gold hover:bg-urbana-gold/20"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Cancelar</span>
        </Button>
        <div className="text-center flex-1">
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-green-300 to-green-400">
            Pagamento via PIX
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-green-400 mt-1 flex items-center justify-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            PayGo conectado
          </p>
        </div>
        <div className="w-12 sm:w-16 md:w-24"></div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center overflow-y-auto py-2 z-10">
        <Card className="w-full max-w-xl sm:max-w-2xl md:max-w-3xl p-4 sm:p-6 md:p-8 lg:p-10 space-y-6 bg-black/30 backdrop-blur-xl border-2 border-green-500/30 shadow-[0_8px_32px_rgba(34,197,94,0.3)] text-center rounded-3xl">
          
          {/* Status TEF */}
          <div className="bg-gradient-to-r from-green-500/20 via-green-400/15 to-green-500/20 border-2 border-green-500/40 rounded-xl p-4">
            <div className="flex items-center justify-center gap-2">
              <div className="relative">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-ping absolute" />
                <div className="w-2 h-2 bg-green-400 rounded-full" />
              </div>
              <p className="text-base sm:text-lg font-bold text-green-400">
                ✅ PayGo Integrado - Aguardando pagamento PIX...
              </p>
            </div>
          </div>

          {/* Visual do QR Code (indicação que está no pinpad) */}
          <div className="flex justify-center py-6">
            <div className="relative">
              <div className="absolute -inset-3 bg-green-500/20 rounded-2xl blur-xl animate-pulse" />
              <div className="relative bg-gradient-to-br from-green-500/20 to-green-600/20 p-8 rounded-2xl border-2 border-green-500/40">
                <QrCode className="w-24 h-24 sm:w-32 sm:h-32 text-green-400" />
              </div>
            </div>
          </div>

          {/* Instrução */}
          <div className="space-y-4">
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
              Escaneie o QR Code na maquininha
            </p>
            <p className="text-base sm:text-lg text-gray-300">
              O código PIX está sendo exibido no pinpad
            </p>
          </div>

          {/* Amount */}
          <div className="space-y-2 p-5 bg-gradient-to-r from-green-500/10 via-green-400/10 to-green-500/10 rounded-xl border-2 border-green-500/30">
            <p className="text-lg text-gray-400 font-medium">Valor total</p>
            <p className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-green-300 to-green-400">
              R$ {total?.toFixed(2)}
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
              <span className="text-xs sm:text-sm text-urbana-light">TEF</span>
            </div>
            <div className="w-6 sm:w-8 h-0.5 bg-green-500/30" />
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
              <span className="text-xs sm:text-sm text-urbana-light">QR Code</span>
            </div>
            <div className="w-6 sm:w-8 h-0.5 bg-green-500/30" />
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-green-400 rounded-full animate-pulse" />
              <span className="text-xs sm:text-sm text-urbana-light">Pagamento</span>
            </div>
          </div>

          {/* Loader */}
          <div className="flex justify-center">
            <Loader2 className="w-10 h-10 text-green-400 animate-spin" />
          </div>

          {/* Cancel Button */}
          <Button
            onClick={handleCancelPayment}
            variant="outline"
            size="lg"
            className="border-red-500/50 text-red-400 hover:bg-red-500/10"
          >
            Cancelar Pagamento
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default TotemPaymentPix;
