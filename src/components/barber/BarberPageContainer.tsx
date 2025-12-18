import React from 'react';
import { cn } from '@/lib/utils';
import { useBarberAuth } from '@/hooks/useBarberAuth';

interface BarberPageContainerProps {
  children: React.ReactNode;
  className?: string;
  hideHeader?: boolean;
}

/**
 * BarberPageContainer - Container padrão para todas as páginas do Painel do Barbeiro
 * Réplica exata do ClientPageContainer para manter consistência visual
 * 
 * Define a largura, padding e responsividade oficial do painel.
 * TODAS as páginas do barbeiro devem usar este container para manter consistência visual.
 * 
 * Agora inclui um cabeçalho unificado e estático por padrão.
 * 
 * Configuração padrão (baseada no ClientPageContainer):
 * - w-full: largura total disponível
 * - max-w-7xl: largura máxima de 80rem (1280px)
 * - mx-auto: centralizado horizontalmente
 * - py-4 sm:py-6: padding vertical responsivo
 * - px-4 md:px-6 lg:px-8: padding horizontal
 * 
 * @example
 * ```tsx
 * <BarberPageContainer>
 *   <h1>Título da Página</h1>
 *   <div>Conteúdo aqui</div>
 * </BarberPageContainer>
 * ```
 */
export const BarberPageContainer: React.FC<BarberPageContainerProps> = ({
  children,
  className,
  hideHeader = false,
}) => {
  const { displayName } = useBarberAuth();

  // Debug: verificar se o header está sendo renderizado
  console.log('🔍 BarberPageContainer - hideHeader:', hideHeader, 'displayName:', displayName);

  return (
    <div className={cn(
      // Largura e centralização
      'w-full',
      'max-w-7xl',
      'mx-auto',
      // Padding vertical - aumentado para PWA desktop
      'pt-6 sm:pt-8 lg:pt-12',
      'pb-6 sm:pb-8 lg:pb-12',
      // Padding horizontal - aumentado para PWA desktop
      'px-6 md:px-8 lg:px-12',
      className
    )}>
      {/* Cabeçalho Unificado - Sem logo, apenas saudação */}
      {!hideHeader && (
        <div className="mb-8 sm:mb-10 lg:mb-12 pb-6 sm:pb-8 border-b border-urbana-gold/20">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-urbana-gold font-playfair drop-shadow-lg">
              Olá, {displayName?.split(' ')[0] || 'Barbeiro'}!
            </h1>
            <p className="text-urbana-light/70 text-sm sm:text-base lg:text-lg drop-shadow-md mt-1 sm:mt-2">
              Bem-vindo ao seu painel profissional
            </p>
          </div>
        </div>
      )}
      
      {children}
    </div>
  );
};
