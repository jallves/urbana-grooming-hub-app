import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Scissors, Delete } from 'lucide-react';
import { useTotemAuth } from '@/contexts/TotemAuthContext';

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
      navigate('/totem');
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
        {/* Logo */}
        <div className="flex justify-center mb-4 sm:mb-6 md:mb-8 animate-fade-in">
          <div className="relative">
            <div className="absolute inset-0 bg-urbana-gold blur-3xl opacity-30 animate-pulse" />
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-full bg-gradient-to-br from-urbana-gold to-urbana-gold-dark flex items-center justify-center shadow-2xl border-4 border-urbana-gold/20">
              <Scissors className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 text-urbana-black" />
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="text-center space-y-2 sm:space-y-3 animate-fade-in">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-urbana-light">
            Acesso ao Totem
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-urbana-light/60">
            Digite o PIN de 4 dígitos
          </p>
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
