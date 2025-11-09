import React from 'react';
import { AlertCircle, RefreshCw, Home, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

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

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="flex items-center justify-center min-h-screen p-8"
    >
      <div className={`relative max-w-2xl w-full ${colors.bg} ${colors.border} border-2 rounded-3xl p-12 backdrop-blur-xl`}>
        {/* Glow effect */}
        <div className={`absolute -inset-4 ${colors.glow} blur-3xl opacity-30 rounded-3xl`} />

        {/* Content */}
        <div className="relative space-y-8 text-center">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="relative">
              <div className={`absolute inset-0 ${colors.glow} blur-2xl opacity-50`} />
              <Icon className={`relative w-24 h-24 ${colors.icon}`} />
            </div>
          </div>

          {/* Text */}
          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground">
              {title}
            </h2>
            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed">
              {message}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            {showRetry && onRetry && (
              <Button
                onClick={onRetry}
                size="lg"
                className="text-xl px-8 py-6 h-auto bg-gradient-to-r from-urbana-gold via-urbana-gold-vibrant to-urbana-gold hover:opacity-90 transition-opacity text-urbana-black font-bold"
              >
                <RefreshCw className="w-6 h-6 mr-3" />
                Tentar Novamente
              </Button>
            )}
            
            {showGoHome && onGoHome && (
              <Button
                onClick={onGoHome}
                size="lg"
                variant="outline"
                className="text-xl px-8 py-6 h-auto border-2 backdrop-blur-md"
              >
                <Home className="w-6 h-6 mr-3" />
                Voltar ao Início
              </Button>
            )}
          </div>

          {/* Help text */}
          <p className="text-sm text-muted-foreground pt-4">
            Se o problema persistir, procure um atendente
          </p>
        </div>
      </div>
    </motion.div>
  );
};
