import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Loader2, LucideIcon } from 'lucide-react';

export type TotemButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
export type TotemButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface TotemButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: TotemButtonVariant;
  size?: TotemButtonSize;
  icon?: LucideIcon;
  loading?: boolean;
  children: React.ReactNode;
}

/**
 * TotemButton - Botão padronizado para o sistema Totem
 * Segue o design system definido em docs/TOTEM_DESIGN_SYSTEM.md
 * 
 * @example
 * ```tsx
 * <TotemButton variant="primary" size="lg" icon={Check}>
 *   Confirmar
 * </TotemButton>
 * ```
 */
export const TotemButton: React.FC<TotemButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  loading = false,
  children,
  className,
  disabled,
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-gradient-to-r from-urbana-gold via-urbana-gold-vibrant to-urbana-gold text-urbana-black hover:from-urbana-gold-vibrant hover:via-urbana-gold hover:to-urbana-gold-vibrant shadow-xl shadow-urbana-gold/40';
      case 'secondary':
        return 'bg-gradient-to-r from-urbana-brown via-urbana-brown to-urbana-black text-urbana-light border-2 border-urbana-gold/30 hover:border-urbana-gold/50 shadow-lg';
      case 'outline':
        return 'bg-transparent border-2 border-urbana-gold/40 text-urbana-gold hover:bg-urbana-gold/10 hover:border-urbana-gold/60';
      case 'ghost':
        return 'bg-transparent text-urbana-light hover:bg-urbana-gold/10 hover:text-urbana-gold';
      default:
        return '';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'h-10 sm:h-12 px-4 sm:px-6 text-sm sm:text-base';
      case 'md':
        return 'h-12 sm:h-14 md:h-16 px-6 sm:px-8 text-base sm:text-lg md:text-xl';
      case 'lg':
        return 'h-14 sm:h-16 md:h-20 px-8 sm:px-10 text-lg sm:text-xl md:text-2xl';
      case 'xl':
        return 'h-16 sm:h-20 md:h-24 lg:h-28 px-10 sm:px-12 text-xl sm:text-2xl md:text-3xl';
      default:
        return '';
    }
  };

  return (
    <Button
      className={cn(
        'relative font-bold rounded-xl transition-all duration-200',
        'active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed',
        'overflow-hidden group',
        getVariantStyles(),
        getSizeStyles(),
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {/* Shine effect for primary buttons */}
      {variant === 'primary' && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
      )}
      
      {/* Content */}
      <div className="relative flex items-center justify-center gap-2 sm:gap-3">
        {loading ? (
          <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
        ) : Icon && (
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
        )}
        <span>{children}</span>
      </div>
    </Button>
  );
};
