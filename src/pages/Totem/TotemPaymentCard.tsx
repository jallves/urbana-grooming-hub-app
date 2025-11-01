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
  const { sessionId, appointment, total } = location.state || {};
  
  const [processing, setProcessing] = useState(false);
  const [paymentType, setPaymentType] = useState<'credit' | 'debit' | null>(null);

  const handlePaymentType = async (type: 'credit' | 'debit') => {
    setPaymentType(type);
    setProcessing(true);

    try {
      // Criar registro de pagamento
      const { data: payment, error: paymentError } = await supabase
        .from('totem_payments')
        .insert({
          session_id: sessionId,
          payment_method: type,
          amount: total,
          status: 'processing',
          transaction_id: `CARD${Date.now()}`
        })
        .select()
        .single();

      if (paymentError) throw paymentError;

      // AQUI: Integrar com API da maquininha (Stone, Cielo, etc)
      // Por enquanto, simular processamento
      toast.info('Aproxime ou insira o cartão na maquininha');

      // Simular processamento de 5 segundos
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Simular sucesso (90% de chance)
      const success = Math.random() > 0.1;

      if (success) {
        // Atualizar pagamento
        await supabase
          .from('totem_payments')
          .update({ 
            status: 'completed',
            paid_at: new Date().toISOString()
          })
          .eq('id', payment.id);

        // Atualizar sessão
        await supabase
          .from('totem_sessions')
          .update({ 
            status: 'completed',
            check_out_time: new Date().toISOString()
          })
          .eq('id', sessionId);

        // Atualizar agendamento
        await supabase
          .from('painel_agendamentos')
          .update({ status: 'concluido' })
          .eq('id', appointment.id);

        toast.success('Pagamento aprovado!');
        navigate('/totem/payment-success', {
          state: { appointment, total, paymentMethod: type }
        });
      } else {
        // Atualizar como falhou
        await supabase
          .from('totem_payments')
          .update({ status: 'failed' })
          .eq('id', payment.id);

        toast.error('Pagamento recusado. Tente novamente.');
        setProcessing(false);
        setPaymentType(null);
      }
    } catch (error) {
      console.error('Erro no pagamento:', error);
      toast.error('Erro ao processar pagamento');
      setProcessing(false);
      setPaymentType(null);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Button
          onClick={() => navigate('/totem/checkout', { state: { sessionId, appointment } })}
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
                
                <div className="grid grid-cols-2 gap-6">
                  <Button
                    onClick={() => handlePaymentType('credit')}
                    className="h-32 text-3xl font-bold bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <CreditCard className="w-12 h-12 mr-4" />
                    Crédito
                  </Button>
                  
                  <Button
                    onClick={() => handlePaymentType('debit')}
                    className="h-32 text-3xl font-bold bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CreditCard className="w-12 h-12 mr-4" />
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
