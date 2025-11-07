import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Scissors, Delete, Sparkles } from 'lucide-react';
import { useTotemAuth } from '@/contexts/TotemAuthContext';
import costaUrbanaLogo from '@/assets/logo-costa-urbana.png';
import barbershopBg from '@/assets/barbershop-background.jpg';

const TotemLogin: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useTotemAuth();
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleNumberClick = (num: string) => {
    if (pin.length < 4) {
      setPin(pin + num);
    }
  };

  const handleClear = () => {
    setPin('');
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
  };

  const handleLogin = async () => {
    if (pin.length !== 4) {
      return;
    }

    setIsLoading(true);
    const success = await login(pin);
    setIsLoading(false);

    if (success) {
      // Redirecionar para tela de boas-vindas
      navigate('/totem/welcome', {
        state: { staffName: 'Equipe Costa Urbana' }
      });
    } else {
      setPin('');
    }
  };

  // Add totem-mode class to html element for touch optimization
  useEffect(() => {
    document.documentElement.classList.add('totem-mode');
    return () => {
      document.documentElement.classList.remove('totem-mode');
    };
  }, []);

  return (
    <div className="fixed inset-0 w-screen h-screen flex flex-col items-center justify-center p-2 sm:p-4 md:p-6 relative font-poppins overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <img 
          src={barbershopBg} 
          alt="Barbearia" 
          className="w-full h-full object-cover"
        />
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-urbana-black/85 via-urbana-black/80 to-urbana-brown/75" />
      </div>

      {/* Premium background effects with depth */}
      <div className="absolute inset-0 overflow-hidden z-0">
        <div className="absolute top-0 left-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-urbana-gold/10 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-urbana-gold-vibrant/10 rounded-full blur-3xl opacity-40" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(197, 161, 91, 0.15) 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>
      </div>
      
      <div className="w-full max-w-sm sm:max-w-md md:max-w-lg space-y-3 sm:space-y-5 md:space-y-7 z-10">
        {/* Logo da Costa Urbana */}
        <div className="flex justify-center mb-2 sm:mb-4 animate-fade-in">
          <div className="relative group w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 lg:w-40 lg:h-40">
            {/* Multi-layered glow for depth */}
            <div className="absolute -inset-4 bg-gradient-to-br from-urbana-gold via-urbana-gold-vibrant to-transparent blur-2xl opacity-30" />
            <div className="absolute -inset-6 bg-urbana-gold/20 blur-3xl opacity-20" />
            
            {/* Premium border frame */}
            <div className="absolute inset-0 rounded-2xl border-2 border-urbana-gold/30" />
            
            <img 
              src={costaUrbanaLogo} 
              alt="Costa Urbana Logo" 
              className="relative w-full h-full object-contain transition-all duration-300 drop-shadow-2xl"
            />
            
            {/* Corner accents */}
            <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-urbana-gold rounded-tl-lg" />
            <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-urbana-gold rounded-tr-lg" />
            <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-urbana-gold rounded-bl-lg" />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-urbana-gold rounded-br-lg" />
          </div>
        </div>

        {/* Title */}
        <div className="text-center space-y-1 sm:space-y-2 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 bg-urbana-gold/10 border border-urbana-gold/30 rounded-full mb-1">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-urbana-gold rounded-full animate-pulse" />
            <span className="text-[10px] sm:text-xs text-urbana-gold font-medium uppercase tracking-wider">Sistema Exclusivo</span>
          </div>
          <h1 className="text-xl sm:text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-urbana-light via-urbana-gold-light to-urbana-light animate-shimmer" style={{ backgroundSize: '200% auto' }}>
            Autenticação de Acesso
          </h1>
          <p className="text-xs sm:text-base md:text-lg text-urbana-light/70 font-light">
            Insira o PIN de segurança para acessar o sistema
          </p>
        </div>

        {/* PIN Card */}
        <Card className="relative p-2 sm:p-4 md:p-6 bg-urbana-black/40 backdrop-blur-xl border-2 border-urbana-gold/40 shadow-2xl shadow-urbana-gold/20 overflow-hidden">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-urbana-gold/5 via-transparent to-urbana-gold-vibrant/5 pointer-events-none" />
          
          {/* PIN Display */}
          <div className="relative mb-3 sm:mb-5 md:mb-7">
            <div className="flex justify-center gap-2 sm:gap-3 md:gap-4">
              {[0, 1, 2, 3].map((index) => (
                <div
                  key={index}
                  className="relative w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-xl border-2 border-urbana-gold/40 bg-gradient-to-br from-urbana-black/80 to-urbana-black-soft/60 flex items-center justify-center transition-all duration-200 shadow-lg shadow-urbana-gold/20 overflow-hidden group"
                >
                  {/* Inner glow when filled */}
                  {pin[index] && (
                    <div className="absolute inset-0 bg-gradient-to-br from-urbana-gold/20 to-urbana-gold-vibrant/10 animate-fade-in" />
                  )}
                  {pin[index] && (
                    <div className="relative w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 rounded-full bg-gradient-to-br from-urbana-gold via-urbana-gold-vibrant to-urbana-gold-dark shadow-lg shadow-urbana-gold/60 animate-fade-in" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Keypad - Transparent with Black Buttons & Gold Text */}
          <div className="relative grid grid-cols-3 gap-1.5 sm:gap-2 md:gap-3 mb-2 sm:mb-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <Button
                key={num}
                onClick={() => handleNumberClick(num.toString())}
                variant="ghost"
                className="relative h-10 sm:h-14 md:h-16 lg:h-20 text-xl sm:text-2xl md:text-3xl font-bold bg-black/90 hover:bg-black active:bg-black/80 border-2 border-transparent hover:border-urbana-gold/30 active:border-urbana-gold text-urbana-gold hover:text-urbana-gold-light active:text-urbana-gold-vibrant transition-all duration-150 active:scale-95 rounded-xl shadow-2xl overflow-hidden"
                disabled={isLoading}
              >
                <span className="relative drop-shadow-[0_2px_8px_rgba(197,161,91,0.5)]">{num}</span>
              </Button>
            ))}
            <Button
              onClick={handleClear}
              variant="ghost"
              className="relative h-10 sm:h-14 md:h-16 lg:h-20 text-xs sm:text-sm md:text-base font-semibold bg-black/90 hover:bg-black active:bg-black/80 border-2 border-transparent hover:border-red-500/30 active:border-red-500/50 text-urbana-gold hover:text-red-400 active:text-red-300 transition-all duration-150 active:scale-95 rounded-xl shadow-2xl overflow-hidden"
              disabled={isLoading}
            >
              <span className="relative drop-shadow-[0_2px_8px_rgba(197,161,91,0.5)]">Limpar</span>
            </Button>
            <Button
              onClick={() => handleNumberClick('0')}
              variant="ghost"
              className="relative h-10 sm:h-14 md:h-16 lg:h-20 text-xl sm:text-2xl md:text-3xl font-bold bg-black/90 hover:bg-black active:bg-black/80 border-2 border-transparent hover:border-urbana-gold/30 active:border-urbana-gold text-urbana-gold hover:text-urbana-gold-light active:text-urbana-gold-vibrant transition-all duration-150 active:scale-95 rounded-xl shadow-2xl overflow-hidden"
              disabled={isLoading}
            >
              <span className="relative drop-shadow-[0_2px_8px_rgba(197,161,91,0.5)]">0</span>
            </Button>
            <Button
              onClick={handleBackspace}
              variant="ghost"
              className="relative h-10 sm:h-14 md:h-16 lg:h-20 bg-black/90 hover:bg-black active:bg-black/80 border-2 border-transparent hover:border-orange-500/30 active:border-orange-500/50 text-urbana-gold hover:text-orange-400 active:text-orange-300 transition-all duration-150 active:scale-95 rounded-xl shadow-2xl overflow-hidden"
              disabled={isLoading}
            >
              <Delete className="relative w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 drop-shadow-[0_2px_8px_rgba(197,161,91,0.5)]" />
            </Button>
          </div>

          {/* Login Button */}
          <Button
            onClick={handleLogin}
            disabled={pin.length !== 4 || isLoading}
            className="relative w-full h-10 sm:h-14 md:h-16 lg:h-20 text-base sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-urbana-gold via-urbana-gold-vibrant to-urbana-gold-dark hover:from-urbana-gold-dark hover:via-urbana-gold-vibrant hover:to-urbana-gold text-urbana-black shadow-2xl shadow-urbana-gold/40 hover:shadow-urbana-gold/60 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-98 rounded-xl overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
            <span className="relative drop-shadow-lg">
              {isLoading ? (
                <div className="flex items-center gap-1 sm:gap-2">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 border-3 border-urbana-black/30 border-t-urbana-black rounded-full animate-spin" />
                  Entrando...
                </div>
              ) : (
                'ENTRAR'
              )}
            </span>
          </Button>
        </Card>

        {/* Info */}
        <div className="text-center space-y-0.5 sm:space-y-1 animate-fade-in">
          <p className="text-[10px] sm:text-xs text-urbana-light/40">
            PIN padrão para demonstração
          </p>
          <p className="text-base sm:text-xl md:text-2xl font-mono font-bold text-urbana-gold">
            1 2 3 4
          </p>
        </div>
      </div>
    </div>
  );
};

export default TotemLogin;
