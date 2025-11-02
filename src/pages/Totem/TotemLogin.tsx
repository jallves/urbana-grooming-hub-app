import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Scissors, Delete, Sparkles } from 'lucide-react';
import { useTotemAuth } from '@/contexts/TotemAuthContext';
import costaUrbanaLogo from '@/assets/costa-urbana-logo.png';

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
    <div className="fixed inset-0 w-screen h-screen bg-urbana-black flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 lg:p-12 relative font-poppins overflow-hidden">
      {/* Background texture effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-urbana-black via-urbana-brown/20 to-urbana-black opacity-50" />
      
      <div className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl space-y-6 sm:space-y-8 md:space-y-10 z-10">
        {/* Logo da Costa Urbana */}
        <div className="flex justify-center mb-4 sm:mb-6 md:mb-8 animate-fade-in">
          <div className="relative group">
            {/* Glow effect animado */}
            <div className="absolute inset-0 bg-gradient-to-br from-urbana-gold via-urbana-gold-vibrant to-urbana-gold blur-3xl opacity-40 animate-pulse group-hover:opacity-60 transition-opacity" />
            <div className="absolute -inset-4 bg-gradient-to-br from-urbana-gold/20 via-transparent to-urbana-gold-vibrant/20 blur-2xl opacity-50" />
            
            {/* Logo container */}
            <div className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 lg:w-56 lg:h-56 p-4 rounded-3xl bg-urbana-black/50 backdrop-blur-sm border-2 border-urbana-gold/30 shadow-2xl overflow-hidden group-hover:border-urbana-gold/60 transition-all duration-300">
              {/* Inner glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-urbana-gold/10 via-transparent to-transparent opacity-80" />
              
              {/* Logo */}
              <img 
                src={costaUrbanaLogo} 
                alt="Costa Urbana Barbearia" 
                className="relative w-full h-full object-contain drop-shadow-2xl group-hover:scale-105 transition-transform duration-300"
              />
              
              {/* Sparkle effects */}
              <Sparkles className="absolute top-2 right-2 w-6 h-6 text-urbana-gold opacity-0 group-hover:opacity-100 animate-pulse transition-opacity" />
              <Sparkles className="absolute bottom-2 left-2 w-4 h-4 text-urbana-gold-vibrant opacity-0 group-hover:opacity-100 animate-pulse transition-opacity" style={{ animationDelay: '0.5s' }} />
            </div>
          </div>
        </div>

        {/* Title - Mais sofisticado */}
        <div className="text-center space-y-3 sm:space-y-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-urbana-gold/10 border border-urbana-gold/30 rounded-full mb-2">
            <div className="w-2 h-2 bg-urbana-gold rounded-full animate-pulse" />
            <span className="text-xs sm:text-sm text-urbana-gold font-medium uppercase tracking-wider">Sistema Exclusivo</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-urbana-light via-urbana-gold-light to-urbana-light animate-shimmer" style={{ backgroundSize: '200% auto' }}>
            Autenticação de Acesso
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-urbana-light/70 font-light">
            Insira o PIN de segurança para acessar o sistema
          </p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <div className="h-px w-8 bg-gradient-to-r from-transparent via-urbana-gold to-urbana-gold" />
            <Sparkles className="w-3 h-3 text-urbana-gold animate-pulse" />
            <div className="h-px w-8 bg-gradient-to-l from-transparent via-urbana-gold to-urbana-gold" />
          </div>
        </div>

        {/* PIN Card */}
        <Card className="p-4 sm:p-6 md:p-8 lg:p-10 bg-card/50 backdrop-blur-sm border-urbana-gray/30 shadow-2xl">
          {/* PIN Display */}
          <div className="mb-6 sm:mb-8 md:mb-10">
            <div className="flex justify-center gap-3 sm:gap-4 md:gap-5">
              {[0, 1, 2, 3].map((index) => (
                <div
                  key={index}
                  className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-xl sm:rounded-2xl border-2 border-urbana-gray/50 bg-urbana-black/50 flex items-center justify-center transition-all duration-200 active:scale-95 active:border-urbana-gold"
                >
                  {pin[index] && (
                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-urbana-gold shadow-lg shadow-urbana-gold/50 animate-fade-in" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <Button
                key={num}
                onClick={() => handleNumberClick(num.toString())}
                variant="outline"
                className="h-14 sm:h-16 md:h-20 lg:h-24 text-2xl sm:text-3xl md:text-4xl font-bold bg-urbana-black/50 active:bg-urbana-gold/30 border-urbana-gray/30 active:border-urbana-gold text-urbana-light active:text-urbana-gold transition-all duration-100 active:scale-95"
                disabled={isLoading}
              >
                {num}
              </Button>
            ))}
            <Button
              onClick={handleClear}
              variant="outline"
              className="h-14 sm:h-16 md:h-20 lg:h-24 text-sm sm:text-base md:text-lg font-semibold bg-urbana-black/50 active:bg-destructive/30 border-urbana-gray/30 active:border-destructive text-urbana-light active:text-destructive transition-all duration-100 active:scale-95"
              disabled={isLoading}
            >
              Limpar
            </Button>
            <Button
              onClick={() => handleNumberClick('0')}
              variant="outline"
              className="h-14 sm:h-16 md:h-20 lg:h-24 text-2xl sm:text-3xl md:text-4xl font-bold bg-urbana-black/50 active:bg-urbana-gold/30 border-urbana-gray/30 active:border-urbana-gold text-urbana-light active:text-urbana-gold transition-all duration-100 active:scale-95"
              disabled={isLoading}
            >
              0
            </Button>
            <Button
              onClick={handleBackspace}
              variant="outline"
              className="h-14 sm:h-16 md:h-20 lg:h-24 bg-urbana-black/50 active:bg-destructive/30 border-urbana-gray/30 active:border-destructive transition-all duration-100 active:scale-95"
              disabled={isLoading}
            >
              <Delete className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-urbana-light" />
            </Button>
          </div>

          {/* Login Button */}
          <Button
            onClick={handleLogin}
            disabled={pin.length !== 4 || isLoading}
            className="w-full h-14 sm:h-16 md:h-20 lg:h-24 text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-urbana-gold to-urbana-gold-dark text-urbana-black active:from-urbana-gold-dark active:to-urbana-gold shadow-lg shadow-urbana-gold/30 active:shadow-urbana-gold/50 transition-all duration-100 disabled:opacity-50 disabled:cursor-not-allowed active:scale-98"
          >
            {isLoading ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-5 h-5 sm:w-6 sm:h-6 border-3 border-urbana-black/30 border-t-urbana-black rounded-full animate-spin" />
                Entrando...
              </div>
            ) : (
              'ENTRAR'
            )}
          </Button>
        </Card>

        {/* Info */}
        <div className="text-center space-y-1 sm:space-y-2 animate-fade-in">
          <p className="text-xs sm:text-sm text-urbana-light/40">
            PIN padrão para demonstração
          </p>
          <p className="text-xl sm:text-2xl md:text-3xl font-mono font-bold text-urbana-gold">
            1 2 3 4
          </p>
        </div>
      </div>
    </div>
  );
};

export default TotemLogin;
