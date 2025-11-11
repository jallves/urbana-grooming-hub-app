import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AlertCircle, UserPlus, Home, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import barbershopBg from '@/assets/barbershop-background.jpg';

interface ErrorState {
  title: string;
  message: string;
  type?: 'error' | 'warning' | 'info';
  showRetry?: boolean;
  showGoHome?: boolean;
  showRegister?: boolean;
  action?: string;
}

const TotemError: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const errorState = (location.state as ErrorState) || {
    title: 'Erro',
    message: 'Ocorreu um erro inesperado',
    type: 'error',
    showGoHome: true
  };

  React.useEffect(() => {
    document.documentElement.classList.add('totem-mode');
    return () => {
      document.documentElement.classList.remove('totem-mode');
    };
  }, []);

  const getIconAndColors = () => {
    switch (errorState.type) {
      case 'info':
        return {
          Icon: Info,
          iconColor: 'text-blue-400',
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-400/30',
          glowColor: 'bg-blue-400/20'
        };
      case 'warning':
        return {
          Icon: AlertCircle,
          iconColor: 'text-yellow-400',
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-400/30',
          glowColor: 'bg-yellow-400/20'
        };
      default:
        return {
          Icon: AlertCircle,
          iconColor: 'text-red-400',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-400/30',
          glowColor: 'bg-red-400/20'
        };
    }
  };

  const { Icon, iconColor, bgColor, borderColor, glowColor } = getIconAndColors();

  const handleRegister = () => {
    navigate('/totem/cadastro', {
      state: {
        action: errorState.action || 'novo-agendamento'
      }
    });
  };

  const handleGoHome = () => {
    navigate('/totem/home');
  };

  return (
    <div className="fixed inset-0 w-screen h-screen flex items-center justify-center p-4 sm:p-6 md:p-8 font-poppins relative overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <img 
          src={barbershopBg} 
          alt="Barbearia" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-urbana-black/85 via-urbana-black/80 to-urbana-brown/75" />
      </div>

      {/* Animated background effects */}
      <div className="absolute inset-0 overflow-hidden z-0">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-urbana-gold/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-urbana-gold-vibrant/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="relative max-w-3xl w-full"
      >
        <div className={`relative ${bgColor} ${borderColor} border-2 rounded-3xl p-8 sm:p-12 md:p-16 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]`}>
          {/* Glow effect */}
          <div className={`absolute -inset-4 ${glowColor} blur-3xl opacity-30 rounded-3xl`} />

          {/* Content */}
          <div className="relative space-y-8 text-center">
            {/* Icon */}
            <div className="flex justify-center">
              <div className="relative">
                <div className={`absolute inset-0 ${glowColor} blur-2xl opacity-50`} />
                <Icon className={`relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 ${iconColor}`} />
              </div>
            </div>

            {/* Text */}
            <div className="space-y-4">
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-urbana-light">
                {errorState.title}
              </h2>
              <p className="text-xl sm:text-2xl md:text-3xl text-urbana-light/80 leading-relaxed">
                {errorState.message}
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              {errorState.showRegister && (
                <Button
                  onClick={handleRegister}
                  size="lg"
                  className="text-xl sm:text-2xl px-8 sm:px-10 py-6 sm:py-8 h-auto bg-gradient-to-r from-urbana-gold via-urbana-gold-vibrant to-urbana-gold hover:opacity-90 transition-opacity text-urbana-black font-bold rounded-2xl"
                >
                  <UserPlus className="w-6 h-6 sm:w-7 sm:h-7 mr-3" />
                  Fazer Cadastro
                </Button>
              )}
              
              {(errorState.showGoHome !== false) && (
                <Button
                  onClick={handleGoHome}
                  size="lg"
                  variant="outline"
                  className="text-xl sm:text-2xl px-8 sm:px-10 py-6 sm:py-8 h-auto border-2 border-urbana-gold/50 text-urbana-gold hover:bg-urbana-gold/10 backdrop-blur-md rounded-2xl"
                >
                  <Home className="w-6 h-6 sm:w-7 sm:h-7 mr-3" />
                  Voltar ao Início
                </Button>
              )}
            </div>

            {/* Help text */}
            <p className="text-base sm:text-lg md:text-xl text-urbana-light/60 pt-6">
              Ou procure um atendente para mais assistência
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default TotemError;
