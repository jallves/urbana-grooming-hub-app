import React, { useState } from 'react';
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

  return (
    <div className="min-h-screen bg-urbana-black flex flex-col items-center justify-center p-6 relative font-poppins overflow-hidden">
      {/* Background texture effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-urbana-black via-urbana-brown/20 to-urbana-black opacity-50" />
      
      <div className="w-full max-w-lg space-y-10 z-10">
        {/* Logo */}
        <div className="flex justify-center mb-8 animate-fade-in">
          <div className="relative">
            <div className="absolute inset-0 bg-urbana-gold blur-3xl opacity-30 animate-pulse" />
            <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-urbana-gold to-urbana-gold-dark flex items-center justify-center shadow-2xl border-4 border-urbana-gold/20">
              <Scissors className="w-14 h-14 text-urbana-black" />
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="text-center space-y-3 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold text-urbana-light">
            Acesso ao Totem
          </h1>
          <p className="text-lg text-urbana-light/60">
            Digite o PIN de 4 dígitos
          </p>
        </div>

        {/* PIN Card */}
        <Card className="p-10 bg-card/50 backdrop-blur-sm border-urbana-gray/30 shadow-2xl">
          {/* PIN Display */}
          <div className="mb-10">
            <div className="flex justify-center gap-5">
              {[0, 1, 2, 3].map((index) => (
                <div
                  key={index}
                  className="w-20 h-20 rounded-2xl border-2 border-urbana-gray/50 bg-urbana-black/50 flex items-center justify-center transition-all duration-300 hover:border-urbana-gold/50"
                >
                  {pin[index] && (
                    <div className="w-5 h-5 rounded-full bg-urbana-gold shadow-lg shadow-urbana-gold/50 animate-fade-in" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <Button
                key={num}
                onClick={() => handleNumberClick(num.toString())}
                variant="outline"
                className="h-20 text-3xl font-bold bg-urbana-black/50 hover:bg-urbana-gold/20 border-urbana-gray/30 hover:border-urbana-gold text-urbana-light hover:text-urbana-gold transition-all duration-300"
                disabled={isLoading}
              >
                {num}
              </Button>
            ))}
            <Button
              onClick={handleClear}
              variant="outline"
              className="h-20 text-lg font-semibold bg-urbana-black/50 hover:bg-destructive/20 border-urbana-gray/30 hover:border-destructive text-urbana-light hover:text-destructive transition-all duration-300"
              disabled={isLoading}
            >
              Limpar
            </Button>
            <Button
              onClick={() => handleNumberClick('0')}
              variant="outline"
              className="h-20 text-3xl font-bold bg-urbana-black/50 hover:bg-urbana-gold/20 border-urbana-gray/30 hover:border-urbana-gold text-urbana-light hover:text-urbana-gold transition-all duration-300"
              disabled={isLoading}
            >
              0
            </Button>
            <Button
              onClick={handleBackspace}
              variant="outline"
              className="h-20 bg-urbana-black/50 hover:bg-destructive/20 border-urbana-gray/30 hover:border-destructive transition-all duration-300"
              disabled={isLoading}
            >
              <Delete className="w-7 h-7 text-urbana-light hover:text-destructive" />
            </Button>
          </div>

          {/* Login Button */}
          <Button
            onClick={handleLogin}
            disabled={pin.length !== 4 || isLoading}
            className="w-full h-20 text-2xl font-bold bg-gradient-to-r from-urbana-gold to-urbana-gold-dark text-urbana-black hover:from-urbana-gold-dark hover:to-urbana-gold shadow-lg shadow-urbana-gold/30 hover:shadow-urbana-gold/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 border-3 border-urbana-black/30 border-t-urbana-black rounded-full animate-spin" />
                Entrando...
              </div>
            ) : (
              'ENTRAR'
            )}
          </Button>
        </Card>

        {/* Info */}
        <div className="text-center space-y-2 animate-fade-in">
          <p className="text-sm text-urbana-light/40">
            PIN padrão para demonstração
          </p>
          <p className="text-2xl font-mono font-bold text-urbana-gold">
            1 2 3 4
          </p>
        </div>
      </div>
    </div>
  );
};

export default TotemLogin;
