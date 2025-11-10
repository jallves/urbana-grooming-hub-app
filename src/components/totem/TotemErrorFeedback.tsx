import React from 'react';
import { AlertCircle, RefreshCw, Home, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import barbershopBg from '@/assets/barbershop-background.jpg';

interface TotemErrorFeedbackProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  onGoHome?: () => void;
  showRetry?: boolean;
  showGoHome?: boolean;
  type?: 'error' | 'warning' | 'info';
}

export const TotemErrorFeedback: React.FC<TotemErrorFeedbackProps> = ({
  title = 'Ops! Algo deu errado',
  message,
  onRetry,
  onGoHome,
  showRetry = true,
  showGoHome = true,
  type = 'error',
}) => {
  const iconMap = {
    error: AlertCircle,
    warning: AlertCircle,
    info: AlertCircle,
  };

  const colorMap = {
    error: {
      icon: 'text-red-500',
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      glow: 'bg-red-500/20',
    },
    warning: {
      icon: 'text-yellow-500',
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/30',
      glow: 'bg-yellow-500/20',
    },
    info: {
      icon: 'text-blue-500',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      glow: 'bg-blue-500/20',
    },
  };

  const Icon = iconMap[type];
  const colors = colorMap[type];

  React.useEffect(() => {
    document.documentElement.classList.add('totem-mode');
    return () => {
      document.documentElement.classList.remove('totem-mode');
    };
  }, []);

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
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-urbana-gold-vibrant/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="relative max-w-2xl w-full"
      >
        <div className={`relative ${colors.bg} ${colors.border} border-2 rounded-3xl p-8 sm:p-12 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]`}>
          {/* Glow effect */}
          <div className={`absolute -inset-4 ${colors.glow} blur-3xl opacity-30 rounded-3xl`} />

          {/* Content */}
          <div className="relative space-y-8 text-center">
            {/* Icon */}
            <div className="flex justify-center">
              <div className="relative">
                <div className={`absolute inset-0 ${colors.glow} blur-2xl opacity-50`} />
                <Icon className={`relative w-20 h-20 sm:w-24 sm:h-24 ${colors.icon}`} />
              </div>
            </div>

            {/* Text */}
            <div className="space-y-4">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-urbana-light">
                {title}
              </h2>
              <p className="text-lg sm:text-xl md:text-2xl text-urbana-light/70 leading-relaxed">
                {message}
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              {showRetry && onRetry && (
                <Button
                  onClick={onRetry}
                  size="lg"
                  className="text-lg sm:text-xl px-6 sm:px-8 py-5 sm:py-6 h-auto bg-gradient-to-r from-urbana-gold via-urbana-gold-vibrant to-urbana-gold hover:opacity-90 transition-opacity text-urbana-black font-bold"
                >
                  <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
                  Tentar Novamente
                </Button>
              )}
              
              {showGoHome && onGoHome && (
                <Button
                  onClick={onGoHome}
                  size="lg"
                  variant="outline"
                  className="text-lg sm:text-xl px-6 sm:px-8 py-5 sm:py-6 h-auto border-2 border-urbana-gold/50 text-urbana-gold hover:bg-urbana-gold/10 backdrop-blur-md"
                >
                  <Home className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
                  Voltar ao Início
                </Button>
              )}
            </div>

            {/* Help text */}
            <p className="text-sm sm:text-base text-urbana-light/60 pt-4">
              Se o problema persistir, procure um atendente
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
