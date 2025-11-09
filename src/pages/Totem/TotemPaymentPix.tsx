import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, CheckCircle, Clock } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { TotemErrorFeedback } from '@/components/totem/TotemErrorFeedback';

const TotemPaymentPix: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { venda_id, session_id, appointment, client, total, selectedProducts = [], isDirect = false, payment_id } = location.state || {};
  
  const [pixCode, setPixCode] = useState('');
  const [pixKey] = useState('suachavepix@email.com'); // CONFIGURAR CHAVE PIX DA BARBEARIA
  const [paymentId, setPaymentId] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutos
  const [simulationTimer, setSimulationTimer] = useState(10); // ⏱️ TESTE: 10 segundos
  const [error, setError] = useState<{ title: string; message: string } | null>(null);

  useEffect(() => {
    if (!venda_id || !total) {
      navigate('/totem');
      return;
    }

    // Se já tem payment_id (venda direta), usar ele
    if (payment_id) {
      setPaymentId(payment_id);
    }

    // Iniciar processos
    generatePixCode();
    startTimer();
    
    // ⏱️ Timer de simulação: aprovar pagamento após 10 segundos
    const simulationInterval = setInterval(() => {
      setSimulationTimer((prev) => {
        if (prev <= 1) {
          clearInterval(simulationInterval);
          console.log('🤖 SIMULAÇÃO: Aprovando pagamento PIX automaticamente após 10s');
          toast.info('Modo Teste', {
            description: '✅ Pagamento PIX aprovado automaticamente'
          });
          handlePaymentSuccess();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(simulationInterval);
  }, []);

  const generatePixCode = async () => {
    try {
      // Se já tem payment_id (venda direta), apenas gerar QR code
      if (payment_id) {
        const transactionId = `TOTEM${Date.now()}`;
        const pixPayload = `00020126580014BR.GOV.BCB.PIX0136${pixKey}52040000530398654${total.toFixed(2)}5802BR5925BARBEARIA COSTA URBANA6014BELO HORIZONTE62070503***6304${transactionId}`;
        setPixCode(pixPayload);
        return;
      }

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
      console.log('✅ Pagamento PIX confirmado! Finalizando venda...');

      // Atualizar status do pagamento
      const { error: updateError } = await supabase
        .from('totem_payments')
        .update({ 
          status: 'completed',
          paid_at: new Date().toISOString()
        })
        .eq('id', paymentId);

      if (updateError) throw updateError;

      // Se é venda direta de produtos, chamar edge function específica
      if (isDirect) {
        console.log('📦 Finalizando venda direta de produtos');
        const { error: finishError } = await supabase.functions.invoke('totem-direct-sale', {
          body: {
            action: 'finish',
            venda_id: venda_id,
            payment_id: paymentId
          }
        });

        if (finishError) {
          console.error('Erro ao finalizar venda direta:', finishError);
          toast.error('Erro ao finalizar', {
            description: 'Por favor, informe a recepção'
          });
        }
      } else {
        // Venda de serviço (checkout normal)
        // 🔒 Produtos já foram salvos no TotemCheckout, apenas atualizar estoque
        if (selectedProducts && selectedProducts.length > 0) {
          console.log('📦 Atualizando estoque dos produtos');
          
          for (const product of selectedProducts) {
            const { error: stockError } = await supabase.rpc('decrease_product_stock', {
              p_product_id: product.product_id,
              p_quantity: product.quantidade
            });

            if (stockError) {
              console.error('Erro ao atualizar estoque:', stockError);
              // Continua mesmo com erro de estoque
            }
          }
        }

        // 🔒 Chamar edge function para finalizar checkout de serviço
        const { error: finishError } = await supabase.functions.invoke('totem-checkout', {
          body: {
            action: 'finish',
            venda_id: venda_id,
            session_id: session_id,
            payment_id: paymentId
          }
        });

        if (finishError) {
          console.error('Erro ao finalizar checkout:', finishError);
          toast.error('Erro ao finalizar', {
            description: 'Por favor, informe a recepção'
          });
        }
      }

      toast.success('Pagamento confirmado!');
      navigate('/totem/payment-success', { 
        state: { 
          appointment, 
          client,
          total,
          isDirect
        } 
      });
    } catch (error) {
      console.error('Erro ao confirmar pagamento:', error);
      toast.error('Erro ao processar pagamento');
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
    <div className="fixed inset-0 w-screen h-screen flex flex-col p-3 sm:p-4 md:p-6 font-poppins overflow-hidden relative">
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-urbana-black/90 via-urbana-black/85 to-urbana-brown/80" />
      </div>

      {/* Premium background effects */}
      <div className="absolute inset-0 overflow-hidden z-0">
        <div className="absolute top-1/4 right-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-urbana-gold/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-urbana-gold-vibrant/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6 z-10">
        <Button
          onClick={() => navigate('/totem/checkout', { state: { appointment } })}
          variant="ghost"
          size="lg"
          className="h-10 sm:h-12 md:h-14 lg:h-16 px-3 sm:px-4 md:px-6 text-sm sm:text-base md:text-lg text-urbana-light hover:text-urbana-gold hover:bg-urbana-gold/20"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Voltar</span>
        </Button>
        <div className="text-center flex-1">
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-urbana-gold via-urbana-gold-light to-urbana-gold">
            Pagamento via PIX
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-urbana-gray-light mt-1">Escaneie o QR Code</p>
        </div>
        <div className="w-12 sm:w-16 md:w-24"></div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center overflow-y-auto py-2 z-10">
        <Card className="w-full max-w-xl sm:max-w-2xl md:max-w-3xl p-4 sm:p-6 md:p-8 lg:p-10 space-y-4 sm:space-y-6 bg-urbana-black-soft/40 backdrop-blur-xl border-2 border-urbana-gold/30 shadow-2xl shadow-urbana-gold/20 text-center">
          {/* Indicador de Simulação */}
          <div className="bg-gradient-to-r from-urbana-gold/20 via-urbana-gold-vibrant/15 to-urbana-gold/20 border-2 border-urbana-gold/40 rounded-2xl p-4 sm:p-5 animate-pulse shadow-lg shadow-urbana-gold/20">
            <div className="flex items-center justify-center gap-2 sm:gap-3">
              <div className="relative">
                <div className="w-3 h-3 bg-urbana-gold rounded-full animate-ping absolute" />
                <div className="w-3 h-3 bg-urbana-gold rounded-full" />
              </div>
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-black text-urbana-gold">
                🤖 MODO TESTE: Aprovação automática em {simulationTimer}s
              </p>
            </div>
          </div>

          {/* Timer */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 p-4 bg-urbana-black/30 rounded-2xl border border-urbana-gold/20">
            <Clock className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-urbana-gold animate-pulse" />
            <div className="text-left">
              <p className="text-sm sm:text-base text-urbana-light/60">Tempo restante</p>
              <p className="text-2xl sm:text-3xl md:text-4xl font-black text-urbana-gold">
                {formatTime(timeLeft)}
              </p>
            </div>
          </div>

          {/* QR Code */}
          <div className="flex justify-center py-6 sm:py-8">
            <div className="relative">
              <div className="absolute -inset-4 bg-urbana-gold/20 rounded-3xl blur-2xl" />
              <div className="relative bg-white p-4 sm:p-5 md:p-6 lg:p-8 rounded-2xl shadow-2xl">
                {pixCode ? (
                  <QRCodeSVG value={pixCode} size={window.innerWidth < 640 ? 220 : window.innerWidth < 768 ? 260 : 320} />
                ) : (
                  <div className="w-[220px] h-[220px] sm:w-[260px] sm:h-[260px] md:w-[320px] md:h-[320px] flex items-center justify-center">
                    <div className="text-center space-y-3">
                      <div className="w-12 h-12 border-4 border-urbana-gold/30 border-t-urbana-gold rounded-full animate-spin mx-auto" />
                      <p className="text-base sm:text-lg text-gray-500 font-medium">Gerando QR Code...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-3 p-6 bg-gradient-to-r from-urbana-gold/10 via-urbana-gold-vibrant/10 to-urbana-gold/10 rounded-2xl border-2 border-urbana-gold/30">
            <p className="text-lg sm:text-xl md:text-2xl text-urbana-light/70 font-medium">Valor total</p>
            <p className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-urbana-gold via-urbana-gold-light to-urbana-gold animate-pulse">
              R$ {total?.toFixed(2)}
            </p>
          </div>

          {/* Instructions */}
          <div className="pt-6 space-y-4">
            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-urbana-light mb-4">Como pagar:</h3>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-urbana-black/30 rounded-xl border border-urbana-gold/20">
                <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-urbana-gold/20 flex items-center justify-center border-2 border-urbana-gold">
                  <span className="text-lg sm:text-xl font-black text-urbana-gold">1</span>
                </div>
                <div className="flex-1 text-left">
                  <p className="text-base sm:text-lg md:text-xl font-semibold text-urbana-light">Abra o app do seu banco</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-urbana-black/30 rounded-xl border border-urbana-gold/20">
                <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-urbana-gold/20 flex items-center justify-center border-2 border-urbana-gold">
                  <span className="text-lg sm:text-xl font-black text-urbana-gold">2</span>
                </div>
                <div className="flex-1 text-left">
                  <p className="text-base sm:text-lg md:text-xl font-semibold text-urbana-light">Escolha Pix e escaneie o código</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-urbana-black/30 rounded-xl border border-urbana-gold/20">
                <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-urbana-gold/20 flex items-center justify-center border-2 border-urbana-gold">
                  <span className="text-lg sm:text-xl font-black text-urbana-gold">3</span>
                </div>
                <div className="flex-1 text-left">
                  <p className="text-base sm:text-lg md:text-xl font-semibold text-urbana-light">Confirme o pagamento</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-urbana-light/60 animate-pulse pt-4">
            <div className="w-2 h-2 bg-urbana-gold rounded-full animate-bounce" />
            <p className="text-base sm:text-lg md:text-xl font-medium">
              Aguardando confirmação do pagamento...
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TotemPaymentPix;
