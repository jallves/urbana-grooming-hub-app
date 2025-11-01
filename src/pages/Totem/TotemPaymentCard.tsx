import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, CreditCard, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const TotemPaymentCard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { venda_id, session_id, appointment, total } = location.state || {};
  
  const [processing, setProcessing] = useState(false);
  const [paymentType, setPaymentType] = useState<'credit' | 'debit' | null>(null);

  const handlePaymentType = async (type: 'credit' | 'debit') => {
    setPaymentType(type);
    setProcessing(true);

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
        description: 'Aproxime, insira ou passe seu cartão na maquininha',
        duration: 5000
      });

      // Simular processamento de 5 segundos
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Simular sucesso (90% de chance)
      const success = Math.random() > 0.1;

      if (!success) {
        console.error('❌ Pagamento negado pela maquininha');
        await supabase
          .from('totem_payments')
          .update({ status: 'failed' })
          .eq('id', payment.id);

        toast.error('Pagamento negado', {
          description: 'O pagamento foi recusado. Tente outro cartão ou forma de pagamento.',
          duration: 4000
        });
        setProcessing(false);
        setPaymentType(null);
        return;
      }

      console.log('✅ Pagamento aprovado! Finalizando checkout...');

      // Atualizar pagamento
      const { error: updateError } = await supabase
        .from('totem_payments')
        .update({ 
          status: 'completed',
          paid_at: new Date().toISOString()
        })
        .eq('id', payment.id);

      if (updateError) {
        console.error('❌ Erro ao atualizar pagamento:', updateError);
        toast.error('Erro ao confirmar', {
          description: 'Pagamento aprovado mas houve erro ao confirmar. Procure a recepção.'
        });
        throw updateError;
      }

      // Chamar edge function para finalizar checkout
      const { data: finishData, error: finishError } = await supabase.functions.invoke('totem-checkout', {
        body: {
          action: 'finish',
          venda_id,
          session_id,
          payment_id: payment.id
        }
      });

      if (finishError) {
        console.error('❌ Erro ao finalizar checkout:', finishError);
        toast.error('Erro ao finalizar', {
          description: finishError.message || 'Pagamento aprovado mas houve erro ao finalizar. Procure a recepção.'
        });
        throw finishError;
      }

      console.log('✅ Checkout finalizado com sucesso!', finishData);

      toast.success('Pagamento aprovado!', {
        duration: 3000
      });
      
      navigate('/totem/payment-success', {
        state: { appointment, total, paymentMethod: type }
      });
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

  return (
    <div className="fixed inset-0 w-screen h-screen bg-gradient-to-br from-urbana-black via-urbana-brown/10 to-urbana-black flex flex-col p-4 sm:p-6 md:p-8 font-poppins overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-urbana-gold/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-urbana-gold/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6 sm:mb-8 z-10">
        <Button
          onClick={() => navigate('/totem/checkout', { state: { appointment, client: location.state?.client, session: location.state?.session } })}
          variant="ghost"
          size="lg"
          className="h-12 sm:h-14 md:h-16 px-4 sm:px-6 md:px-8 text-base sm:text-lg md:text-xl text-urbana-light hover:text-urbana-gold hover:bg-urbana-gold/10"
          disabled={processing}
        >
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 mr-2 sm:mr-3" />
          <span className="hidden sm:inline">Voltar</span>
        </Button>
        <div className="text-center flex-1">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-urbana-gold via-urbana-gold-light to-urbana-gold">
            Pagamento com Cartão
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-urbana-gray-light mt-1">Escolha o tipo de cartão</p>
        </div>
        <div className="w-20 sm:w-32 md:w-48"></div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center z-10">
        <Card className="w-full max-w-3xl p-6 sm:p-8 md:p-12 space-y-6 sm:space-y-8 bg-gradient-to-br from-card/90 to-card/50 backdrop-blur-xl border-2 border-urbana-gold/30 shadow-2xl shadow-urbana-gold/20">
          
          {/* Amount Display */}
          <div className="text-center space-y-3 sm:space-y-4 p-4 sm:p-6 bg-gradient-to-r from-urbana-gold/10 to-urbana-gold-dark/10 rounded-2xl border-2 border-urbana-gold/30">
            <p className="text-lg sm:text-xl md:text-2xl text-urbana-gray-light">Valor a pagar</p>
            <p className="text-4xl sm:text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-urbana-gold via-urbana-gold-light to-urbana-gold">
              R$ {total?.toFixed(2)}
            </p>
          </div>

          {!processing ? (
            <>
              {/* Card Type Selection */}
              <div className="space-y-4 sm:space-y-6">
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-urbana-light text-center">
                  Selecione o tipo de cartão
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  {/* Credit Card */}
                  <button
                    onClick={() => handlePaymentType('credit')}
                    className="group relative h-36 sm:h-40 md:h-44 bg-gradient-to-br from-urbana-gold/20 to-urbana-gold-dark/20 hover:from-urbana-gold/30 hover:to-urbana-gold-dark/30 border-2 border-urbana-gold/50 hover:border-urbana-gold rounded-2xl transition-all duration-300 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-urbana-gold/0 to-urbana-gold/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative h-full flex flex-col items-center justify-center gap-3 sm:gap-4">
                      <div className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-2xl bg-urbana-gold/20 group-hover:bg-urbana-gold/30 flex items-center justify-center transition-all duration-300 group-hover:scale-110">
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
                    className="group relative h-36 sm:h-40 md:h-44 bg-gradient-to-br from-urbana-gold/20 to-urbana-gold-dark/20 hover:from-urbana-gold/30 hover:to-urbana-gold-dark/30 border-2 border-urbana-gold/50 hover:border-urbana-gold rounded-2xl transition-all duration-300 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-urbana-gold/0 to-urbana-gold/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative h-full flex flex-col items-center justify-center gap-3 sm:gap-4">
                      <div className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-2xl bg-urbana-gold/20 group-hover:bg-urbana-gold/30 flex items-center justify-center transition-all duration-300 group-hover:scale-110">
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
