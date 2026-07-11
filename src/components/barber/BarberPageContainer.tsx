import React from 'react';
import { cn } from '@/lib/utils';
import { useBarberAuth } from '@/hooks/useBarberAuth';
import { useEmployeeProfile } from '@/hooks/useEmployeeProfile';
import { useAuth } from '@/contexts/AuthContext';

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
  const { displayName: barberDisplayName, barber } = useBarberAuth();
  const { displayName: employeeDisplayName } = useEmployeeProfile();
  const { user } = useAuth();

  const resolvedName =
    barber?.nome ||
    barberDisplayName ||
    employeeDisplayName ||
    (user?.email ? user.email.split('@')[0] : '') ||
    'Barbeiro';
  const firstName = resolvedName.split(' ')[0] || 'Barbeiro';

  return (
    <div className={cn(
      // Largura e centralização
      'w-full',
      'max-w-7xl',
      'mx-auto',
      // Padding vertical
      'pt-3 sm:pt-6 lg:pt-10',
      'pb-6 sm:pb-8 lg:pb-12',
      // Padding horizontal - aumentado para PWA desktop
      'px-6 md:px-8 lg:px-12',
      className
    )}>
      {/* Cabeçalho Unificado - Saudação sticky no topo do scroll */}
      {!hideHeader && (
        <div
          className="sticky top-0 z-30 -mx-6 md:-mx-8 lg:-mx-12 px-6 md:px-8 lg:px-12 py-3 sm:py-4 mb-5 sm:mb-8 border-b border-urbana-gold/20 backdrop-blur-xl bg-urbana-black/70"
          style={{ WebkitBackdropFilter: 'blur(16px)' }}
        >
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-urbana-gold font-playfair drop-shadow-lg leading-tight">
            Olá, {firstName}!
          </h1>
          <p className="text-urbana-light/70 text-xs sm:text-sm lg:text-base drop-shadow-md mt-0.5 sm:mt-1">
            Bem-vindo ao seu painel profissional
          </p>
        </div>
      )}
      
      {children}
    </div>
  );
};
