import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, CheckCircle2, Loader2, QrCode, XCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTEFAndroid } from '@/hooks/useTEFAndroid';
import { useTEFPaymentResult } from '@/hooks/useTEFPaymentResult';
import { TEFResultado } from '@/lib/tef/tefAndroidBridge';
import { QRCodeSVG } from 'qrcode.react';
import { sendReceiptEmail } from '@/services/receiptEmailService';
import { format } from 'date-fns';
import TotemReceiptOptionsModal from '@/components/totem/TotemReceiptOptionsModal';
import barbershopBg from '@/assets/barbershop-background.jpg';

const TotemPaymentPix: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { venda_id, session_id, appointment, client, total, selectedProducts = [], extraServices = [], resumo, isDirect = false, tipAmount = 0 } = location.state || {};
  
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentStarted, setPaymentStarted] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(true);
  
  // Estado para simulação (quando TEF não disponível)
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationTimeLeft, setSimulationTimeLeft] = useState(8);
  const [simulationStatus, setSimulationStatus] = useState<'waiting' | 'approved'>('waiting');
  
  // Estado para modal de opções de comprovante (IGUAL AO CARTÃO)
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [pendingTransactionData, setPendingTransactionData] = useState<{
    nsu?: string;
    autorizacao?: string;
  } | null>(null);
  
  // Ref para evitar finalização duplicada
  const finalizingRef = useRef(false);

  // Função para enviar e-mail de comprovante
  const handleSendReceiptEmail = useCallback(async (): Promise<boolean> => {
    if (!client?.email) return false;
    
    try {
      const items: Array<{ name: string; quantity?: number; unitPrice?: number; price: number; type: 'service' | 'product' }> = [];

      if (resumo?.original_service) {
        items.push({ name: resumo.original_service.nome, quantity: 1, unitPrice: resumo.original_service.preco, price: resumo.original_service.preco, type: 'service' });
      } else if (appointment?.servico) {
        const p = appointment.servico.preco || 0;
        items.push({ name: appointment.servico.nome, quantity: 1, unitPrice: p, price: p, type: 'service' });
      }

      if (resumo?.extra_services) {
        resumo.extra_services.forEach((service: { nome: string; preco: number }) => {
          items.push({ name: service.nome, quantity: 1, unitPrice: service.preco, price: service.preco, type: 'service' });
        });
      } else if (extraServices?.length > 0) {
        extraServices.forEach((service: { nome: string; preco: number }) => {
          items.push({ name: service.nome, quantity: 1, unitPrice: service.preco, price: service.preco, type: 'service' });
        });
      }

      if (selectedProducts?.length > 0) {
        selectedProducts.forEach((product: { nome: string; preco: number; quantidade: number }) => {
          items.push({
            name: product.nome,
            quantity: product.quantidade,
            unitPrice: product.preco,
            price: product.preco * product.quantidade,
            type: 'product'
          });
        });
      }

      if (items.length === 0) {
        items.push({ name: 'Serviço', price: total, type: 'service' });
      }

      const hasServices = items.some(item => item.type === 'service');
      const hasProducts = items.some(item => item.type === 'product');
      let transactionType: 'service' | 'product' | 'mixed' = 'service';
      if (hasServices && hasProducts) {
        transactionType = 'mixed';
      } else if (hasProducts) {
        transactionType = 'product';
      }

      const result = await sendReceiptEmail({
        clientName: client.nome,
        clientEmail: client.email,
        transactionType,
        items,
        total,
        paymentMethod: 'PIX',
        transactionDate: format(new Date(), "dd/MM/yyyy HH:mm"),
        nsu: pendingTransactionData?.nsu,
        barberName: appointment?.barbeiro?.nome,
        tipAmount: Number(tipAmount || 0),
      });

      return result.success;
    } catch (error) {
      console.error('[PIX] Erro ao enviar e-mail:', error);
      return false;
    }
  }, [client, resumo, appointment, extraServices, selectedProducts, total, pendingTransactionData, tipAmount]);

  // Função chamada após comprovante enviado/impresso - finaliza tudo (IGUAL AO CARTÃO)
  const handleReceiptComplete = useCallback(async () => {
    if (!pendingTransactionData) return;
    if (finalizingRef.current) return;
    finalizingRef.current = true;
    
    console.log('✅ [PIX] ═══════════════════════════════════════');
    console.log('✅ [PIX] COMPROVANTE PROCESSADO - FINALIZANDO');
    console.log('✅ [PIX] ═══════════════════════════════════════');
    
    try {
      if (isDirect) {
        await supabase.functions.invoke('totem-direct-sale', {
          body: {
            action: 'finish',
            venda_id: venda_id,
            transaction_data: pendingTransactionData
          }
        });
      } else {
        // Atualizar estoque manualmente
        if (selectedProducts && selectedProducts.length > 0) {
          for (const product of selectedProducts) {
            const { data: currentProduct } = await supabase
              .from('painel_produtos')
              .select('estoque')
              .eq('id', product.product_id)
              .single();
            
            if (currentProduct) {
              await supabase
                .from('painel_produtos')
                .update({ estoque: Math.max(0, currentProduct.estoque - product.quantidade) })
                .eq('id', product.product_id);
            }
          }
        }

        await supabase.functions.invoke('totem-checkout', {
          body: {
            action: 'finish',
            venda_id: venda_id,
            agendamento_id: appointment?.id,
            session_id: session_id,
            transaction_data: pendingTransactionData,
            payment_method: 'PIX',
            tipAmount: tipAmount,
            extras: (extraServices || []).map((s: any) => ({ id: s.id })),
            products: (selectedProducts || []).map((p: any) => ({ id: p.id || p.product_id, quantidade: p.quantidade })),
          }
        });
      }

      console.log('✅ [PIX] Checkout finalizado com sucesso!');
      
      navigate('/totem/payment-success', { 
        state: { 
          appointment, 
          client,
          total,
          paymentMethod: 'pix',
          isDirect,
          transactionData: pendingTransactionData,
          selectedProducts,
          extraServices,
          resumo,
          emailAlreadySent: true,
          tipAmount
        } 
      });
    } catch (error) {
      console.error('❌ [PIX] Erro ao finalizar:', error);
      toast.error('Erro ao finalizar checkout', {
        description: 'O pagamento foi aprovado. Procure a recepção.'
      });
      navigate('/totem/home');
    }
  }, [pendingTransactionData, venda_id, session_id, isDirect, selectedProducts, appointment, client, total, navigate, extraServices, resumo, tipAmount]);

  // Handler para resultado do TEF - IGUAL AO CARTÃO
  const handleTEFResult = useCallback((resultado: TEFResultado) => {
    console.log('📞 [PIX] ═══════════════════════════════════════');
    console.log('📞 [PIX] handleTEFResult CHAMADO');
    console.log('📞 [PIX] Status:', resultado.status);
    console.log('📞 [PIX] ═══════════════════════════════════════');
    
    switch (resultado.status) {
      case 'aprovado':
        console.log('✅ [PIX] Pagamento APROVADO - Mostrando opções de comprovante');
        setPendingTransactionData({
          nsu: resultado.nsu,
          autorizacao: resultado.autorizacao
        });
        setShowReceiptModal(true);
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
  }, []);

  // Hook dedicado para receber resultado do PayGo
  useTEFPaymentResult({
    enabled: paymentStarted && processing,
    onResult: handleTEFResult,
    pollingInterval: 500,
    maxWaitTime: 180000
  });

  // Hook TEF Android
  const {
    isAndroidAvailable,
    isPinpadConnected,
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

  // Log status do TEF ao montar
  useEffect(() => {
    console.log('🔌 [PIX] Status TEF Android:', {
      isAndroidAvailable,
      isPinpadConnected,
      processing,
      paymentStarted,
      isCheckingConnection
    });
  }, [isAndroidAvailable, isPinpadConnected, processing, paymentStarted, isCheckingConnection]);

  // IGUAL AO CARTÃO: Usuário clica no botão para iniciar PIX
  const handleStartPix = async () => {
    console.log('💚 [PIX] ═══════════════════════════════════════');
    console.log('💚 [PIX] INICIANDO PAGAMENTO PIX VIA PAYGO');
    console.log('💚 [PIX] Venda ID:', venda_id);
    console.log('💚 [PIX] Total:', total);
    console.log('💚 [PIX] ═══════════════════════════════════════');

    if (processing || paymentStarted) return;

    setError(null);
    finalizingRef.current = false;

    // Checar diretamente o objeto injetado pelo WebView
    const hasNativeBridge = typeof window !== 'undefined' && typeof (window as any).TEF !== 'undefined';

    if (!hasNativeBridge) {
      // Ambiente web - usar simulação
      console.log('⚠️ [PIX] Bridge TEF não disponível - iniciando simulação');
      setIsSimulating(true);
      setSimulationStatus('waiting');
      setSimulationTimeLeft(8);
      setProcessing(true);
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
      const ordemId = (venda_id as string) || `PIX_${Date.now()}`;

      // CHAMAR PAYGO COM TIPO PIX - PayGo abrirá a tela de seleção de carteiras digitais
      const success = await iniciarPagamentoTEF({
        ordemId,
        valor: total,
        tipo: 'pix',
        parcelas: 1
      });

      if (!success) {
        toast.error('Erro ao iniciar pagamento PIX', {
          description: 'A bridge TEF retornou falha ao iniciar a transação.'
        });
        setProcessing(false);
        setPaymentStarted(false);
      } else {
        console.log('✅ [PIX] PayGo iniciado - aguardando seleção de carteira digital');
      }
    } catch (error) {
      console.error('❌ [PIX] Erro:', error);
      toast.error('Erro ao processar pagamento');
      setProcessing(false);
      setPaymentStarted(false);
    }
  };

  // Timer para simulação - IGUAL AO CARTÃO
  useEffect(() => {
    if (!isSimulating || simulationStatus !== 'waiting') return;

    const interval = setInterval(() => {
      setSimulationTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setSimulationStatus('approved');
          
          setTimeout(() => {
            // Em simulação, mostrar modal de opções também
            setPendingTransactionData({
              nsu: `SIM${Date.now()}`,
              autorizacao: `AUTH${Math.random().toString(36).substring(2, 8).toUpperCase()}`
            });
            setShowReceiptModal(true);
          }, 1500);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isSimulating, simulationStatus]);

  const handleCancelPayment = () => {
    if (isSimulating) {
      setIsSimulating(false);
      setSimulationStatus('waiting');
    } else {
      cancelarPagamentoTEF();
    }
    setProcessing(false);
    setPaymentStarted(false);
    finalizingRef.current = false;
    toast.info('Pagamento cancelado');
    navigate('/totem/checkout', { state: location.state });
  };

  // Gerar código PIX para exibição (simulação)
  const pixCode = `00020126580014BR.GOV.BCB.PIX0136${venda_id || 'test'}520400005303986540${total?.toFixed(2) || '0.00'}5802BR5913COSTA URBANA6009SAO PAULO62070503***6304`;

  // Modal de opções de comprovante (IGUAL AO CARTÃO)
  if (showReceiptModal) {
    return (
      <>
        <div className="fixed inset-0 w-screen h-screen flex flex-col p-3 sm:p-4 md:p-6 font-poppins overflow-hidden relative">
          <div className="absolute inset-0 z-0">
            <img src={barbershopBg} alt="Barbearia" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-urbana-black/60" />
          </div>
        </div>
        <TotemReceiptOptionsModal
          isOpen={showReceiptModal}
          onClose={() => setShowReceiptModal(false)}
          onComplete={handleReceiptComplete}
          onSendEmail={handleSendReceiptEmail}
          clientEmail={client?.email}
          clientName={client?.nome || 'Cliente'}
          total={total}
        />
      </>
    );
  }

  // Renderização para simulação (QR Code na tela)
  if (isSimulating) {
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
          </div>
          <div className="w-12 sm:w-16 md:w-24"></div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center overflow-y-auto py-2 z-10">
          <Card className="w-full max-w-xl sm:max-w-2xl p-4 sm:p-6 md:p-8 space-y-6 bg-black/30 backdrop-blur-xl border-2 border-green-500/30 shadow-[0_8px_32px_rgba(34,197,94,0.3)] text-center rounded-3xl">
            
            {simulationStatus === 'waiting' ? (
              <>
                {/* QR Code Real */}
                <div className="flex justify-center py-4">
                  <div className="relative p-4 bg-white rounded-2xl">
                    <QRCodeSVG
                      value={pixCode}
                      size={200}
                      level="H"
                      includeMargin={false}
                    />
                  </div>
                </div>

                {/* Amount */}
                <div className="space-y-2 p-4 bg-gradient-to-r from-green-500/10 via-green-400/10 to-green-500/10 rounded-xl border-2 border-green-500/30">
                  <p className="text-lg text-gray-400 font-medium">Valor total</p>
                  <p className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-green-300 to-green-400">
                    R$ {total?.toFixed(2)}
                  </p>
                </div>

                {/* Timer */}
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 text-green-400 animate-spin" />
                  <span className="text-lg text-gray-300">
                    Aguardando pagamento... ({simulationTimeLeft}s)
                  </span>
                </div>

                {/* Info */}
                <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-xl">
                  <p className="text-sm text-gray-400">
                    Modo simulação - Aprovação automática em {simulationTimeLeft} segundos
                  </p>
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
              </>
            ) : (
              /* Aprovado */
              <div className="flex flex-col items-center space-y-6 py-8">
                <div className="relative">
                  <div className="absolute -inset-6 bg-gradient-to-br from-emerald-400 to-green-500 blur-2xl opacity-50" />
                  <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center">
                    <CheckCircle2 className="w-12 h-12 sm:w-16 sm:h-16 text-white" strokeWidth={3} />
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-400">
                    Pagamento Aprovado!
                  </h3>
                  <p className="text-lg text-gray-300">
                    Finalizando sua compra...
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    );
  }

  // Renderização principal - BOTÃO PARA INICIAR PIX (IGUAL AO CARTÃO)
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
          onClick={() => navigate('/totem/checkout', { state: location.state })}
          variant="ghost"
          size="lg"
          className="h-10 sm:h-12 md:h-14 px-3 sm:px-4 md:px-6 text-sm sm:text-base md:text-lg text-urbana-light hover:text-urbana-gold hover:bg-urbana-gold/20"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Voltar</span>
        </Button>
        <div className="text-center flex-1">
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-green-300 to-green-400">
            Pagamento via PIX
          </h1>
        </div>
        <div className="w-12 sm:w-16 md:w-24"></div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center overflow-y-auto py-2 z-10">
        <Card className="w-full max-w-xl sm:max-w-2xl md:max-w-3xl p-4 sm:p-6 md:p-8 lg:p-10 space-y-6 bg-black/30 backdrop-blur-xl border-2 border-green-500/30 shadow-[0_8px_32px_rgba(34,197,94,0.3)] text-center rounded-3xl">
          
          {/* Verificando conexão */}
          {isCheckingConnection ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 className="w-12 h-12 text-green-400 animate-spin" />
              <p className="text-lg text-gray-300">Verificando conexão...</p>
            </div>
          ) : error ? (
            /* Erro */
            <>
              <div className="bg-gradient-to-r from-red-500/20 via-red-400/15 to-red-500/20 border-2 border-red-500/40 rounded-xl p-4">
                <div className="flex items-center justify-center gap-2">
                  <XCircle className="w-5 h-5 text-red-400" />
                  <p className="text-base sm:text-lg font-bold text-red-400">
                    Erro no pagamento
                  </p>
                </div>
              </div>

              <div className="flex justify-center py-6">
                <div className="relative">
                  <div className="absolute -inset-3 bg-red-500/20 rounded-full blur-xl" />
                  <div className="relative bg-gradient-to-br from-red-500/20 to-red-600/20 p-6 rounded-full border-2 border-red-500/40">
                    <XCircle className="w-20 h-20 sm:w-24 sm:h-24 text-red-400" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                  Falha no pagamento PIX
                </p>
                <p className="text-base sm:text-lg text-gray-300">
                  {error}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={() => {
                    setError(null);
                    finalizingRef.current = false;
                  }}
                  size="lg"
                  className="bg-green-600 hover:bg-green-500 text-white"
                >
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Tentar Novamente
                </Button>
                <Button
                  onClick={() => navigate('/totem/checkout', { state: location.state })}
                  variant="outline"
                  size="lg"
                  className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                >
                  Cancelar
                </Button>
              </div>
            </>
          ) : processing ? (
            /* Processando - PayGo aberto */
            <>
              <div className="bg-gradient-to-r from-green-500/20 via-green-400/15 to-green-500/20 border-2 border-green-500/40 rounded-xl p-4">
                <div className="flex items-center justify-center gap-2">
                  <div className="relative">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-ping absolute" />
                    <div className="w-2 h-2 bg-green-400 rounded-full" />
                  </div>
                  <p className="text-base sm:text-lg font-bold text-green-400">
                    ✅ PayGo aberto - Selecione a opção de PIX
                  </p>
                </div>
              </div>

              <div className="flex justify-center py-6">
                <div className="relative">
                  <div className="absolute -inset-3 bg-green-500/20 rounded-2xl blur-xl animate-pulse" />
                  <div className="relative bg-gradient-to-br from-green-500/20 to-green-600/20 p-8 rounded-2xl border-2 border-green-500/40">
                    <QrCode className="w-24 h-24 sm:w-32 sm:h-32 text-green-400" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                  Complete o pagamento no PayGo
                </p>
                <p className="text-base sm:text-lg text-gray-300">
                  Selecione a carteira digital ou PIX na tela da maquininha
                </p>
              </div>

              <div className="space-y-2 p-5 bg-gradient-to-r from-green-500/10 via-green-400/10 to-green-500/10 rounded-xl border-2 border-green-500/30">
                <p className="text-lg text-gray-400 font-medium">Valor total</p>
                <p className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-green-300 to-green-400">
                  R$ {total?.toFixed(2)}
                </p>
              </div>

              <div className="flex justify-center">
                <Loader2 className="w-10 h-10 text-green-400 animate-spin" />
              </div>

              <Button
                onClick={handleCancelPayment}
                variant="outline"
                size="lg"
                className="border-red-500/50 text-red-400 hover:bg-red-500/10"
              >
                Cancelar Pagamento
              </Button>
            </>
          ) : (
            /* Tela inicial - BOTÃO PARA INICIAR PIX */
            <>
              <div className="flex justify-center py-6">
                <div className="relative">
                  <div className="absolute -inset-3 bg-green-500/20 rounded-2xl blur-xl" />
                  <div className="relative bg-gradient-to-br from-green-500/20 to-green-600/20 p-8 rounded-2xl border-2 border-green-500/40">
                    <QrCode className="w-24 h-24 sm:w-32 sm:h-32 text-green-400" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                  Pagar com PIX
                </p>
                <p className="text-base sm:text-lg text-gray-300">
                  Clique no botão abaixo para iniciar o pagamento via PIX na maquininha
                </p>
              </div>

              <div className="space-y-2 p-5 bg-gradient-to-r from-green-500/10 via-green-400/10 to-green-500/10 rounded-xl border-2 border-green-500/30">
                <p className="text-lg text-gray-400 font-medium">Valor total</p>
                <p className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-green-300 to-green-400">
                  R$ {total?.toFixed(2)}
                </p>
              </div>

              <Button
                onClick={handleStartPix}
                size="lg"
                className="w-full h-16 sm:h-20 text-xl sm:text-2xl font-bold bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white rounded-xl shadow-lg"
              >
                <QrCode className="w-6 h-6 sm:w-8 sm:h-8 mr-3" />
                Pagar com PIX
              </Button>

              <Button
                onClick={() => navigate('/totem/checkout', { state: location.state })}
                variant="outline"
                size="lg"
                className="border-urbana-gold/50 text-urbana-gold hover:bg-urbana-gold/10"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Voltar ao Checkout
              </Button>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default TotemPaymentPix;
