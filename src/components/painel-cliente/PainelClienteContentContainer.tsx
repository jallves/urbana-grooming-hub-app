import React from 'react';
import { cn } from '@/lib/utils';

interface PainelClienteContentContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl';
}

/**
 * PainelClienteContentContainer - Container para conteúdo do painel do cliente
 * Similar ao TotemContentContainer, mas para o painel do cliente
 * 
 * @example
 * ```tsx
 * <PainelClienteContentContainer maxWidth="5xl">
 *   <div>Conteúdo aqui</div>
 * </PainelClienteContentContainer>
 * ```
 */
export const PainelClienteContentContainer: React.FC<PainelClienteContentContainerProps> = ({
  children,
  className,
  maxWidth = '7xl',
}) => {
  const getMaxWidthClass = () => {
    switch (maxWidth) {
      case 'sm': return 'max-w-sm';
      case 'md': return 'max-w-md';
      case 'lg': return 'max-w-lg';
      case 'xl': return 'max-w-xl';
      case '2xl': return 'max-w-2xl';
      case '3xl': return 'max-w-3xl';
      case '4xl': return 'max-w-4xl';
      case '5xl': return 'max-w-5xl';
      case '6xl': return 'max-w-6xl';
      case '7xl': return 'max-w-7xl';
      default: return 'max-w-7xl';
    }
  };

  return (
    <div className={cn(
      'mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8',
      getMaxWidthClass(),
      className
    )}>
      {children}
    </div>
  );
};
