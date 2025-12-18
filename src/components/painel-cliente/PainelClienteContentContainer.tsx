import React from 'react';
import { cn } from '@/lib/utils';

interface PainelClienteContentContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl';
  noPadding?: boolean;
}

/**
 * ⚠️ CONTAINER DO PAINEL DO CLIENTE - NÃO ADICIONE BACKGROUNDS AQUI ⚠️
 * 
 * PainelClienteContentContainer - Container transparente para conteúdo
 * O background é gerenciado pelo PainelClienteLayout (imagem da barbearia)
 * NUNCA adicione bg-white, bg-background ou qualquer outro background aqui
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
  noPadding = false,
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
      'mx-auto w-full',
      // pb maior no mobile para dar espaço acima do rodapé fixo
      noPadding ? 'py-0' : 'pt-3 sm:pt-4 md:pt-6 lg:pt-8 pb-24 sm:pb-28 md:pb-6 lg:pb-8 px-3 sm:px-4 md:px-6 lg:px-8',
      getMaxWidthClass(),
      className
    )}>
      {children}
    </div>
  );
};
