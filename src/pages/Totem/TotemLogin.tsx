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
    <div className="fixed inset-0 w-screen h-screen bg-urbana-black flex flex-col items-center justify-center p-2 sm:p-4 md:p-6 relative font-poppins overflow-hidden">
      {/* Background texture effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-urbana-black via-urbana-brown/20 to-urbana-black opacity-50" />
      
      <div className="w-full max-w-sm sm:max-w-md md:max-w-lg space-y-3 sm:space-y-5 md:space-y-7 z-10">
        {/* Logo da Costa Urbana */}
        <div className="flex justify-center mb-2 sm:mb-4 animate-fade-in">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-urbana-gold via-urbana-gold-vibrant to-urbana-gold blur-3xl opacity-40 animate-pulse" />
            
            {/* Logo container */}
            <div className="relative w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36 p-2 sm:p-3 md:p-4 rounded-2xl bg-urbana-black/50 backdrop-blur-sm border-2 border-urbana-gold/30 shadow-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-urbana-gold/10 via-transparent to-transparent opacity-80" />
              
              <img 
                src={costaUrbanaLogo} 
                alt="Costa Urbana Barbearia" 
                className="relative w-full h-full object-contain drop-shadow-2xl"
              />
            </div>
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
        <Card className="p-2 sm:p-4 md:p-6 bg-card/50 backdrop-blur-sm border-urbana-gold/20 shadow-2xl">
          {/* PIN Display */}
          <div className="mb-3 sm:mb-5 md:mb-7">
            <div className="flex justify-center gap-2 sm:gap-3 md:gap-4">
              {[0, 1, 2, 3].map((index) => (
                <div
                  key={index}
                  className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-lg sm:rounded-xl border-2 border-urbana-gold/30 bg-urbana-black/50 flex items-center justify-center transition-all duration-200 active:scale-95 active:border-urbana-gold shadow-lg shadow-urbana-gold/10"
                >
                  {pin[index] && (
                    <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-urbana-gold shadow-lg shadow-urbana-gold/50 animate-fade-in" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 md:gap-3 mb-2 sm:mb-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <Button
                key={num}
                onClick={() => handleNumberClick(num.toString())}
                variant="outline"
                className="h-10 sm:h-14 md:h-16 lg:h-20 text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-br from-urbana-black-soft/80 to-urbana-black/90 active:from-urbana-gold/30 active:to-urbana-gold-vibrant/30 border-2 border-urbana-gold/30 active:border-urbana-gold text-urbana-light active:text-urbana-gold transition-all duration-100 active:scale-95 rounded-lg shadow-lg shadow-urbana-gold/10"
                disabled={isLoading}
              >
                {num}
              </Button>
            ))}
            <Button
              onClick={handleClear}
              variant="outline"
              className="h-10 sm:h-14 md:h-16 lg:h-20 text-xs sm:text-sm md:text-base font-semibold bg-gradient-to-br from-red-500/20 to-red-600/20 active:from-red-500/40 active:to-red-600/40 border-2 border-red-500/40 active:border-red-500 text-red-300 active:text-red-100 transition-all duration-100 active:scale-95 rounded-lg shadow-lg shadow-red-500/10"
              disabled={isLoading}
            >
              Limpar
            </Button>
            <Button
              onClick={() => handleNumberClick('0')}
              variant="outline"
              className="h-10 sm:h-14 md:h-16 lg:h-20 text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-br from-urbana-black-soft/80 to-urbana-black/90 active:from-urbana-gold/30 active:to-urbana-gold-vibrant/30 border-2 border-urbana-gold/30 active:border-urbana-gold text-urbana-light active:text-urbana-gold transition-all duration-100 active:scale-95 rounded-lg shadow-lg shadow-urbana-gold/10"
              disabled={isLoading}
            >
              0
            </Button>
            <Button
              onClick={handleBackspace}
              variant="outline"
              className="h-10 sm:h-14 md:h-16 lg:h-20 bg-gradient-to-br from-orange-500/20 to-orange-600/20 active:from-orange-500/40 active:to-orange-600/40 border-2 border-orange-500/40 active:border-orange-500 text-orange-300 active:text-orange-100 transition-all duration-100 active:scale-95 rounded-lg shadow-lg shadow-orange-500/10"
              disabled={isLoading}
            >
              <Delete className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-urbana-light" />
            </Button>
          </div>

          {/* Login Button */}
          <Button
            onClick={handleLogin}
            disabled={pin.length !== 4 || isLoading}
            className="w-full h-10 sm:h-14 md:h-16 lg:h-20 text-base sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-urbana-gold to-urbana-gold-dark text-urbana-black active:from-urbana-gold-dark active:to-urbana-gold shadow-lg shadow-urbana-gold/30 active:shadow-urbana-gold/50 transition-all duration-100 disabled:opacity-50 disabled:cursor-not-allowed active:scale-98"
          >
            {isLoading ? (
              <div className="flex items-center gap-1 sm:gap-2">
                <div className="w-4 h-4 sm:w-5 sm:h-5 border-3 border-urbana-black/30 border-t-urbana-black rounded-full animate-spin" />
                Entrando...
              </div>
            ) : (
              'ENTRAR'
            )}
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
