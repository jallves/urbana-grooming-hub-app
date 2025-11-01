import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { CheckCircle, Receipt } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const TotemPaymentSuccess: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { appointment, total, paymentMethod } = location.state || {};

  useEffect(() => {
    // Add totem-mode class for touch optimization
    document.documentElement.classList.add('totem-mode');
    
    if (!appointment || !total) {
      navigate('/totem/home');
      return;
    }

    // Retorna para home após 8 segundos
    const timer = setTimeout(() => {
      navigate('/totem/home');
    }, 8000);

    return () => {
      clearTimeout(timer);
      document.documentElement.classList.remove('totem-mode');
    };
  }, [navigate, appointment, total]);

  if (!appointment || !total) {
    return null;
  }

  const getPaymentMethodText = () => {
    if (paymentMethod === 'credit') return 'Cartão de Crédito';
    if (paymentMethod === 'debit') return 'Cartão de Débito';
    return 'PIX';
  };

  return (
    <div className="fixed inset-0 w-screen h-screen bg-urbana-black flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 font-poppins relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-urbana-black via-urbana-brown/20 to-urbana-black opacity-50" />
      
      {/* Animated circles */}
      <div className="absolute top-1/4 left-1/4 w-48 h-48 sm:w-64 sm:h-64 md:w-96 md:h-96 bg-urbana-gold/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-48 h-48 sm:w-64 sm:h-64 md:w-96 md:h-96 bg-urbana-gold/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="text-center space-y-6 sm:space-y-8 md:space-y-10 max-w-xl sm:max-w-2xl md:max-w-4xl z-10 animate-fade-in">
        {/* Success Icon */}
        <div className="flex justify-center mb-4 sm:mb-6 md:mb-8">
          <div className="relative">
            <div className="absolute inset-0 bg-green-500 blur-3xl opacity-40 animate-pulse" />
            <div className="relative w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-2xl border-4 border-green-400/20">
              <CheckCircle className="w-14 h-14 sm:w-18 sm:h-18 md:w-24 md:h-24 text-white" strokeWidth={3} />
            </div>
          </div>
        </div>

        {/* Success Message */}
        <div className="space-y-4 sm:space-y-5 md:space-y-6">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-urbana-light">
            Pagamento Confirmado!
          </h1>
          
          <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-urbana-light/70">
            Obrigado pela preferência!
          </p>
        </div>

        {/* Receipt */}
        <div className="bg-urbana-black/40 backdrop-blur-sm border-2 border-urbana-gold/30 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 mt-6 sm:mt-8">
          <div className="flex items-center justify-center gap-3 sm:gap-4 text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-urbana-gold border-b-2 border-urbana-gold/30 pb-3 sm:pb-4">
            <Receipt className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10" />
            RECIBO DE PAGAMENTO
          </div>

          <div className="space-y-3 sm:space-y-4 text-base sm:text-lg md:text-xl lg:text-2xl">
            <div className="flex justify-between py-2 sm:py-3 border-b border-urbana-gold/20">
              <span className="text-urbana-light/60">Data:</span>
              <span className="font-semibold text-urbana-light">
                {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </span>
            </div>

            <div className="flex justify-between py-2 sm:py-3 border-b border-urbana-gold/20">
              <span className="text-urbana-light/60">Cliente:</span>
              <span className="font-semibold text-urbana-light">
                {appointment.cliente?.nome || 'Cliente'}
              </span>
            </div>

            <div className="flex justify-between py-2 sm:py-3 border-b border-urbana-gold/20">
              <span className="text-urbana-light/60">Serviço:</span>
              <span className="font-semibold text-urbana-light">
                {appointment.servico?.nome}
              </span>
            </div>

            <div className="flex justify-between py-2 sm:py-3 border-b border-urbana-gold/20">
              <span className="text-urbana-light/60">Forma de Pagamento:</span>
              <span className="font-semibold text-urbana-light">
                {getPaymentMethodText()}
              </span>
            </div>

            <div className="flex justify-between py-4 sm:py-6 border-t-4 border-urbana-gold pt-4 sm:pt-6">
              <span className="text-xl sm:text-2xl md:text-3xl font-bold text-urbana-light">TOTAL PAGO:</span>
              <span className="text-2xl sm:text-3xl md:text-4xl font-black text-urbana-gold">
                R$ {total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Message */}
        <div className="text-center space-y-3 sm:space-y-4 pt-6 sm:pt-8">
          <p className="text-2xl sm:text-3xl md:text-4xl text-urbana-light font-semibold">
            Até a próxima! 
          </p>
          <p className="text-xl sm:text-2xl md:text-3xl text-urbana-gold font-bold">
            Costa Urbana Barbearia
          </p>
          
          <div className="pt-4 sm:pt-6 space-y-2 sm:space-y-3">
            <div className="flex items-center justify-center gap-2 sm:gap-3">
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-urbana-gold animate-pulse" />
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-urbana-light/60">
                Retornando automaticamente em alguns segundos...
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TotemPaymentSuccess;
