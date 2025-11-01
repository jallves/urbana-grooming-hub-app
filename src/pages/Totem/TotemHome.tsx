import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Scissors, LogOut, Calendar, CreditCard, ShoppingBag, CheckCircle } from 'lucide-react';
import { useTotemAuth } from '@/contexts/TotemAuthContext';

const TotemHome: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useTotemAuth();
  const [isIdle, setIsIdle] = useState(true);

  // Add totem-mode class for touch optimization
  useEffect(() => {
    document.documentElement.classList.add('totem-mode');
    return () => {
      document.documentElement.classList.remove('totem-mode');
    };
  }, []);

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

  const handleLogout = () => {
    logout();
    navigate('/totem/login');
  };

  const menuItems = [
    {
      icon: Calendar,
      title: 'Agendar',
      subtitle: 'Novo Atendimento',
      onClick: () => navigate('/totem/search'),
      color: 'bg-urbana-gold'
    },
    {
      icon: CheckCircle,
      title: 'Check-in',
      subtitle: 'Já Cheguei',
      onClick: () => navigate('/totem/search'),
      color: 'bg-urbana-gold'
    },
    {
      icon: CreditCard,
      title: 'Check-out',
      subtitle: 'Pagamento',
      onClick: () => navigate('/totem/search'),
      color: 'bg-urbana-gold'
    },
    {
      icon: ShoppingBag,
      title: 'Produtos',
      subtitle: 'E Cuidados',
      onClick: () => navigate('/totem/search'),
      color: 'bg-urbana-gold'
    }
  ];

  return (
    <div className="fixed inset-0 w-screen h-screen bg-urbana-black flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 relative font-poppins overflow-hidden">
      {/* Background texture effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-urbana-black via-urbana-brown/20 to-urbana-black opacity-50" />
      
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: 'linear-gradient(rgba(197, 161, 91, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(197, 161, 91, 0.1) 1px, transparent 1px)',
        backgroundSize: '50px 50px'
      }} />

      {/* Logout Button */}
      <Button
        onClick={handleLogout}
        variant="ghost"
        size="sm"
        className="absolute top-4 right-4 sm:top-6 sm:right-6 gap-2 text-urbana-light active:text-urbana-gold active:bg-urbana-gold/20 transition-all duration-100 z-10 active:scale-95"
      >
        <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
        <span className="hidden sm:inline">Sair</span>
      </Button>

      <div className="text-center space-y-12 max-w-6xl w-full z-10">
        {/* Logo */}
        <div className="flex justify-center mb-4 sm:mb-6 md:mb-8 animate-fade-in">
          <div className="relative">
            <div className="absolute inset-0 bg-urbana-gold blur-3xl opacity-30 animate-pulse" />
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-urbana-gold to-urbana-gold-dark flex items-center justify-center shadow-2xl border-4 border-urbana-gold/20">
              <Scissors className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 text-urbana-black" />
            </div>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="space-y-3 sm:space-y-4 md:space-y-6 animate-fade-in">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light text-urbana-light tracking-wide">
            Bem-vindo à
          </h1>
          <h2 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-urbana-gold via-urbana-gold-light to-urbana-gold">
            COSTA URBANA
          </h2>
          <div className="flex items-center justify-center gap-2 sm:gap-4 text-urbana-light/70">
            <div className="h-px w-8 sm:w-12 md:w-16 bg-gradient-to-r from-transparent to-urbana-gold" />
            <p className="text-xs sm:text-sm md:text-xl lg:text-2xl font-light tracking-wider uppercase">
              Sistema de Autoatendimento
            </p>
            <div className="h-px w-8 sm:w-12 md:w-16 bg-gradient-to-l from-transparent to-urbana-gold" />
          </div>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 pt-6 sm:pt-8 md:pt-12">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={index}
                onClick={item.onClick}
                className="group relative bg-card active:bg-card/80 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 transition-all duration-100 active:scale-95 active:shadow-2xl active:shadow-urbana-gold/30 border border-urbana-gray/20 active:border-urbana-gold/50"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Glow effect on active */}
                <div className="absolute inset-0 bg-gradient-to-br from-urbana-gold/0 to-urbana-gold/0 group-active:from-urbana-gold/10 group-active:to-urbana-gold/5 rounded-xl sm:rounded-2xl transition-all duration-100" />
                
                <div className="relative flex flex-col items-center gap-2 sm:gap-3 md:gap-4">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-lg sm:rounded-xl bg-urbana-gold/10 group-active:bg-urbana-gold flex items-center justify-center transition-all duration-100">
                    <Icon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 text-urbana-gold group-active:text-urbana-black transition-colors duration-100" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-sm sm:text-base md:text-xl lg:text-2xl font-bold text-urbana-light mb-0.5 sm:mb-1">
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-sm md:text-base text-urbana-light/60">
                      {item.subtitle}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Instructions */}
        <div className="pt-6 sm:pt-8 md:pt-12 animate-pulse">
          <p className="text-base sm:text-lg md:text-xl text-urbana-gold/70 font-light tracking-wide">
            Toque na tela para começar
          </p>
        </div>

        {/* Footer */}
        <div className="pt-4 sm:pt-6 md:pt-8">
          <p className="text-[10px] sm:text-xs text-urbana-light/30 uppercase tracking-wider">
            Powered by Beltec Soluções
          </p>
        </div>
      </div>
    </div>
  );
};

export default TotemHome;
