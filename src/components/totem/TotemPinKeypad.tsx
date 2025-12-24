import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Delete, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import costaUrbanaLogo from '@/assets/logo-costa-urbana.png';
import barbershopBg from '@/assets/barbershop-background.jpg';

type TotemKeypadMode = 'pin' | 'phone';

interface TotemPinKeypadProps {
  mode?: TotemKeypadMode;
  title?: string;
  subtitle?: string;
  pinLength?: number;
  phoneLength?: number;
  onSubmit: (value: string) => void | Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  showDemoPin?: boolean;
  submitButtonText?: string;
}

/**
 * TotemPinKeypad - Teclado numérico PADRÃO do Totem com logo e cantos decorativos
 * Usado em TODAS as telas: Login, Check-in, Checkout, Produtos, Novo Agendamento
 * 
 * OTIMIZADO PARA TOUCH: 
 * - Resposta instantânea via onTouchStart/onPointerDown
 * - Debounce reduzido para 80ms
 * - Feedback visual imediato
 * - Prevenção de eventos duplicados
 * 
 * Modos disponíveis:
 * - 'pin': Para autenticação (4 dígitos)
 * - 'phone': Para busca de cliente (11 dígitos)
 * 
 * Segue o design system em docs/TOTEM_DESIGN_SYSTEM.md
 */
