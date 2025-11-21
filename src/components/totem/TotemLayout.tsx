import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import barbershopBg from '@/assets/barbershop-background.jpg';

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
    <div className="fixed inset-0 w-screen h-screen flex flex-col p-3 sm:p-4 md:p-6 lg:p-8 font-poppins relative overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <img 
          src={barbershopBg} 
          alt="Barbearia" 
          className="w-full h-full object-cover"
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-urbana-black/85 via-urbana-black/80 to-urbana-brown/75" />
      </div>

      {/* Animated background effects */}
      <div className="absolute inset-0 overflow-hidden z-0">
        <div className="absolute top-1/4 right-1/4 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-urbana-gold/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-urbana-gold-vibrant/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
      </div>

      {/* Header */}
      {(title || showBackButton) && (
        <div className="relative z-10 flex items-center justify-between mb-4 sm:mb-6">
          {/* Back Button */}
          {showBackButton ? (
            <Button
              onClick={handleBack}
              variant="ghost"
              size="lg"
              className="h-10 sm:h-12 md:h-14 px-3 sm:px-4 md:px-6 text-sm sm:text-base md:text-lg text-urbana-light hover:text-urbana-gold hover:bg-urbana-gold/10 transition-all duration-200"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Voltar</span>
            </Button>
          ) : (
            <div className="w-12 sm:w-16 md:w-24" />
          )}

          {/* Title */}
          {title && (
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-urbana-light text-center flex-1 drop-shadow-lg">
              {title}
            </h1>
          )}

          {/* Header Right */}
          {headerRight ? (
            <div className="flex items-center">
              {headerRight}
            </div>
          ) : (
            <div className="w-12 sm:w-16 md:w-24" />
          )}
        </div>
      )}

      {/* Subtitle */}
      {subtitle && (
        <p className="relative z-10 text-center text-sm sm:text-base md:text-lg text-urbana-light/70 mb-4 sm:mb-6 drop-shadow-md">
          {subtitle}
        </p>
      )}

      {/* Content */}
      <div className={cn(
        'relative z-10 flex-1 overflow-y-auto pb-4 sm:pb-6',
        className
      )}>
        {children}
      </div>
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
      'mx-auto w-full pb-4',
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
      case 2: return 'grid-cols-1 sm:grid-cols-2';
      case 3: return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
      case 4: return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
      default: return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
    }
  };

  const getGapClass = () => {
    switch (gap) {
      case 2: return 'gap-2';
      case 3: return 'gap-3';
      case 4: return 'gap-4';
      case 6: return 'gap-6';
      case 8: return 'gap-8';
      default: return 'gap-4';
    }
  };

  return (
    <div className={cn(
      'grid',
      getGridCols(),
      getGapClass(),
      className
    )}>
      {children}
    </div>
  );
};
