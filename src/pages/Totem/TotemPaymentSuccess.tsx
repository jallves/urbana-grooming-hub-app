import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { CheckCircle, Receipt } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const TotemPaymentSuccess: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { appointment, client, total, paymentMethod } = location.state || {};

  useEffect(() => {
    // Add totem-mode class for touch optimization
    document.documentElement.classList.add('totem-mode');
    
    if (!appointment || !total || !client) {
      navigate('/totem/home');
      return;
    }

    // Redirecionar para tela de avaliação após 4 segundos
    const timer = setTimeout(() => {
      navigate('/totem/rating', {
        state: { appointment, client }
      });
    }, 4000);

    return () => {
      clearTimeout(timer);
      document.documentElement.classList.remove('totem-mode');
    };
  }, [navigate, appointment, client, total]);

  if (!appointment || !total || !client) {
    return null;
  }

  const getPaymentMethodText = () => {
    if (paymentMethod === 'credit') return 'Cartão de Crédito';
    if (paymentMethod === 'debit') return 'Cartão de Débito';
    return 'PIX';
  };

  return (
    <div className="fixed inset-0 w-screen h-screen bg-urbana-black flex flex-col items-center justify-center p-3 sm:p-4 md:p-6 font-poppins relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-urbana-black via-urbana-brown/20 to-urbana-black opacity-50" />
      
      {/* Animated circles */}
      <div className="absolute top-1/4 left-1/4 w-48 h-48 sm:w-64 sm:h-64 md:w-96 md:h-96 bg-urbana-gold/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-48 h-48 sm:w-64 sm:h-64 md:w-96 md:h-96 bg-urbana-gold/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="text-center space-y-3 sm:space-y-4 md:space-y-6 max-w-xl sm:max-w-2xl md:max-w-4xl w-full z-10 animate-fade-in">
        {/* Success Icon */}
        <div className="flex justify-center mb-2 sm:mb-4">
          <div className="relative">
            <div className="absolute inset-0 bg-green-500 blur-3xl opacity-40 animate-pulse" />
            <div className="relative w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-2xl border-4 border-green-400/20">
              <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 text-white" strokeWidth={3} />
            </div>
          </div>
        </div>

        {/* Success Message with Client Name */}
        <div className="space-y-2 sm:space-y-3 md:space-y-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-green-400 to-emerald-300">
            Muito obrigado, {client.nome.split(' ')[0]}! 🎉
          </h1>
          
          <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-urbana-light/90 font-semibold">
            Pagamento Confirmado com Sucesso
          </p>
          
          <p className="text-lg sm:text-xl md:text-2xl text-urbana-gold font-bold">
            Foi um prazer atendê-lo! ✨
          </p>
          
          <p className="text-base sm:text-lg md:text-xl text-urbana-light/70">
            Esperamos você novamente em breve!
          </p>
        </div>

        {/* Receipt */}
        <div className="bg-urbana-black/40 backdrop-blur-sm border-2 border-urbana-gold/30 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 space-y-2 sm:space-y-3 mt-3 sm:mt-4 max-h-[45vh] overflow-y-auto">
          <div className="flex items-center justify-center gap-2 sm:gap-3 text-sm sm:text-base md:text-lg lg:text-xl font-bold text-urbana-gold border-b-2 border-urbana-gold/30 pb-2 sm:pb-3">
            <Receipt className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" />
            RECIBO
          </div>

          <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm md:text-base lg:text-lg">
            <div className="flex justify-between py-1.5 sm:py-2 border-b border-urbana-gold/20">
              <span className="text-urbana-light/60">Data:</span>
              <span className="font-semibold text-urbana-light text-right">
                {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </span>
            </div>

            <div className="flex justify-between py-1.5 sm:py-2 border-b border-urbana-gold/20">
              <span className="text-urbana-light/60">Cliente:</span>
              <span className="font-semibold text-urbana-light text-right truncate max-w-[60%]">
                {client.nome}
              </span>
            </div>

            <div className="flex justify-between py-1.5 sm:py-2 border-b border-urbana-gold/20">
              <span className="text-urbana-light/60">Serviço:</span>
              <span className="font-semibold text-urbana-light text-right truncate max-w-[60%]">
                {appointment.servico?.nome}
              </span>
            </div>

            <div className="flex justify-between py-1.5 sm:py-2 border-b border-urbana-gold/20">
              <span className="text-urbana-light/60">Pagamento:</span>
              <span className="font-semibold text-urbana-light text-right">
                {getPaymentMethodText()}
              </span>
            </div>

            <div className="flex justify-between py-3 sm:py-4 border-t-4 border-urbana-gold pt-3 sm:pt-4">
              <span className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-urbana-light">TOTAL:</span>
              <span className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-black text-urbana-gold">
                R$ {total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Message */}
        <div className="text-center space-y-2 sm:space-y-3 pt-3 sm:pt-4">
          <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-urbana-light font-semibold">
            Até a próxima! 
          </p>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-urbana-gold font-bold">
            Costa Urbana Barbearia
          </p>
          
          <div className="pt-2 sm:pt-3 space-y-1 sm:space-y-2">
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 rounded-full bg-urbana-gold animate-pulse" />
              <p className="text-xs sm:text-sm md:text-base text-urbana-light/60">
                Preparando avaliação...
              </p>
            </div>
            <p className="text-xs sm:text-sm text-urbana-light/40">
              Sua opinião é muito importante para nós!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TotemPaymentSuccess;
