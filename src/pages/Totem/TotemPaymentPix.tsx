import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, CheckCircle, Clock } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const TotemPaymentPix: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { venda_id, session_id, appointment, total } = location.state || {};
  
  const [pixCode, setPixCode] = useState('');
  const [pixKey] = useState('suachavepix@email.com'); // CONFIGURAR CHAVE PIX DA BARBEARIA
  const [paymentId, setPaymentId] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutos

  useEffect(() => {
    if (!venda_id || !session_id || !total) {
      navigate('/totem');
      return;
    }

    generatePixCode();
    startPaymentCheck();
    startTimer();
  }, []);

  const generatePixCode = async () => {
    try {
      // Gerar código PIX (simplificado - integrar com API real depois)
      const transactionId = `TOTEM${Date.now()}`;
      const pixPayload = `00020126580014BR.GOV.BCB.PIX0136${pixKey}52040000530398654${total.toFixed(2)}5802BR5925BARBEARIA COSTA URBANA6014BELO HORIZONTE62070503***6304${transactionId}`;
      
      setPixCode(pixPayload);

      // Criar registro de pagamento
      const { data: payment, error } = await supabase
        .from('totem_payments')
        .insert({
          session_id: session_id,
          payment_method: 'pix',
          amount: total,
          status: 'pending',
          pix_qr_code: pixPayload,
          pix_key: pixKey,
          transaction_id: transactionId
        })
        .select()
        .single();

      if (error) throw error;
      setPaymentId(payment.id);
    } catch (error) {
      console.error('Erro ao gerar PIX:', error);
      toast.error('Erro ao gerar código PIX');
    }
  };

  const startPaymentCheck = () => {
    // Verificar pagamento a cada 3 segundos
    const interval = setInterval(async () => {
      if (!paymentId) return;

      const { data: payment } = await supabase
        .from('totem_payments')
        .select('status')
        .eq('id', paymentId)
        .single();

      if (payment?.status === 'completed') {
        clearInterval(interval);
        handlePaymentSuccess();
      }
    }, 3000);

    // Limpar interval após 5 minutos
    setTimeout(() => clearInterval(interval), 300000);
  };

  const startTimer = () => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handlePaymentSuccess = async () => {
    try {
      console.log('✅ Pagamento PIX confirmado! Finalizando checkout...');
      
      // Mostrar saudação de sucesso
      toast.success(`Pagamento confirmado, ${appointment?.cliente?.nome || 'Cliente'}! 🎉`, {
        description: 'Seu atendimento foi finalizado com sucesso. Obrigado pela preferência!',
        duration: 5000
      });
      
      // Atualizar status do pagamento
      const { error: updateError } = await supabase
        .from('totem_payments')
        .update({ status: 'completed', paid_at: new Date().toISOString() })
        .eq('id', paymentId);

      if (updateError) {
        console.error('❌ Erro ao atualizar pagamento:', updateError);
        toast.error('Erro ao confirmar pagamento', {
          description: 'Não foi possível atualizar o status. Procure a recepção.'
        });
        throw updateError;
      }

      // Chamar edge function para finalizar checkout
      const { data, error } = await supabase.functions.invoke('totem-checkout', {
        body: {
          action: 'finish',
          venda_id,
          session_id,
          payment_id: paymentId
        }
      });

      if (error) {
        console.error('❌ Erro ao finalizar checkout:', error);
        toast.error('Erro ao finalizar', {
          description: error.message || 'Não foi possível finalizar o atendimento. Procure a recepção.'
        });
        throw error;
      }

      console.log('✅ Checkout finalizado com sucesso!', data);

      // Navegar para tela de sucesso
      navigate('/totem/payment-success', {
        state: {
          appointment,
          total,
          paymentMethod: 'pix'
        }
      });
    } catch (error) {
      console.error('❌ Erro ao processar sucesso do pagamento:', error);
      toast.error('Atenção', {
        description: 'Houve um problema ao finalizar. Por favor, confirme com a recepção.'
      });
      setTimeout(() => navigate('/totem/home'), 3000);
    }
  };

  const handleTimeout = () => {
    console.log('⏱️ Tempo de pagamento PIX expirado');
    toast.error('Tempo esgotado', {
      description: 'O tempo para pagamento expirou. Tente novamente.'
    });
    navigate('/totem/checkout', { state: { appointment } });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 w-screen h-screen bg-gradient-to-br from-urbana-black via-urbana-brown/10 to-urbana-black flex flex-col p-3 sm:p-4 md:p-6 lg:p-8 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 md:mb-8 gap-3 sm:gap-4">
        <Button
          onClick={() => navigate('/totem/checkout', { state: { appointment } })}
          variant="outline"
          size="lg"
          className="h-10 sm:h-12 md:h-14 lg:h-16 px-4 sm:px-6 md:px-8 text-sm sm:text-base md:text-lg lg:text-xl"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 mr-2 sm:mr-3 md:mr-4" />
          Voltar
        </Button>
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-urbana-light text-center flex-1">Pagamento via PIX</h1>
        <div className="w-0 sm:w-20 md:w-32 lg:w-48"></div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center overflow-y-auto">
        <Card className="w-full max-w-xl sm:max-w-2xl md:max-w-3xl p-4 sm:p-6 md:p-8 lg:p-12 space-y-4 sm:space-y-6 md:space-y-8 bg-card/50 backdrop-blur-sm text-center">
          {/* Timer */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 md:gap-4 text-lg sm:text-xl md:text-2xl lg:text-3xl">
            <Clock className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-urbana-gold" />
            <span className="font-bold text-urbana-light">
              Tempo: <span className="text-urbana-gold">{formatTime(timeLeft)}</span>
            </span>
          </div>

          {/* QR Code */}
          <div className="flex justify-center py-4 sm:py-6 md:py-8">
            <div className="bg-white p-3 sm:p-4 md:p-6 lg:p-8 rounded-xl sm:rounded-2xl">
              {pixCode ? (
                <QRCodeSVG value={pixCode} size={window.innerWidth < 640 ? 200 : window.innerWidth < 768 ? 250 : 300} />
              ) : (
                <div className="w-[200px] h-[200px] sm:w-[250px] sm:h-[250px] md:w-[300px] md:h-[300px] flex items-center justify-center">
                  <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-500">Gerando QR Code...</p>
                </div>
              )}
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-2 sm:space-y-3 md:space-y-4">
            <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-urbana-light/60">Valor a pagar</p>
            <p className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-urbana-gold">
              R$ {total?.toFixed(2)}
            </p>
          </div>

          {/* Instructions */}
          <div className="pt-4 sm:pt-6 md:pt-8 space-y-2 sm:space-y-3 md:space-y-4 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-urbana-light/70">
            <p className="flex items-center justify-center gap-2 sm:gap-3">
              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-urbana-gold flex-shrink-0" />
              Abra o app do seu banco
            </p>
            <p className="flex items-center justify-center gap-2 sm:gap-3">
              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-urbana-gold flex-shrink-0" />
              Escolha Pix e escaneie o código
            </p>
            <p className="flex items-center justify-center gap-2 sm:gap-3">
              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-urbana-gold flex-shrink-0" />
              Confirme o pagamento
            </p>
          </div>

          <p className="text-base sm:text-lg md:text-xl text-urbana-light/60 animate-pulse pt-4 sm:pt-6 md:pt-8">
            Aguardando confirmação do pagamento...
          </p>
        </Card>
      </div>
    </div>
  );
};

export default TotemPaymentPix;
