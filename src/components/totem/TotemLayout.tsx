import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import barbershopBg from '@/assets/barbershop-background.jpg';
import TotemDebugButton from './TotemDebugButton';

interface TotemLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  backPath?: string;
  headerRight?: React.ReactNode;
  className?: string;
}

/**
 * TotemLayout - Layout padrão para todas as telas do Totem
 * Segue o design system definido em docs/TOTEM_DESIGN_SYSTEM.md
 * 
 * @example
 * ```tsx
 * <TotemLayout
 *   title="Escolha o Serviço"
 *   subtitle="Selecione o serviço desejado"
 *   showBackButton
 *   backPath="/totem/home"
 * >
 *   <div>Conteúdo da tela</div>
 * </TotemLayout>
 * ```
 */
export const TotemLayout: React.FC<TotemLayoutProps> = ({
  children,
  title,
  subtitle,
  showBackButton = false,
  onBack,
  backPath,
  headerRight,
  className,
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backPath) {
      navigate(backPath);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="fixed inset-0 w-screen h-screen flex flex-col p-2 sm:p-3 md:p-4 lg:p-6 xl:p-8 font-poppins relative overflow-hidden">
      {/* Background image - Mobile Optimized */}
      <div className="absolute inset-0 z-0">
        <img 
          src={barbershopBg} 
          alt="Barbearia" 
          className="w-full h-full object-cover"
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-urbana-black/85 via-urbana-black/80 to-urbana-brown/75" />
      </div>

      {/* Animated background effects - Responsive */}
      <div className="absolute inset-0 overflow-hidden z-0">
        <div className="absolute top-1/4 right-1/4 w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 bg-urbana-gold/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 left-1/4 w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 bg-urbana-gold-vibrant/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
      </div>

      {/* Header - Mobile First */}
      {(title || showBackButton) && (
        <div className="relative z-10 flex items-center justify-between mb-3 sm:mb-4 md:mb-6 gap-2">
          {/* Back Button */}
          {showBackButton ? (
            <Button
              onClick={handleBack}
              variant="ghost"
              size="lg"
              className="h-11 sm:h-12 md:h-14 px-3 sm:px-4 md:px-6 text-sm sm:text-base md:text-lg text-urbana-light hover:text-urbana-gold hover:bg-urbana-gold/10 transition-all duration-200 min-w-[44px] touch-manipulation"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mr-1 sm:mr-2 flex-shrink-0" />
              <span className="hidden sm:inline">Voltar</span>
            </Button>
          ) : (
            <div className="w-11 sm:w-12 md:w-16 lg:w-24 flex-shrink-0" />
          )}

          {/* Title */}
          {title && (
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-urbana-light text-center flex-1 drop-shadow-lg leading-tight px-2">
              {title}
            </h1>
          )}

          {/* Header Right */}
          {headerRight ? (
            <div className="flex items-center flex-shrink-0">
              {headerRight}
            </div>
          ) : (
            <div className="w-11 sm:w-12 md:w-16 lg:w-24 flex-shrink-0" />
          )}
        </div>
      )}

      {/* Subtitle - Mobile Optimized */}
      {subtitle && (
        <p className="relative z-10 text-center text-xs sm:text-sm md:text-base lg:text-lg text-urbana-light/70 mb-3 sm:mb-4 md:mb-6 drop-shadow-md px-4">
          {subtitle}
        </p>
      )}

      {/* Content - Mobile Optimized */}
      <div className={cn(
        'relative z-10 flex-1 overflow-y-auto pb-3 sm:pb-4 md:pb-6',
        className
      )}>
        {children}
      </div>

      {/* Debug Button */}
      <TotemDebugButton />
    </div>
  );
};

/**
 * TotemContentContainer - Container para conteúdo centralizado
 */
export const TotemContentContainer: React.FC<{
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl';
}> = ({ children, className, maxWidth = '7xl' }) => {
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
      'mx-auto w-full pb-2 sm:pb-3 md:pb-4 px-2 sm:px-3 md:px-4',
      getMaxWidthClass(),
      className
    )}>
      {children}
    </div>
  );
};

export const TotemGrid: React.FC<{
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  gap?: 2 | 3 | 4 | 6 | 8;
  className?: string;
}> = ({ children, columns = 3, gap = 4, className }) => {
  const getGridCols = () => {
    switch (columns) {
      case 1: return 'grid-cols-1';
      case 2: return 'grid-cols-1 xs:grid-cols-2';
      case 3: return 'grid-cols-1 xs:grid-cols-2 lg:grid-cols-3';
      case 4: return 'grid-cols-1 xs:grid-cols-2 md:grid-cols-3 xl:grid-cols-4';
      default: return 'grid-cols-1 xs:grid-cols-2 lg:grid-cols-3';
    }
  };

  const getGapClass = () => {
    switch (gap) {
      case 2: return 'gap-2';
      case 3: return 'gap-2 sm:gap-3';
      case 4: return 'gap-2 sm:gap-3 md:gap-4';
      case 6: return 'gap-3 sm:gap-4 md:gap-6';
      case 8: return 'gap-3 sm:gap-5 md:gap-8';
      default: return 'gap-2 sm:gap-3 md:gap-4';
    }
  };

  return (
    <div className={cn(
      'grid w-full',
      getGridCols(),
      getGapClass(),
      className
    )}>
      {children}
    </div>
  );
};
