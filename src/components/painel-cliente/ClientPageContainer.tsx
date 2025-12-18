import React from 'react';
import { cn } from '@/lib/utils';
import { usePainelClienteAuth } from '@/contexts/PainelClienteAuthContext';

interface ClientPageContainerProps {
  children: React.ReactNode;
  className?: string;
  hideHeader?: boolean;
}

/**
 * ClientPageContainer - Container padrão para todas as páginas do Painel do Cliente
 * Última atualização: 2024-11-26 - Header automático implementado
 * 
 * Define a largura, padding e responsividade oficial do painel.
 * TODAS as páginas do cliente devem usar este container para manter consistência visual.
 * 
 * Agora inclui um cabeçalho unificado e estático por padrão.
 * 
 * Configuração padrão (baseada na Home):
 * - w-full: largura total disponível
 * - max-w-7xl: largura máxima de 80rem (1280px)
 * - mx-auto: centralizado horizontalmente
 * - py-4 sm:py-6: padding vertical responsivo
 * - px-4 md:px-6 lg:px-8: padding horizontal
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
  hideHeader = false,
}) => {
  const { cliente } = usePainelClienteAuth();

  return (
    <div className={cn(
      // Largura e centralização
      'w-full',
      'max-w-7xl',
      'mx-auto',
      // Padding vertical - responsivo para mobile
      'pt-3 sm:pt-4 md:pt-6 lg:pt-8',
      'pb-3 sm:pb-4 md:pb-6 lg:pb-8',
      // Padding horizontal - responsivo para mobile
      'px-3 sm:px-4 md:px-6 lg:px-8',
      className
    )}>
      {/* Cabeçalho Unificado - Sem logo, apenas saudação */}
      {!hideHeader && (
        <div className="mb-3 sm:mb-4 md:mb-6 lg:mb-8 pb-3 sm:pb-4 md:pb-6 border-b border-urbana-gold/20">
          <div>
            <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-urbana-gold font-playfair drop-shadow-lg">
              Olá, {cliente?.nome?.split(' ')[0] || 'Cliente'}!
            </h1>
            <p className="text-urbana-light/70 text-[11px] sm:text-xs md:text-sm lg:text-base drop-shadow-md mt-0.5 sm:mt-1">
              Bem-vindo à Barbearia Costa Urbana
            </p>
          </div>
        </div>
      )}
      
      {children}
    </div>
  );
};