export const TotemPinKeypad: React.FC<TotemPinKeypadProps> = ({
  mode = 'pin',
  title = 'Autenticação de Acesso',
  subtitle = 'Insira o PIN de segurança para acessar o sistema',
  pinLength = 4,
  phoneLength = 11,
  onSubmit,
  onCancel,
  loading = false,
  showDemoPin = false,
  submitButtonText,
}) => {
  const [value, setValue] = useState<string>('');
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const lastEventTime = useRef<number>(0);
  const isProcessing = useRef<boolean>(false);
  const DEBOUNCE_MS = 80; // Reduzido de 150ms para 80ms - resposta mais rápida
  const maxLength = mode === 'pin' ? pinLength : phoneLength;
  const minLength = maxLength;

  // Preload para evitar delay inicial
  useEffect(() => {
    // Força o navegador a preparar as animações
    const buttons = document.querySelectorAll('[data-keypad-button]');
    buttons.forEach(btn => {
      (btn as HTMLElement).style.willChange = 'transform, background-color';
    });
    
    return () => {
      buttons.forEach(btn => {
        (btn as HTMLElement).style.willChange = 'auto';
      });
    };
  }, []);

  // Verifica se deve processar o evento (debounce otimizado)
  const shouldProcessEvent = useCallback(() => {
    const now = Date.now();
    if (isProcessing.current || now - lastEventTime.current < DEBOUNCE_MS) {
      return false;
    }
    isProcessing.current = true;
    lastEventTime.current = now;
    // Reset processing flag após um curto delay
    requestAnimationFrame(() => {
      isProcessing.current = false;
    });
    return true;
  }, []);

  // Handler INSTANTÂNEO para touch - resposta imediata
  const handleKeyPress = useCallback((num: number, e?: React.SyntheticEvent) => {
    // Prevenir comportamento padrão e propagação imediatamente
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!shouldProcessEvent() || loading) return;
    
    // Feedback visual INSTANTÂNEO
    setActiveKey(num.toString());
    
    // Atualizar valor
    setValue(prev => {
      if (prev.length < maxLength) {
        return prev + num.toString();
      }
      return prev;
    });
    
    // Remover feedback visual
    setTimeout(() => setActiveKey(null), 80);
  }, [shouldProcessEvent, loading, maxLength]);

  const handleBackspace = useCallback((e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!shouldProcessEvent() || loading) return;
    
    setActiveKey('backspace');
    setValue(prev => prev.slice(0, -1));
    setTimeout(() => setActiveKey(null), 80);
  }, [shouldProcessEvent, loading]);

  const handleClear = useCallback((e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!shouldProcessEvent() || loading) return;
    
    setActiveKey('clear');
    setValue('');
    setTimeout(() => setActiveKey(null), 80);
  }, [shouldProcessEvent, loading]);

  const handleSubmit = useCallback(async (e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!shouldProcessEvent() || loading) return;
    
    if (value.length >= minLength) {
      await onSubmit(value);
    }
  }, [shouldProcessEvent, loading, value, minLength, onSubmit]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key >= '0' && e.key <= '9') {
      handleKeyPress(parseInt(e.key));
    } else if (e.key === 'Backspace') {
      handleBackspace();
    } else if (e.key === 'Enter' && value.length >= minLength) {
      handleSubmit();
    }
  };

  const formatDisplay = () => {
    if (mode === 'pin') {
      // PIN: Mostrar círculos
      return Array.from({ length: maxLength }, (_, i) => (
        <div
          key={i}
          className={cn(
            'w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 rounded-full border-3 transition-all duration-200',
            i < value.length
              ? 'bg-urbana-gold border-urbana-gold shadow-lg shadow-urbana-gold/50'
              : 'border-urbana-gold/30 bg-transparent'
          )}
        />
      ));
    } else {
      // TELEFONE: Mostrar números formatados
      const formatted = formatPhone(value);
      return (
        <p className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-mono font-bold text-urbana-gold tracking-wider drop-shadow-lg">
          {formatted || '(  )      -    '}
        </p>
      );
    }
  };

  const formatPhone = (val: string) => {
    if (val.length <= 2) return val;
    if (val.length <= 7) return `(${val.slice(0, 2)}) ${val.slice(2)}`;
    return `(${val.slice(0, 2)}) ${val.slice(2, 7)}-${val.slice(7, 11)}`;
  };

  const getSubmitButtonText = () => {
    if (submitButtonText) return submitButtonText;
    if (loading) return mode === 'pin' ? 'PROCESSANDO...' : 'BUSCANDO...';
    return mode === 'pin' ? 'ENTRAR' : 'BUSCAR';
  };

  return (
    <div 
      className="fixed inset-0 w-screen h-screen flex items-center justify-center p-3 sm:p-4 md:p-6 font-poppins overflow-hidden"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      style={{
        backgroundImage: `url(${barbershopBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-urbana-black/85 via-urbana-black/80 to-urbana-brown/75" />

      {/* Premium background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-urbana-gold/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-urbana-gold-vibrant/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 w-full max-w-md sm:max-w-lg md:max-w-2xl space-y-4 sm:space-y-6">
        {/* Logo com cantos decorativos - PADRÃO DO TOTEM */}
        <div className="flex justify-center mb-4 sm:mb-6 animate-scale-in">
          <div className="relative group">
            {/* Multiple glow layers */}
            <div className="absolute -inset-4 bg-gradient-to-br from-urbana-gold via-urbana-gold-vibrant to-transparent blur-2xl opacity-40" />
            <div className="absolute -inset-6 bg-urbana-gold/20 blur-3xl opacity-30" />
            
            {/* Logo container */}
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 p-4 sm:p-5 md:p-6 rounded-2xl bg-urbana-black-soft/80 backdrop-blur-sm border-2 border-urbana-gold/50 shadow-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-urbana-gold/20 via-transparent to-transparent" />
              
              {/* Logo */}
              <img 
                src={costaUrbanaLogo} 
                alt="Costa Urbana" 
                className="relative w-full h-full object-contain drop-shadow-2xl"
              />
              
              {/* Cantos decorativos - OBRIGATÓRIOS */}
              <div className="absolute -top-1 -left-1 w-4 h-4 sm:w-5 sm:h-5 border-t-2 border-l-2 border-urbana-gold rounded-tl-lg" />
              <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 border-t-2 border-r-2 border-urbana-gold rounded-tr-lg" />
              <div className="absolute -bottom-1 -left-1 w-4 h-4 sm:w-5 sm:h-5 border-b-2 border-l-2 border-urbana-gold rounded-bl-lg" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 border-b-2 border-r-2 border-urbana-gold rounded-br-lg" />
            </div>

            {/* Badge "SISTEMA EXCLUSIVO" - OBRIGATÓRIO */}
            <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
              <div className="px-3 py-1 sm:px-4 sm:py-1.5 bg-urbana-gold/20 backdrop-blur-sm border border-urbana-gold/50 rounded-full shadow-lg">
                <p className="text-[10px] sm:text-xs font-bold text-urbana-gold uppercase tracking-wider">
                  Sistema Exclusivo
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Title & Subtitle */}
        <div className="text-center space-y-2 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-urbana-light drop-shadow-lg">
            {title}
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-urbana-light/70 drop-shadow-md">
            {subtitle}
          </p>
        </div>

        {/* Card principal com glassmorphism transparente */}
        <Card className="bg-transparent backdrop-blur-xl border-2 border-urbana-gold/30 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 animate-scale-in" style={{ animationDelay: '0.3s' }}>
          
          {/* Display de PIN ou Telefone */}
          <div className="bg-urbana-black/60 border-2 border-urbana-gold/40 rounded-xl p-4 sm:p-5 md:p-6">
            {mode === 'phone' && (
              <div className="flex items-center justify-center gap-2 mb-3">
                <Phone className="w-5 h-5 sm:w-6 sm:h-6 text-urbana-gold" />
                <span className="text-sm sm:text-base text-urbana-light/70">Telefone</span>
              </div>
            )}
            <div className="flex items-center justify-center gap-2 sm:gap-3 min-h-[32px] sm:min-h-[40px]">
              {formatDisplay()}
            </div>
          </div>

          {/* Demo PIN */}
          {showDemoPin && mode === 'pin' && (
            <div className="text-center">
              <p className="text-xs sm:text-sm text-urbana-light/50">
                PIN de demonstração: <span className="text-urbana-gold font-bold">1234</span>
              </p>
            </div>
          )}

          {/* Teclado Numérico ULTRA OTIMIZADO para touch */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 touch-manipulation">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                data-keypad-button
                onPointerDown={(e) => handleKeyPress(num, e)}
                onTouchStart={(e) => { e.preventDefault(); handleKeyPress(num, e); }}
                disabled={loading}
                className={cn(
                  "h-16 sm:h-18 md:h-22 lg:h-26 min-h-[64px] text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-urbana-gold bg-transparent border-2 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed select-none touch-manipulation cursor-pointer",
                  "transition-transform duration-[50ms] ease-out",
                  activeKey === num.toString()
                    ? "border-urbana-gold bg-urbana-gold/30 scale-95"
                    : "border-urbana-gold/40 hover:border-urbana-gold/60 hover:bg-urbana-gold/10"
                )}
                style={{ 
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation',
                  userSelect: 'none',
                  WebkitUserSelect: 'none'
                }}
              >
                {num}
              </button>
            ))}

            {/* Botão Limpar */}
            <button
              data-keypad-button
              onPointerDown={handleClear}
              onTouchStart={(e) => { e.preventDefault(); handleClear(e); }}
              disabled={loading}
              className={cn(
                "h-16 sm:h-18 md:h-22 lg:h-26 min-h-[64px] text-xs sm:text-sm md:text-base font-bold text-urbana-light bg-transparent border-2 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed select-none touch-manipulation cursor-pointer",
                "transition-transform duration-[50ms] ease-out",
                activeKey === 'clear'
                  ? "border-urbana-gray bg-urbana-gray/30 scale-95"
                  : "border-urbana-gray/40 hover:border-urbana-gray/60 hover:bg-urbana-gray/10"
              )}
              style={{ 
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
                userSelect: 'none',
                WebkitUserSelect: 'none'
              }}
            >
              Limpar
            </button>

            {/* Botão 0 */}
            <button
              data-keypad-button
              onPointerDown={(e) => handleKeyPress(0, e)}
              onTouchStart={(e) => { e.preventDefault(); handleKeyPress(0, e); }}
              disabled={loading}
              className={cn(
                "h-16 sm:h-18 md:h-22 lg:h-26 min-h-[64px] text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-urbana-gold bg-transparent border-2 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed select-none touch-manipulation cursor-pointer",
                "transition-transform duration-[50ms] ease-out",
                activeKey === '0'
                  ? "border-urbana-gold bg-urbana-gold/30 scale-95"
                  : "border-urbana-gold/40 hover:border-urbana-gold/60 hover:bg-urbana-gold/10"
              )}
              style={{ 
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
                userSelect: 'none',
                WebkitUserSelect: 'none'
              }}
            >
              0
            </button>

            {/* Botão Backspace */}
            <button
              data-keypad-button
              onPointerDown={handleBackspace}
              onTouchStart={(e) => { e.preventDefault(); handleBackspace(e); }}
              disabled={loading}
              className={cn(
                "h-16 sm:h-18 md:h-22 lg:h-26 min-h-[64px] flex items-center justify-center text-urbana-light bg-transparent border-2 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed select-none touch-manipulation cursor-pointer",
                "transition-transform duration-[50ms] ease-out",
                activeKey === 'backspace'
                  ? "border-urbana-gray bg-urbana-gray/30 scale-95"
                  : "border-urbana-gray/40 hover:border-urbana-gray/60 hover:bg-urbana-gray/10"
              )}
              style={{ 
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
                userSelect: 'none',
                WebkitUserSelect: 'none'
              }}
            >
              <Delete className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />
            </button>
          </div>

          {/* Botão ENTRAR/BUSCAR em destaque - OTIMIZADO */}
          <button
            data-keypad-button
            onPointerDown={handleSubmit}
            onTouchStart={(e) => { e.preventDefault(); handleSubmit(e); }}
            disabled={value.length < minLength || loading}
            className={cn(
              "w-full h-16 sm:h-18 md:h-22 min-h-[64px] text-lg sm:text-xl md:text-2xl font-black rounded-xl select-none touch-manipulation cursor-pointer",
              "transition-transform duration-[50ms] ease-out",
              "shadow-2xl shadow-urbana-gold/40",
              value.length >= minLength && !loading
                ? "bg-gradient-to-r from-urbana-gold via-urbana-gold-vibrant to-urbana-gold text-urbana-black active:scale-[0.98]"
                : "bg-gradient-to-r from-urbana-gray to-urbana-gray-light text-urbana-light/40 cursor-not-allowed"
            )}
            style={{ 
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation',
              userSelect: 'none',
              WebkitUserSelect: 'none'
            }}
          >
            {getSubmitButtonText()}
          </button>

          {/* Botão Cancelar (opcional) - OTIMIZADO */}
          {onCancel && (
            <button
              data-keypad-button
              onPointerDown={(e) => { e.preventDefault(); onCancel(); }}
              onTouchStart={(e) => { e.preventDefault(); onCancel(); }}
              disabled={loading}
              className="w-full h-14 sm:h-16 min-h-[56px] text-base sm:text-lg text-urbana-light/60 hover:text-urbana-light hover:bg-urbana-gold/10 select-none touch-manipulation cursor-pointer bg-transparent border-none transition-colors duration-100"
              style={{ 
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
                userSelect: 'none',
                WebkitUserSelect: 'none'
              }}
            >
              Cancelar
            </button>
          )}
        </Card>
      </div>
    </div>
  );
};
