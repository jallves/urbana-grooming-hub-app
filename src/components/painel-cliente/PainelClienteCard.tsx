import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

export type PainelClienteCardVariant = 'default' | 'highlight' | 'success' | 'warning' | 'info';

interface PainelClienteCardProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: PainelClienteCardVariant;
  icon?: LucideIcon;
  className?: string;
  disabled?: boolean;
}

/**
 * PainelClienteCard - Card com glassmorphism para o Painel do Cliente
 * Segue o mesmo design system do Totem
 * 
 * @example
 * ```tsx
 * <PainelClienteCard
 *   variant="highlight"
 *   icon={Calendar}
 *   onClick={() => navigate('/agendar')}
 * >
 *   <PainelClienteCardTitle>Agendar Horário</PainelClienteCardTitle>
 *   <PainelClienteCardDescription>Escolha data e horário</PainelClienteCardDescription>
 * </PainelClienteCard>
 * ```
 */
export const PainelClienteCard: React.FC<PainelClienteCardProps> = ({
  children,
  onClick,
  variant = 'default',
  icon: Icon,
  className,
  disabled = false,
}) => {
  const getVariantStyles = () => {
    const baseStyles = 'bg-urbana-black/20 backdrop-blur-md border transition-all duration-300';
    
    switch (variant) {
      case 'highlight':
        return cn(
          baseStyles,
          'border-urbana-gold/30 hover:border-urbana-gold/50 hover:bg-urbana-gold/10',
          'shadow-lg shadow-urbana-gold/10 hover:shadow-xl hover:shadow-urbana-gold/20',
          onClick && !disabled && 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]'
        );
      case 'success':
        return cn(
          baseStyles,
          'border-green-500/30 hover:border-green-500/50 hover:bg-green-500/10',
          'shadow-lg shadow-green-500/10 hover:shadow-xl hover:shadow-green-500/20',
          onClick && !disabled && 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]'
        );
      case 'warning':
        return cn(
          baseStyles,
          'border-yellow-500/30 hover:border-yellow-500/50 hover:bg-yellow-500/10',
          'shadow-lg shadow-yellow-500/10 hover:shadow-xl hover:shadow-yellow-500/20',
          onClick && !disabled && 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]'
        );
      case 'info':
        return cn(
          baseStyles,
          'border-blue-500/30 hover:border-blue-500/50 hover:bg-blue-500/10',
          'shadow-lg shadow-blue-500/10 hover:shadow-xl hover:shadow-blue-500/20',
          onClick && !disabled && 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]'
        );
      default:
        return cn(
          baseStyles,
          'border-urbana-light/20 hover:border-urbana-light/30 hover:bg-urbana-light/5',
          'shadow-lg hover:shadow-xl',
          onClick && !disabled && 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]'
        );
    }
  };

  const handleClick = () => {
    if (onClick && !disabled) {
      onClick();
    }
  };

  return (
    <Card
      onClick={handleClick}
      className={cn(
        getVariantStyles(),
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {Icon && (
        <div className="absolute top-4 right-4">
          <div className={cn(
            'p-2 rounded-lg',
            variant === 'highlight' && 'bg-urbana-gold/20',
            variant === 'success' && 'bg-green-500/20',
            variant === 'warning' && 'bg-yellow-500/20',
            variant === 'info' && 'bg-blue-500/20',
            variant === 'default' && 'bg-urbana-light/10'
          )}>
            <Icon className={cn(
              'h-5 w-5',
              variant === 'highlight' && 'text-urbana-gold',
              variant === 'success' && 'text-green-400',
              variant === 'warning' && 'text-yellow-400',
              variant === 'info' && 'text-blue-400',
              variant === 'default' && 'text-urbana-light'
            )} />
          </div>
        </div>
      )}
      {children}
    </Card>
  );
};

/**
 * PainelClienteCardTitle - Título do card
 */
export const PainelClienteCardTitle: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return (
    <CardTitle className={cn(
      'text-xl sm:text-2xl font-bold text-urbana-light drop-shadow-lg',
      className
    )}>
      {children}
    </CardTitle>
  );
};

/**
 * PainelClienteCardDescription - Descrição do card
 */
export const PainelClienteCardDescription: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return (
    <CardDescription className={cn(
      'text-sm sm:text-base text-urbana-light/70',
      className
    )}>
      {children}
    </CardDescription>
  );
};

/**
 * PainelClienteCardHeader - Header do card
 */
export const PainelClienteCardHeader: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return (
    <CardHeader className={cn('pb-3', className)}>
      {children}
    </CardHeader>
  );
};

/**
 * PainelClienteCardContent - Conteúdo do card
 */
export const PainelClienteCardContent: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return (
    <CardContent className={cn('space-y-2', className)}>
      {children}
    </CardContent>
  );
};

/**
 * PainelClienteCardFooter - Footer do card
 */
export const PainelClienteCardFooter: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return (
    <CardFooter className={cn('pt-4', className)}>
      {children}
    </CardFooter>
  );
};
