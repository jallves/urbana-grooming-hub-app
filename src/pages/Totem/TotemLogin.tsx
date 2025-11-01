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
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md space-y-6 sm:space-y-8">
        {/* Logo */}
        <div className="flex justify-center mb-6 sm:mb-8">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-urbana-gold flex items-center justify-center">
            <Scissors className="w-10 h-10 sm:w-12 sm:h-12 text-black" />
          </div>
        </div>

        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
            Acesso ao Totem
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground">
            Digite o PIN para acessar
          </p>
        </div>

        {/* PIN Card */}
        <Card className="p-6 sm:p-8 bg-card">
          {/* PIN Display */}
          <div className="mb-6 sm:mb-8">
            <div className="flex justify-center gap-3 sm:gap-4">
              {[0, 1, 2, 3].map((index) => (
                <div
                  key={index}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl border-2 border-border bg-background flex items-center justify-center"
                >
                  {pin[index] && (
                    <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-urbana-gold" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <Button
                key={num}
                onClick={() => handleNumberClick(num.toString())}
                variant="outline"
                className="h-16 sm:h-20 text-2xl sm:text-3xl font-bold hover:bg-urbana-gold/10 hover:border-urbana-gold"
                disabled={isLoading}
              >
                {num}
              </Button>
            ))}
            <Button
              onClick={handleClear}
              variant="outline"
              className="h-16 sm:h-20 text-base sm:text-lg hover:bg-destructive/10 hover:border-destructive hover:text-destructive"
              disabled={isLoading}
            >
              Limpar
            </Button>
            <Button
              onClick={() => handleNumberClick('0')}
              variant="outline"
              className="h-16 sm:h-20 text-2xl sm:text-3xl font-bold hover:bg-urbana-gold/10 hover:border-urbana-gold"
              disabled={isLoading}
            >
              0
            </Button>
            <Button
              onClick={handleBackspace}
              variant="outline"
              className="h-16 sm:h-20 hover:bg-destructive/10 hover:border-destructive"
              disabled={isLoading}
            >
              <Delete className="w-6 h-6 sm:w-7 sm:h-7" />
            </Button>
          </div>

          {/* Login Button */}
          <Button
            onClick={handleLogin}
            disabled={pin.length !== 4 || isLoading}
            className="w-full h-14 sm:h-16 text-xl sm:text-2xl font-bold bg-urbana-gold text-black hover:bg-urbana-gold/90"
          >
            {isLoading ? 'Entrando...' : 'ENTRAR'}
          </Button>
        </Card>

        {/* Info */}
        <p className="text-center text-sm sm:text-base text-muted-foreground">
          PIN padrão: 1234
        </p>
      </div>
    </div>
  );
};

export default TotemLogin;
