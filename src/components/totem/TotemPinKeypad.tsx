import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Delete } from 'lucide-react';
import { cn } from '@/lib/utils';
import costaUrbanaLogo from '@/assets/logo-costa-urbana.png';
import barbershopBg from '@/assets/barbershop-background.jpg';

interface TotemPinKeypadProps {
  title?: string;
  subtitle?: string;
  pinLength?: number;
  onSubmit: (pin: string) => void;
  onCancel?: () => void;
  loading?: boolean;
  showDemoPin?: boolean;
}

/**
 * TotemPinKeypad - Teclado numérico com logo padrão do Totem
 * Usado em todas as telas que precisam de autenticação/PIN
 * 
 * Segue o design system em docs/TOTEM_DESIGN_SYSTEM.md
 * 
 * @example
 * ```tsx
 * <TotemPinKeypad
 *   title="Autenticação de Acesso"
 *   subtitle="Insira o PIN de segurança"
 *   onSubmit={(pin) => console.log(pin)}
 *   pinLength={4}
 * />
 * ```
 */
export const TotemPinKeypad: React.FC<TotemPinKeypadProps> = ({
  title = 'Autenticação de Acesso',
  subtitle = 'Insira o PIN de segurança para acessar o sistema',
  pinLength = 4,
  onSubmit,
  onCancel,
  loading = false,
  showDemoPin = false,
}) => {
  const [pin, setPin] = useState<string[]>([]);

  const handleKeyPress = (num: number) => {
    if (pin.length < pinLength) {
      setPin([...pin, num.toString()]);
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
  };

  const handleClear = () => {
    setPin([]);
  };

  const handleSubmit = () => {
    if (pin.length === pinLength) {
      onSubmit(pin.join(''));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key >= '0' && e.key <= '9') {
      handleKeyPress(parseInt(e.key));
    } else if (e.key === 'Backspace') {
      handleBackspace();
    } else if (e.key === 'Enter' && pin.length === pinLength) {
      handleSubmit();
    }
  };

  return (
    <div 
      className="fixed inset-0 w-screen h-screen flex items-center justify-center p-4 font-poppins relative overflow-hidden"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <img 
          src={barbershopBg} 
          alt="Barbearia" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-urbana-black/90 via-urbana-black/85 to-urbana-brown/80" />
      </div>

      {/* Animated background effects */}
      <div className="absolute inset-0 overflow-hidden z-0">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-urbana-gold/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-urbana-gold-vibrant/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 w-full max-w-md space-y-6 animate-scale-in">
        {/* Logo com borda dourada */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            {/* Cantos decorativos */}
            <div className="absolute -top-2 -left-2 w-6 h-6 border-l-2 border-t-2 border-urbana-gold" />
            <div className="absolute -top-2 -right-2 w-6 h-6 border-r-2 border-t-2 border-urbana-gold" />
            <div className="absolute -bottom-2 -left-2 w-6 h-6 border-l-2 border-b-2 border-urbana-gold" />
            <div className="absolute -bottom-2 -right-2 w-6 h-6 border-r-2 border-b-2 border-urbana-gold" />
            
            <img 
              src={costaUrbanaLogo} 
              alt="Costa Urbana" 
              className="w-32 h-32 object-contain"
            />
          </div>
        </div>

        {/* Badge Sistema Exclusivo */}
        <div className="flex justify-center">
          <div className="px-4 py-1 bg-urbana-gold/20 border border-urbana-gold/50 rounded-full backdrop-blur-sm">
            <p className="text-xs text-urbana-gold uppercase tracking-wider flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-urbana-gold animate-pulse" />
              SISTEMA EXCLUSIVO
            </p>
          </div>
        </div>

        {/* Título */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold text-urbana-light drop-shadow-lg">
            {title}
          </h1>
          <p className="text-base sm:text-lg text-urbana-light/70">
            {subtitle}
          </p>
        </div>

        {/* Card do Teclado */}
        <Card className="bg-white/5 backdrop-blur-2xl border-2 border-urbana-gold/40 rounded-2xl p-6 space-y-6 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          {/* Campos de PIN */}
          <div className="flex justify-center gap-3">
            {Array.from({ length: pinLength }).map((_, i) => (
              <div 
                key={i}
                className={cn(
                  "w-14 h-14 border-2 rounded-lg flex items-center justify-center transition-all duration-200",
                  pin[i] 
                    ? "border-urbana-gold bg-urbana-gold/10 shadow-[0_0_20px_rgba(212,175,55,0.3)]" 
                    : "border-urbana-gold/50 bg-urbana-black/40"
                )}
              >
                {pin[i] && (
                  <div className="w-3 h-3 rounded-full bg-urbana-gold animate-scale-in shadow-lg shadow-urbana-gold/50" />
                )}
              </div>
            ))}
          </div>

          {/* Teclado Numérico */}
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <Button
                key={num}
                onClick={() => handleKeyPress(num)}
                disabled={loading}
                className={cn(
                  "h-16 text-2xl font-bold transition-all duration-200",
                  "bg-urbana-black/60 border-2 border-urbana-gold/40",
                  "text-urbana-gold hover:bg-urbana-gold/20 hover:border-urbana-gold",
                  "active:scale-95 hover:scale-105",
                  "shadow-lg hover:shadow-[0_0_20px_rgba(212,175,55,0.3)]"
                )}
              >
                {num}
              </Button>
            ))}

            {/* Botão Limpar */}
            <Button
              onClick={handleClear}
              disabled={loading || pin.length === 0}
              className={cn(
                "h-16 text-lg font-bold transition-all duration-200",
                "bg-urbana-black/60 border-2 border-urbana-gold/40",
                "text-urbana-gold hover:bg-urbana-gold/20 hover:border-urbana-gold",
                "active:scale-95 disabled:opacity-50"
              )}
            >
              Limpar
            </Button>

            {/* Botão 0 */}
            <Button
              onClick={() => handleKeyPress(0)}
              disabled={loading}
              className={cn(
                "h-16 text-2xl font-bold transition-all duration-200",
                "bg-urbana-black/60 border-2 border-urbana-gold/40",
                "text-urbana-gold hover:bg-urbana-gold/20 hover:border-urbana-gold",
                "active:scale-95 hover:scale-105",
                "shadow-lg hover:shadow-[0_0_20px_rgba(212,175,55,0.3)]"
              )}
            >
              0
            </Button>

            {/* Botão Backspace */}
            <Button
              onClick={handleBackspace}
              disabled={loading || pin.length === 0}
              className={cn(
                "h-16 transition-all duration-200",
                "bg-urbana-black/60 border-2 border-urbana-gold/40",
                "text-urbana-gold hover:bg-urbana-gold/20 hover:border-urbana-gold",
                "active:scale-95 disabled:opacity-50"
              )}
            >
              <Delete className="w-6 h-6" />
            </Button>
          </div>

          {/* Botão Entrar */}
          <Button
            onClick={handleSubmit}
            disabled={pin.length < pinLength || loading}
            className={cn(
              "w-full h-14 text-xl font-bold transition-all duration-300",
              "bg-gradient-to-r from-urbana-gold to-urbana-gold-light",
              "text-urbana-black",
              "hover:scale-105 active:scale-95",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "shadow-[0_8px_24px_rgba(212,175,55,0.4)]",
              "hover:shadow-[0_12px_32px_rgba(212,175,55,0.6)]"
            )}
          >
            {loading ? 'PROCESSANDO...' : 'ENTRAR'}
          </Button>

          {/* Botão Cancelar (opcional) */}
          {onCancel && (
            <Button
              onClick={onCancel}
              disabled={loading}
              variant="outline"
              className={cn(
                "w-full h-12 text-base",
                "border-2 border-urbana-gold/40 bg-white/5",
                "text-urbana-light hover:bg-white/10"
              )}
            >
              Cancelar
            </Button>
          )}
        </Card>

        {/* PIN de demonstração */}
        {showDemoPin && (
          <p className="text-center text-sm text-urbana-light/40 animate-fade-in">
            PIN padrão para demonstração: 1 2 3 4
          </p>
        )}
      </div>
    </div>
  );
};

export default TotemPinKeypad;
