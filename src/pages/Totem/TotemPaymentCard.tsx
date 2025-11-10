import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, CreditCard, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { TotemErrorFeedback } from '@/components/totem/TotemErrorFeedback';
import barbershopBg from '@/assets/barbershop-background.jpg';

const TotemPaymentCard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { venda_id, session_id, appointment, client, total, selectedProducts = [], isDirect = false, payment_id } = location.state || {};
  
  const [processing, setProcessing] = useState(false);
  const [paymentType, setPaymentType] = useState<'credit' | 'debit' | null>(null);
  const [simulationTimer, setSimulationTimer] = useState(10); // Timer de simulação (10 segundos)
  const [error, setError] = useState<{ title: string; message: string } | null>(null);

  const handlePaymentType = async (type: 'credit' | 'debit') => {
    setPaymentType(type);
    setProcessing(true);
    setSimulationTimer(10); // Reset timer

    try {
      console.log(`🔄 Processando pagamento ${type === 'credit' ? 'crédito' : 'débito'}...`);

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
        console.error('❌ Erro ao criar registro de pagamento:', paymentError);
        toast.error('Erro ao processar', {
          description: 'Não foi possível iniciar o pagamento. Tente novamente.'
        });
        throw paymentError;
      }

      console.log('✅ Registro de pagamento criado:', payment.id);

      // Integrar com API da maquininha (Stone, Cielo, etc)
      toast.info('Aguarde...', {
        description: 'Simulando processamento do pagamento...',
        duration: 5000
      });

      // Iniciar timer de simulação
      const interval = setInterval(() => {
        setSimulationTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            console.log('🤖 Simulação: Aprovando pagamento automaticamente...');
            toast.info('Simulação', {
              description: `Pagamento no ${type === 'credit' ? 'crédito' : 'débito'} aprovado automaticamente`
            });
            finalizePayment(payment.id);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    } catch (error) {
      console.error('❌ Erro no pagamento:', error);
      toast.error('Erro no pagamento', {
        description: 'Ocorreu um erro ao processar o pagamento.'
      });
      setProcessing(false);
      setPaymentType(null);
      
      setTimeout(() => {
        navigate('/totem/home');
      }, 3000);
    }
  };

  const finalizePayment = async (paymentId: string) => {
    try {
      console.log('✅ Pagamento no cartão aprovado! Finalizando venda...');
      
      // Atualizar status do pagamento
      const { error: paymentError } = await supabase
        .from('totem_payments')
        .update({
          status: 'completed',
          paid_at: new Date().toISOString()
        })
        .eq('id', paymentId);

      if (paymentError) throw paymentError;

      // Se é venda direta, usar edge function específica
      if (isDirect) {
        const { error: finishError } = await supabase.functions.invoke('totem-direct-sale', {
          body: {
            action: 'finish',
            venda_id: venda_id,
            payment_id: paymentId
          }
        });
        if (finishError) console.error('Erro ao finalizar venda direta:', finishError);
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
        const { error: finishError } = await supabase.functions.invoke('totem-checkout', {
          body: {
            action: 'finish',
            venda_id: venda_id,
            session_id: session_id,
            payment_id: paymentId
          }
        });
        if (finishError) console.error('Erro ao finalizar checkout:', finishError);
      }

      toast.success('Pagamento aprovado!');
      navigate('/totem/payment-success', { 
        state: { 
          appointment, 
          client,
          total,
          isDirect
        } 
      });
    } catch (error) {
      console.error('Erro ao finalizar pagamento:', error);
      toast.error('Erro ao processar pagamento');
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 w-screen h-screen flex flex-col p-3 sm:p-4 md:p-6 font-poppins overflow-hidden relative">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img 
          src={barbershopBg} 
          alt="Barbearia" 
          className="w-full h-full object-cover"
        />
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
          onClick={() => navigate('/totem/checkout', { state: { appointment, client: location.state?.client, session: location.state?.session } })}
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
          <p className="text-xs sm:text-sm md:text-base text-urbana-gray-light mt-0.5">Escolha o tipo de cartão</p>
        </div>
        <div className="w-12 sm:w-16 md:w-24"></div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center z-10 overflow-y-auto py-2">
        <Card className="w-full max-w-3xl p-5 sm:p-6 md:p-8 lg:p-10 space-y-5 sm:space-y-6 md:space-y-8 bg-urbana-black-soft/40 backdrop-blur-xl border-2 border-urbana-gold/30 shadow-2xl shadow-urbana-gold/20">
          
          {/* Amount Display */}
          <div className="text-center space-y-3 sm:space-y-4 p-5 sm:p-6 md:p-8 bg-gradient-to-r from-urbana-gold/15 via-urbana-gold-vibrant/10 to-urbana-gold/15 rounded-2xl border-2 border-urbana-gold/40 shadow-lg shadow-urbana-gold/20">
            <p className="text-lg sm:text-xl md:text-2xl text-urbana-light/70 font-medium">Valor total</p>
            <p className="text-5xl sm:text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-urbana-gold via-urbana-gold-light to-urbana-gold">
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
                      <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18 lg:w-20 lg:h-20 rounded-2xl bg-urbana-gold/20 flex items-center justify-center transition-all duration-100">
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
                      <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18 lg:w-20 lg:h-20 rounded-2xl bg-urbana-gold/20 flex items-center justify-center transition-all duration-100">
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
              <div className="flex flex-col items-center justify-center py-8 sm:py-12 space-y-6 sm:space-y-8">
                {/* Indicador de Simulação */}
                <div className="bg-gradient-to-r from-urbana-gold/20 via-urbana-gold-vibrant/15 to-urbana-gold/20 border-2 border-urbana-gold/40 rounded-2xl p-4 sm:p-5 animate-pulse w-full max-w-md shadow-lg shadow-urbana-gold/20">
                  <div className="flex items-center justify-center gap-2 sm:gap-3">
                    <div className="relative">
                      <div className="w-3 h-3 bg-urbana-gold rounded-full animate-ping absolute" />
                      <div className="w-3 h-3 bg-urbana-gold rounded-full" />
                    </div>
                    <p className="text-base sm:text-lg md:text-xl font-black text-urbana-gold">
                      🤖 MODO TESTE: Aprovação em {simulationTimer}s
                    </p>
                  </div>
                </div>

                <div className="relative">
                  <Loader2 className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 text-urbana-gold animate-spin" />
                  <div className="absolute inset-0 w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 bg-urbana-gold/20 rounded-full blur-xl animate-pulse" />
                </div>
                
                <div className="text-center space-y-3 sm:space-y-4">
                  <p className="text-2xl sm:text-3xl md:text-4xl font-black text-urbana-light">
                    Processando pagamento...
                  </p>
                  <div className="inline-block px-6 py-3 bg-urbana-gold/10 rounded-xl border border-urbana-gold/30">
                    <p className="text-xl sm:text-2xl md:text-3xl text-urbana-gold font-bold">
                      {paymentType === 'credit' ? 'Cartão de Crédito' : 'Cartão de Débito'}
                    </p>
                  </div>
                  <p className="text-lg sm:text-xl md:text-2xl text-urbana-gray-light animate-pulse mt-4">
                    Siga as instruções na maquininha
                  </p>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center gap-3 sm:gap-4 mt-8">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-urbana-gold" />
                    <span className="text-sm sm:text-base text-urbana-light">Conectado</span>
                  </div>
                  <div className="w-8 sm:w-12 h-0.5 bg-urbana-gold/30" />
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-urbana-gold rounded-full animate-pulse" />
                    <span className="text-sm sm:text-base text-urbana-light">Aguardando</span>
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
