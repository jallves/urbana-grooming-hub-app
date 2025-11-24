import React from 'react';
import { cn } from '@/lib/utils';

interface ClientPageContainerProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * ClientPageContainer - Container padrão para todas as páginas do Painel do Cliente
 * 
 * Define a largura, padding e responsividade oficial do painel.
 * TODAS as páginas do cliente devem usar este container para manter consistência visual.
 * 
 * Configuração padrão (baseada na Home):
 * - w-full: largura total disponível
 * - max-w-7xl: largura máxima de 80rem (1280px)
 * - mx-auto: centralizado horizontalmente
 * - py-4 sm:py-6: padding vertical responsivo
 * - px-0 md:px-6 lg:px-8: padding horizontal zero no mobile, aumenta no desktop
 * 
 * @example
 * ```tsx
 * <ClientPageContainer>
 *   <h1>Título da Página</h1>
 *   <div>Conteúdo aqui</div>
 * </ClientPageContainer>
 * ```
 */
export const ClientPageContainer: React.FC<ClientPageContainerProps> = ({
  children,
  className,
}) => {
  return (
    <div className={cn(
      // Largura e centralização
      'w-full',
      'max-w-7xl',
      'mx-auto',
      // Padding vertical
      'py-4 sm:py-6',
      // Padding horizontal (zero no mobile, aumenta no desktop)
      'px-4 md:px-6 lg:px-8',
      className
    )}>
      {children}
    </div>
  );
};
