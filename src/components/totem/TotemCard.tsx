import React from 'react';
import { Card } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type TotemCardVariant = 'default' | 'selected' | 'disabled' | 'success' | 'error';

interface TotemCardProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: TotemCardVariant;
  icon?: LucideIcon;
  infoIcon?: LucideIcon;
  onInfoClick?: () => void;
  className?: string;
  animationDelay?: string;
  disabled?: boolean;
}

/**
 * TotemCard - Componente de card padrão para o Totem
 * Segue o design system definido em docs/TOTEM_DESIGN_SYSTEM.md
 * 
 * @example
 * ```tsx
 * <TotemCard
 *   icon={Scissors}
 *   variant="default"
 *   onClick={() => console.log('clicked')}
 * >
 *   <h3>Conteúdo do Card</h3>
 * </TotemCard>
 * ```
 */
export const TotemCard: React.FC<TotemCardProps> = ({
  children,
  onClick,
  variant = 'default',
  icon: Icon,
  infoIcon: InfoIcon,
  onInfoClick,
  className,
  animationDelay = '0s',
  disabled = false,
}) => {
  const getVariantStyles = (): string => {
    const baseStyles = 'bg-white/5 backdrop-blur-2xl border-2 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-all duration-300';
    
    switch (variant) {
      case 'selected':
        return cn(
          baseStyles,
          'border-urbana-gold shadow-[0_12px_40px_rgba(212,175,55,0.4)] ring-4 ring-urbana-gold/20'
        );
      
      case 'disabled':
        return cn(
          baseStyles,
          'border-red-500/30 opacity-75 cursor-not-allowed'
        );
      
      case 'success':
        return cn(
          baseStyles,
          'border-green-500/50 shadow-[0_8px_32px_rgba(16,185,129,0.2)]'
        );
      
      case 'error':
        return cn(
          baseStyles,
          'border-red-500/50 shadow-[0_8px_32px_rgba(239,68,68,0.2)]'
        );
      
      case 'default':
      default:
        return cn(
          baseStyles,
          'border-urbana-gold/40',
          !disabled && onClick && 'cursor-pointer hover:border-urbana-gold/60 hover:shadow-[0_12px_40px_rgba(212,175,55,0.3)] hover:scale-[1.02] active:scale-98'
        );
    }
  };

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
    }
  };

  const handleInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onInfoClick) {
      onInfoClick();
    }
  };

  return (
    <Card
      onClick={handleClick}
      className={cn(
        getVariantStyles(),
        'p-4 sm:p-6 md:p-8 animate-scale-in',
        className
      )}
      style={{ animationDelay }}
    >
      {/* Header com ícones (se fornecidos) */}
      {(Icon || InfoIcon) && (
        <div className="flex items-center justify-between mb-4">
          {/* Ícone Principal */}
          {Icon && (
            <div className={cn(
              'w-10 h-10 sm:w-12 sm:h-12 rounded-full backdrop-blur-sm border-2 flex items-center justify-center shadow-lg',
              variant === 'success' 
                ? 'bg-green-500/20 border-green-500/50 shadow-green-500/20'
                : variant === 'error'
                ? 'bg-red-500/20 border-red-500/50 shadow-red-500/20'
                : 'bg-urbana-gold/20 border-urbana-gold/50 shadow-urbana-gold/20'
            )}>
              <Icon className={cn(
                'w-5 h-5 sm:w-6 sm:h-6 drop-shadow-lg',
                variant === 'success' 
                  ? 'text-green-400'
                  : variant === 'error'
                  ? 'text-red-400'
                  : 'text-urbana-gold'
              )} />
            </div>
          )}

          {/* Ícone de Informação */}
          {InfoIcon && (
            <button
              onClick={handleInfoClick}
              className="w-8 h-8 rounded-full bg-urbana-gold/10 flex items-center justify-center hover:bg-urbana-gold/20 transition-colors"
            >
              <InfoIcon className="w-4 h-4 text-urbana-gold/60" />
            </button>
          )}
        </div>
      )}

      {/* Conteúdo do card */}
      {children}
    </Card>
  );
};

/**
 * TotemCardTitle - Componente de título para TotemCard
 */
export const TotemCardTitle: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <h3 className={cn(
    'text-lg sm:text-xl font-bold text-white drop-shadow-lg',
    className
  )}>
    {children}
  </h3>
);

/**
 * TotemCardPrice - Componente de preço para TotemCard
 */
export const TotemCardPrice: React.FC<{
  value: number;
  className?: string;
}> = ({ value, className }) => (
  <p className={cn(
    'text-2xl sm:text-3xl font-bold text-urbana-gold drop-shadow-lg',
    className
  )}>
    R$ {value.toFixed(2)}
  </p>
);

/**
 * TotemCardDuration - Componente de duração para TotemCard
 */
export const TotemCardDuration: React.FC<{
  minutes: number;
  className?: string;
}> = ({ minutes, className }) => (
  <p className={cn(
    'text-sm text-white/60',
    className
  )}>
    {minutes} min
  </p>
);

/**
 * TotemCardDescription - Componente de descrição para TotemCard
 */
export const TotemCardDescription: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <p className={cn(
    'text-sm sm:text-base text-urbana-light/60',
    className
  )}>
    {children}
  </p>
);

/**
 * TotemCardFooter - Componente de rodapé para TotemCard
 */
export const TotemCardFooter: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <div className={cn(
    'flex items-center justify-between mt-4',
    className
  )}>
    {children}
  </div>
);
