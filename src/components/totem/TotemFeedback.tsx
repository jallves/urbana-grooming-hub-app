import React from 'react';
import { CheckCircle, XCircle, Loader2, AlertCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TotemFeedbackProps {
  type: 'success' | 'error' | 'loading' | 'warning' | 'info';
  title: string;
  message?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showIcon?: boolean;
  animate?: boolean;
}

/**
 * Componente de feedback visual aprimorado para Totem
 * Fase 1: Feedback visual rico
 */
export const TotemFeedback: React.FC<TotemFeedbackProps> = ({
  type,
  title,
  message,
  className,
  size = 'lg',
  showIcon = true,
  animate = true,
}) => {
  const iconMap = {
    success: CheckCircle,
    error: XCircle,
    loading: Loader2,
    warning: AlertCircle,
    info: Clock,
  };

  const colorMap = {
    success: {
      bg: 'from-green-500/20 to-green-600/10',
      border: 'border-green-500/30',
      glow: 'bg-green-500',
      text: 'text-green-500',
      icon: 'text-green-400',
    },
    error: {
      bg: 'from-red-500/20 to-red-600/10',
      border: 'border-red-500/30',
      glow: 'bg-red-500',
      text: 'text-red-500',
      icon: 'text-red-400',
    },
    loading: {
      bg: 'from-urbana-gold/20 to-urbana-gold-dark/10',
      border: 'border-urbana-gold/30',
      glow: 'bg-urbana-gold',
      text: 'text-urbana-gold',
      icon: 'text-urbana-gold-light',
    },
    warning: {
      bg: 'from-yellow-500/20 to-yellow-600/10',
      border: 'border-yellow-500/30',
      glow: 'bg-yellow-500',
      text: 'text-yellow-500',
      icon: 'text-yellow-400',
    },
    info: {
      bg: 'from-blue-500/20 to-blue-600/10',
      border: 'border-blue-500/30',
      glow: 'bg-blue-500',
      text: 'text-blue-500',
      icon: 'text-blue-400',
    },
  };

  const sizeMap = {
    sm: {
      icon: 'w-8 h-8',
      title: 'text-xl',
      message: 'text-sm',
      glow: 'w-16 h-16',
      padding: 'p-4',
    },
    md: {
      icon: 'w-12 h-12',
      title: 'text-2xl',
      message: 'text-base',
      glow: 'w-24 h-24',
      padding: 'p-6',
    },
    lg: {
      icon: 'w-16 h-16',
      title: 'text-3xl md:text-4xl',
      message: 'text-lg md:text-xl',
      glow: 'w-32 h-32',
      padding: 'p-8',
    },
    xl: {
      icon: 'w-24 h-24',
      title: 'text-4xl md:text-5xl',
      message: 'text-xl md:text-2xl',
      glow: 'w-40 h-40',
      padding: 'p-10',
    },
  };

  const Icon = iconMap[type];
  const colors = colorMap[type];
  const sizes = sizeMap[size];

  return (
    <div
      className={cn(
        'relative rounded-2xl border-2 bg-gradient-to-br backdrop-blur-sm',
        colors.bg,
        colors.border,
        sizes.padding,
        animate && 'animate-scale-in',
        className
      )}
    >
      {showIcon && (
        <div className="flex justify-center mb-6">
          <div className="relative">
            {/* Glow effect */}
            <div
              className={cn(
                'absolute inset-0 blur-3xl opacity-40',
                colors.glow,
                animate && 'animate-pulse'
              )}
            />
            
            {/* Icon */}
            <div className={cn('relative', sizes.glow, 'flex items-center justify-center')}>
              <Icon
                className={cn(
                  sizes.icon,
                  colors.icon,
                  type === 'loading' && 'animate-spin'
                )}
                strokeWidth={2.5}
              />
            </div>
          </div>
        </div>
      )}

      <div className="text-center space-y-3">
        <h2 className={cn('font-bold text-urbana-light', sizes.title)}>{title}</h2>
        {message && (
          <p className={cn('text-urbana-light/70', sizes.message)}>{message}</p>
        )}
      </div>
    </div>
  );
};
