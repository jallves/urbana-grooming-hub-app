import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, CheckCircle2, Loader2, WifiOff, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { TotemErrorFeedback } from '@/components/totem/TotemErrorFeedback';
import { useTEFAndroid } from '@/hooks/useTEFAndroid';
import { useTEFPaymentResult } from '@/hooks/useTEFPaymentResult';
import { TEFResultado } from '@/lib/tef/tefAndroidBridge';
import barbershopBg from '@/assets/barbershop-background.jpg';

const TotemProductPaymentPix: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { sale: saleFromState, client, barber, cart } = location.state || {};
  
  // Garantir que sale tenha campo total para compatibilidade
  const sale = saleFromState ? { 
    ...saleFromState, 
    total: saleFromState.total || saleFromState.valor_total || 0 
  } : null;
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStarted, setPaymentStarted] = useState(false);
  const [error, setError] = useState<{ title: string; message: string } | null>(null);
  const [isCheckingConnection, setIsCheckingConnection] = useState(true);
  
  const finalizingRef = useRef(false);

  // Função de sucesso
  const handlePaymentSuccess = useCallback(async (transactionData?: {
    nsu?: string;
    autorizacao?: string;
  }) => {
    if (!sale || !barber) return;
    
    if (finalizingRef.current) {
      console.log('[PRODUCT-PIX] ⚠️ Finalização já em andamento');
      return;
    }
    finalizingRef.current = true;
    
    try {
      console.log('✅ [PRODUCT-PIX] ═══════════════════════════════════════');
      console.log('✅ [PRODUCT-PIX] FINALIZANDO PAGAMENTO PIX DE PRODUTO');
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

      // 2. Preparar itens para o ERP
      const erpItems = saleItems?.map(item => ({
        type: 'product' as const,
        id: item.item_id,
        name: item.nome,
        quantity: item.quantidade,
        price: Number(item.preco_unitario),
        discount: 0
      })) || [];

      console.log('📊 [PRODUCT-PIX] Enviando para ERP:', {
        client_id: sale.cliente_id,
        barber_id: barber.id, // ID da tabela painel_barbeiros
        reference_id: sale.id,
        items: erpItems.length,
        payment_method: 'pix',
        nsu: transactionData?.nsu
      });

      // 3. Chamar edge function
      const { error: erpError } = await supabase.functions.invoke(
        'create-financial-transaction',
        {
          body: {
            client_id: sale.cliente_id,
            barber_id: barber.id, // ID da tabela painel_barbeiros (NÃO staff_id)
            items: erpItems,
            payment_method: 'pix',
            discount_amount: Number(sale.desconto) || 0,
            notes: `Venda de Produtos - Totem PIX`,
            reference_id: sale.id, // ID da venda para idempotência
            reference_type: 'totem_product_sale',
            transaction_id: transactionData?.nsu || null // NSU da transação PayGo
          }
        }
      );

      if (erpError) {
        console.error('❌ Erro ao integrar com ERP:', erpError);
      }

      // 4. Atualizar venda para PAGA
      await supabase
        .from('vendas')
        .update({ status: 'PAGA', updated_at: new Date().toISOString() })
        .eq('id', sale.id);
      
      toast.success('Pagamento PIX aprovado!');
      
      const saleWithItems = { ...sale, items: saleItems };
      
      navigate('/totem/product-payment-success', { 
        state: { sale: saleWithItems, client, transactionData: { ...transactionData, paymentMethod: 'pix' } } 
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
    console.log('📞 [PRODUCT-PIX] handleTEFResult:', resultado.status);
    
    switch (resultado.status) {
      case 'aprovado':
        handlePaymentSuccess({
          nsu: resultado.nsu,
          autorizacao: resultado.autorizacao
        });
        break;
        
      case 'negado':
        toast.error('Pagamento PIX negado', { description: resultado.mensagem || 'Tente novamente' });
        setError({ title: 'Pagamento Negado', message: resultado.mensagem || 'Tente novamente' });
        setIsProcessing(false);
        setPaymentStarted(false);
        break;
        
      case 'cancelado':
        toast.info('Pagamento cancelado');
        setIsProcessing(false);
        setPaymentStarted(false);
        break;
        
      case 'erro':
        toast.error('Erro no pagamento PIX', { description: resultado.mensagem });
        setError({ title: 'Erro no Pagamento', message: resultado.mensagem || 'Erro desconhecido' });
        setIsProcessing(false);
        setPaymentStarted(false);
        break;
    }
  }, [handlePaymentSuccess]);

  // Hook para receber resultado do PayGo
  useTEFPaymentResult({
    enabled: paymentStarted && isProcessing,
    onResult: handleTEFResult,
    pollingInterval: 500,
    maxWaitTime: 180000
  });

  // Hook TEF Android
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

  // Log status do TEF
  useEffect(() => {
    console.log('🔌 [PRODUCT-PIX] Status TEF:', { isAndroidAvailable, isPinpadConnected, isCheckingConnection });
  }, [isAndroidAvailable, isPinpadConnected, isCheckingConnection]);

  // IGUAL AO PIX DE SERVIÇO: Botão para iniciar pagamento
  const handleStartPix = async () => {
    console.log('💚 [PRODUCT-PIX] ═══════════════════════════════════════');
    console.log('💚 [PRODUCT-PIX] INICIANDO PAGAMENTO PIX DE PRODUTO VIA PAYGO');
    console.log('💚 [PRODUCT-PIX] Valor:', sale?.total);
    console.log('💚 [PRODUCT-PIX] ═══════════════════════════════════════');

    if (!sale) {
      toast.error('Dados da venda não encontrados');
      return;
    }

    if (isProcessing || paymentStarted) return;

    setError(null);
    finalizingRef.current = false;

    // Checar diretamente o objeto injetado pelo WebView - IGUAL AO SERVIÇO
    const hasNativeBridge = typeof window !== 'undefined' && typeof (window as any).TEF !== 'undefined';

    if (!hasNativeBridge) {
      toast.error('PayGo indisponível', {
        description: 'O WebView não detectou a bridge TEF (window.TEF). Verifique se está no APK do Totem.'
      });
      return;
    }

    // Revalidar pinpad antes de iniciar - IGUAL AO SERVIÇO
    const status = verificarConexao();
    const connected = !!status?.conectado;

    if (!connected) {
      toast.error('Pinpad não conectado', {
        description: 'Verifique a conexão da maquininha e tente novamente.'
      });
      return;
    }

    setIsProcessing(true);
    setPaymentStarted(true);

    try {
      const ordemId = sale.id || `PIX_PRODUCT_${Date.now()}`;

      // CHAMAR PAYGO COM TIPO PIX
      const success = await iniciarPagamentoTEF({
        ordemId,
        valor: sale.total,
        tipo: 'pix',
        parcelas: 1
      });

      if (!success) {
        toast.error('Erro ao iniciar pagamento PIX', {
          description: 'A bridge TEF retornou falha ao iniciar a transação.'
        });
        setIsProcessing(false);
        setPaymentStarted(false);
      } else {
        console.log('✅ [PRODUCT-PIX] PayGo iniciado - aguardando seleção de carteira digital');
      }
    } catch (error) {
      console.error('❌ [PRODUCT-PIX] Erro:', error);
      toast.error('Erro ao processar pagamento');
      setIsProcessing(false);
      setPaymentStarted(false);
    }
  };

  // Verificar dados ao montar
  useEffect(() => {
    if (!sale || !client || !barber) {
      toast.error('Dados incompletos');
      navigate('/totem/home');
    }
  }, [sale, client, barber, navigate]);

  const handleCancel = () => {
    cancelarPagamentoTEF();
    setIsProcessing(false);
    setPaymentStarted(false);
    navigate('/totem/product-checkout', { state: { client, cart, barber } });
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
          handleStartPix();
        }}
        onGoHome={() => navigate('/totem')}
      />
    );
  }

  // Tela quando TEF não está disponível (apenas após delay)
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
              <Button onClick={() => window.location.reload()} className="w-full bg-urbana-gold hover:bg-urbana-gold-dark">
                Tentar Novamente
              </Button>
              <Button onClick={handleCancel} variant="outline" className="w-full border-gray-500 text-gray-300">
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
      <div className="absolute inset-0 z-0">
        <img src={barbershopBg} alt="Barbearia" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-urbana-black/95 via-urbana-black/90 to-urbana-brown/85" />
      </div>

      <div className="absolute inset-0 overflow-hidden z-0">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-green-400/10 rounded-full blur-3xl animate-pulse" />
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
          <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-green-300 to-green-400">
            Pagamento PIX
          </h1>
        </div>
        <div className="w-24"></div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center z-10">
        <Card className="relative w-full max-w-2xl p-8 space-y-6 bg-urbana-black/60 backdrop-blur-2xl border-2 border-green-500/40 shadow-2xl text-center">
          
          {!isProcessing ? (
            // TELA INICIAL: Botão para iniciar pagamento - IGUAL AO SERVIÇO
            <>
              <div className="flex justify-center">
                <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                  <QrCode className="w-16 h-16 text-white" />
                </div>
              </div>
              
              <div>
                <h2 className="text-3xl font-bold text-green-400 mb-2">R$ {sale.total?.toFixed(2)}</h2>
                <p className="text-gray-400">Pagamento instantâneo via PIX</p>
              </div>
              
              <Button
                onClick={handleStartPix}
                size="lg"
                className="w-full h-16 text-xl font-bold bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
              >
                <QrCode className="w-6 h-6 mr-3" />
                Iniciar Pagamento PIX
              </Button>
              
              <p className="text-sm text-gray-400">
                Clique para gerar o QR Code na maquininha
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
                  <p className="font-bold">PayGo Conectado - Aguardando PIX</p>
                </div>
              </div>

              <div className="flex justify-center">
                <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-green-500/30 to-green-600/30 flex items-center justify-center animate-pulse">
                  <QrCode className="w-16 h-16 text-green-400" />
                </div>
              </div>
              
              <div>
                <h2 className="text-3xl font-bold text-green-400 mb-2">R$ {sale.total?.toFixed(2)}</h2>
                <p className="text-gray-300 text-lg">PIX</p>
              </div>
              
              <div className="flex items-center justify-center gap-3 text-green-400">
                <Loader2 className="w-6 h-6 animate-spin" />
                <p className="text-lg font-medium">Escaneie o QR Code na maquininha...</p>
              </div>
              
              <Button
                onClick={handleCancel}
                variant="outline"
                size="lg"
                className="w-full h-14 border-red-500/50 text-red-400 hover:bg-red-500/10"
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

export default TotemProductPaymentPix;
