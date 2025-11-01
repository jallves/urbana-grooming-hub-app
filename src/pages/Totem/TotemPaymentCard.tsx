import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, CreditCard, Loader2 } from 'lucide-react';
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
        description: 'Aproxime, insira ou passe seu cartão na maquininha'
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
          description: 'O pagamento foi recusado. Tente outro cartão ou forma de pagamento.'
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

      toast.success('Pagamento aprovado!');
      navigate('/totem/payment-success', {
        state: { appointment, total, paymentMethod: type }
      });
    } catch (error) {
      console.error('❌ Erro no pagamento:', error);
      toast.error('Erro no pagamento', {
        description: 'Ocorreu um erro ao processar o pagamento. Procure a recepção.'
      });
      setProcessing(false);
      setPaymentType(null);
      // Aguardar um pouco e voltar para o checkout
      setTimeout(() => {
        navigate('/totem/checkout', { state: { appointment } });
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Button
          onClick={() => navigate('/totem/checkout', { state: { appointment } })}
          variant="outline"
          size="lg"
          className="h-20 px-8 text-2xl"
          disabled={processing}
        >
          <ArrowLeft className="w-8 h-8 mr-4" />
          Voltar
        </Button>
        <h1 className="text-5xl font-bold text-foreground">Pagamento com Cartão</h1>
        <div className="w-48"></div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center">
        <Card className="w-full max-w-3xl p-12 space-y-8 bg-card text-center">
          {/* Amount */}
          <div className="space-y-4 pb-8 border-b border-border">
            <p className="text-3xl text-muted-foreground">Valor a pagar</p>
            <p className="text-6xl font-black text-urbana-gold">
              R$ {total?.toFixed(2)}
            </p>
          </div>

          {!processing ? (
            <>
              {/* Card Type Selection */}
              <div className="space-y-4">
                <h3 className="text-3xl font-bold text-foreground mb-6">
                  Selecione o tipo de cartão
                </h3>
                
                <div className="grid grid-cols-2 gap-4 sm:gap-5 md:gap-6">
                  <Button
                    onClick={() => handlePaymentType('credit')}
                    variant="default"
                    className="h-28 sm:h-30 md:h-32 text-2xl sm:text-2xl md:text-3xl font-bold"
                  >
                    <CreditCard className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 mr-3 sm:mr-3 md:mr-4" />
                    Crédito
                  </Button>
                  
                  <Button
                    onClick={() => handlePaymentType('debit')}
                    variant="secondary"
                    className="h-28 sm:h-30 md:h-32 text-2xl sm:text-2xl md:text-3xl font-bold"
                  >
                    <CreditCard className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 mr-3 sm:mr-3 md:mr-4" />
                    Débito
                  </Button>
                </div>
              </div>

              {/* Info */}
              <p className="text-2xl text-muted-foreground pt-8">
                Após selecionar, siga as instruções na maquininha
              </p>
            </>
          ) : (
            <>
              {/* Processing */}
              <div className="flex flex-col items-center justify-center py-12 space-y-8">
                <Loader2 className="w-24 h-24 text-urbana-gold animate-spin" />
                <p className="text-4xl font-bold text-foreground">
                  Processando pagamento...
                </p>
                <p className="text-3xl text-muted-foreground">
                  {paymentType === 'credit' ? 'Cartão de Crédito' : 'Cartão de Débito'}
                </p>
                <p className="text-2xl text-muted-foreground animate-pulse">
                  Siga as instruções na maquininha
                </p>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default TotemPaymentCard;
