import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, CreditCard, Loader2, CheckCircle2, AlertTriangle, WifiOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTEFAndroid } from '@/hooks/useTEFAndroid';
import barbershopBg from '@/assets/barbershop-background.jpg';

const TotemPaymentCard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { venda_id, session_id, appointment, client, total, selectedProducts = [], isDirect = false } = location.state || {};
  
  const [processing, setProcessing] = useState(false);
  const [paymentType, setPaymentType] = useState<'credit' | 'debit' | null>(null);
  const [currentPaymentId, setCurrentPaymentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Hook TEF Android
  const {
    isAndroidAvailable,
    isPinpadConnected,
    isProcessing: tefProcessing,
    iniciarPagamento: iniciarPagamentoTEF,
    cancelarPagamento: cancelarPagamentoTEF
  } = useTEFAndroid({
    onSuccess: async (resultado) => {
      console.log('✅ [TEF] Pagamento aprovado:', resultado);
      if (currentPaymentId) {
        await finalizePayment(currentPaymentId, {
          nsu: resultado.nsu,
          autorizacao: resultado.autorizacao,
          bandeira: resultado.bandeira
        });
      }
    },
    onError: (erro) => {
      console.error('❌ [TEF] Erro no pagamento:', erro);
      toast.error('Pagamento negado', { description: erro });
      setError(erro);
      setProcessing(false);
      setPaymentType(null);
    },
    onCancelled: () => {
      console.log('⚠️ [TEF] Pagamento cancelado');
      toast.info('Pagamento cancelado');
      setProcessing(false);
      setPaymentType(null);
    }
  });

  // Log status do TEF ao montar
  useEffect(() => {
    console.log('🔌 [CARD] Status TEF Android:', {
      isAndroidAvailable,
      isPinpadConnected,
      tefProcessing
    });
  }, [isAndroidAvailable, isPinpadConnected, tefProcessing]);

  const handlePaymentType = async (type: 'credit' | 'debit') => {
    // Verificar se TEF está disponível
    if (!isAndroidAvailable || !isPinpadConnected) {
      toast.error('Pinpad não conectado', {
        description: 'Verifique a conexão com a maquininha'
      });
      return;
    }

    console.log('💳 [CARD] Iniciando pagamento com cartão:', type);
    console.log('   💰 Venda ID:', venda_id);
    console.log('   💵 Total:', total);
    
    setPaymentType(type);
    setProcessing(true);
    setError(null);

    try {
      // Criar registro de pagamento
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

      if (paymentError) {
        console.error('❌ [CARD] Erro ao criar registro de pagamento:', paymentError);
        throw paymentError;
      }

      console.log('✅ [CARD] Registro de pagamento criado:', payment.id);
      setCurrentPaymentId(payment.id);

      // Chamar TEF Android (PayGo)
      console.log('🔌 [CARD] Chamando TEF PayGo...');
      const success = await iniciarPagamentoTEF({
        ordemId: payment.id,
        valor: total,
        tipo: type,
        parcelas: 1
      });

      if (!success) {
        console.error('❌ [CARD] Falha ao iniciar TEF');
        toast.error('Erro ao iniciar pagamento', {
          description: 'Verifique a conexão com o pinpad'
        });
        setProcessing(false);
        setPaymentType(null);
      }

    } catch (error) {
      console.error('❌ Erro no pagamento:', error);
      toast.error('Erro no pagamento', {
        description: 'Ocorreu um erro ao processar o pagamento.'
      });
      setProcessing(false);
      setPaymentType(null);
    }
  };

  const handleCancelPayment = () => {
    cancelarPagamentoTEF();
    setProcessing(false);
    setPaymentType(null);
    toast.info('Pagamento cancelado');
  };

  const finalizePayment = async (paymentId: string, transactionData: {
    nsu?: string;
    autorizacao?: string;
    bandeira?: string;
  }) => {
    try {
      console.log('✅ [CARD] Finalizando pagamento...');
      console.log('   📝 Transaction Data:', transactionData);
      
      // Atualizar status do pagamento com dados da transação
      const { error: paymentError } = await supabase
        .from('totem_payments')
        .update({
          status: 'completed',
          paid_at: new Date().toISOString(),
          ...(transactionData.nsu && { nsu: transactionData.nsu }),
          ...(transactionData.autorizacao && { authorization_code: transactionData.autorizacao })
        })
        .eq('id', paymentId);

      if (paymentError) {
        console.error('❌ [CARD] Erro ao atualizar pagamento:', paymentError);
        throw paymentError;
      }

      // Finalizar venda
      if (isDirect) {
        console.log('📡 [CARD] Chamando totem-direct-sale...');
        await supabase.functions.invoke('totem-direct-sale', {
          body: {
            action: 'finish',
            venda_id: venda_id,
            payment_id: paymentId
          }
        });
      } else {
        // Atualizar estoque dos produtos
        if (selectedProducts && selectedProducts.length > 0) {
          for (const product of selectedProducts) {
            await supabase.rpc('decrease_product_stock', {
              p_product_id: product.product_id,
              p_quantity: product.quantidade
            });
          }
        }

        // Finalizar checkout de serviço
        await supabase.functions.invoke('totem-checkout', {
          body: {
            action: 'finish',
            venda_id: venda_id,
            session_id: session_id,
            payment_id: paymentId
          }
        });
      }

      toast.success('Pagamento aprovado!');
      navigate('/totem/payment-success', { 
        state: { 
          appointment, 
          client,
          total,
          paymentMethod: paymentType,
          isDirect,
          transactionData
        } 
      });
    } catch (error) {
      console.error('❌ [CARD] Erro ao finalizar:', error);
      toast.error('Erro ao processar pagamento');
      setProcessing(false);
    }
  };

  // Tela de erro quando TEF não está disponível
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
            <h2 className="text-2xl font-bold text-white mb-4">Pinpad Não Conectado</h2>
            <p className="text-gray-300 mb-6">
              A maquininha de cartão não está conectada. Verifique a conexão USB e tente novamente.
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
          <p className="text-xs sm:text-sm md:text-base text-green-400 mt-0.5 flex items-center justify-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Pinpad conectado
          </p>
        </div>
        <div className="w-12 sm:w-16 md:w-24"></div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center z-10 overflow-y-auto py-2">
        <Card className="w-full max-w-xl sm:max-w-2xl md:max-w-3xl p-4 sm:p-6 md:p-8 lg:p-10 space-y-4 sm:space-y-6 bg-black/30 backdrop-blur-xl border-2 border-urbana-gold/30 shadow-[0_8px_32px_rgba(212,175,55,0.3)] rounded-3xl">
          
          {/* Amount Display */}
          <div className="text-center space-y-2 sm:space-y-3 p-4 sm:p-5 bg-gradient-to-r from-urbana-gold/10 via-urbana-gold-vibrant/10 to-urbana-gold/10 rounded-xl border-2 border-urbana-gold/30">
            <p className="text-base sm:text-lg md:text-xl text-urbana-light/70 font-medium">Valor total</p>
            <p className="text-3xl sm:text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-urbana-gold via-urbana-gold-light to-urbana-gold">
              R$ {total?.toFixed(2)}
            </p>
          </div>

          {!processing ? (
            <>
              {/* Card Type Selection */}
              <div className="space-y-5 sm:space-y-6">
                <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-urbana-light via-urbana-gold-light to-urbana-light text-center">
                  Escolha o tipo de cartão
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  {/* Credit Card */}
                  <button
                    onClick={() => handlePaymentType('credit')}
                    className="group relative h-32 sm:h-36 md:h-40 lg:h-44 bg-gradient-to-br from-urbana-gold/20 to-urbana-gold-dark/20 active:from-urbana-gold/30 active:to-urbana-gold-dark/30 border-2 border-urbana-gold/50 active:border-urbana-gold rounded-2xl transition-all duration-100 active:scale-98 overflow-hidden"
                  >
                    <div className="relative h-full flex flex-col items-center justify-center gap-3 sm:gap-4">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18 lg:w-20 lg:h-20 rounded-2xl bg-urbana-gold/20 flex items-center justify-center">
                        <CreditCard className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-urbana-gold" />
                      </div>
                      <div className="text-center">
                        <span className="text-2xl sm:text-3xl md:text-4xl font-black text-urbana-gold block">CRÉDITO</span>
                        <span className="text-xs sm:text-sm text-urbana-gray-light">Parcelamento disponível</span>
                      </div>
                    </div>
                  </button>
                  
                  {/* Debit Card */}
                  <button
                    onClick={() => handlePaymentType('debit')}
                    className="group relative h-32 sm:h-36 md:h-40 lg:h-44 bg-gradient-to-br from-urbana-gold/20 to-urbana-gold-dark/20 active:from-urbana-gold/30 active:to-urbana-gold-dark/30 border-2 border-urbana-gold/50 active:border-urbana-gold rounded-2xl transition-all duration-100 active:scale-98 overflow-hidden"
                  >
                    <div className="relative h-full flex flex-col items-center justify-center gap-3 sm:gap-4">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18 lg:w-20 lg:h-20 rounded-2xl bg-urbana-gold/20 flex items-center justify-center">
                        <CreditCard className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-urbana-gold" />
                      </div>
                      <div className="text-center">
                        <span className="text-2xl sm:text-3xl md:text-4xl font-black text-urbana-gold block">DÉBITO</span>
                        <span className="text-xs sm:text-sm text-urbana-gray-light">Pagamento à vista</span>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Info */}
              <div className="text-center pt-4">
                <p className="text-base sm:text-lg md:text-xl text-urbana-gray-light">
                  Após selecionar, siga as instruções na maquininha
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Processing State */}
              <div className="flex flex-col items-center justify-center py-6 sm:py-8 space-y-4 sm:space-y-6">
                {/* Status TEF */}
                <div className="bg-gradient-to-r from-urbana-gold/20 via-urbana-gold-vibrant/15 to-urbana-gold/20 border-2 border-urbana-gold/40 rounded-xl p-3 sm:p-4 w-full">
                  <div className="flex items-center justify-center gap-2">
                    <div className="relative">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-ping absolute" />
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                    </div>
                    <p className="text-sm sm:text-base md:text-lg font-bold text-urbana-gold">
                      Aguardando pagamento no pinpad...
                    </p>
                  </div>
                </div>

                <div className="relative">
                  <Loader2 className="w-16 h-16 sm:w-20 sm:h-20 text-urbana-gold animate-spin" />
                  <div className="absolute inset-0 w-16 h-16 sm:w-20 sm:h-20 bg-urbana-gold/20 rounded-full blur-xl animate-pulse" />
                </div>
                
                <div className="text-center space-y-2 sm:space-y-3">
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-urbana-light">
                    Processando pagamento...
                  </p>
                  <div className="inline-block px-4 py-2 bg-urbana-gold/10 rounded-lg border border-urbana-gold/30">
                    <p className="text-base sm:text-lg md:text-xl text-urbana-gold font-bold">
                      {paymentType === 'credit' ? 'Cartão de Crédito' : 'Cartão de Débito'}
                    </p>
                  </div>
                  <p className="text-sm sm:text-base md:text-lg text-urbana-gray-light animate-pulse mt-2">
                    Siga as instruções na maquininha
                  </p>
                </div>

                {/* Cancel Button */}
                <Button
                  onClick={handleCancelPayment}
                  variant="outline"
                  className="mt-4 border-red-500/50 text-red-400 hover:bg-red-500/10"
                >
                  Cancelar pagamento
                </Button>

                {/* Progress Steps */}
                <div className="flex items-center gap-2 sm:gap-3 mt-4">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                    <span className="text-xs sm:text-sm text-urbana-light">Conectado</span>
                  </div>
                  <div className="w-6 sm:w-8 h-0.5 bg-urbana-gold/30" />
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-urbana-gold rounded-full animate-pulse" />
                    <span className="text-xs sm:text-sm text-urbana-light">Aguardando</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default TotemPaymentCard;
