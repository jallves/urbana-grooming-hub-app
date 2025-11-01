import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Scissors } from 'lucide-react';

const TotemHome: React.FC = () => {
  const navigate = useNavigate();
  const [isIdle, setIsIdle] = useState(true);

  useEffect(() => {
    // Screensaver mode - reset to home after 60 seconds of inactivity
    const idleTimer = setTimeout(() => {
      setIsIdle(true);
    }, 60000);

    return () => clearTimeout(idleTimer);
  }, [isIdle]);

  const handleStart = () => {
    setIsIdle(false);
    navigate('/totem/search');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
      <div className="text-center space-y-6 sm:space-y-8 max-w-2xl w-full">
        {/* Logo */}
        <div className="flex justify-center mb-6 sm:mb-8">
          <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full bg-urbana-gold flex items-center justify-center">
            <Scissors className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-black" />
          </div>
        </div>

        {/* Welcome Message */}
        <div className="space-y-3 sm:space-y-4">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground">
            Bem-vindo à
          </h1>
          <h2 className="text-5xl sm:text-6xl md:text-7xl font-black text-urbana-gold">
            Costa Urbana
          </h2>
          <p className="text-2xl sm:text-2xl md:text-3xl text-muted-foreground mt-6 sm:mt-8">
            Sistema de Autoatendimento
          </p>
        </div>

        {/* Start Button */}
        <div className="pt-8 sm:pt-10 md:pt-12">
          <Button
            onClick={handleStart}
            size="lg"
            className="h-24 sm:h-28 md:h-32 px-12 sm:px-14 md:px-16 text-3xl sm:text-3xl md:text-4xl font-bold bg-urbana-gold text-black hover:bg-urbana-gold/90 rounded-2xl shadow-2xl transition-all hover:scale-105"
          >
            INICIAR ATENDIMENTO
          </Button>
        </div>

        {/* Instructions */}
        <p className="text-lg sm:text-xl text-muted-foreground mt-8 sm:mt-10 md:mt-12 animate-pulse">
          Toque na tela para começar
        </p>
      </div>
    </div>
  );
};

export default TotemHome;
