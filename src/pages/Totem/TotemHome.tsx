import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Scissors, LogOut, Calendar, CreditCard, ShoppingBag, CheckCircle, Sparkles } from 'lucide-react';
import { useTotemAuth } from '@/contexts/TotemAuthContext';
import { TotemResetButton } from './TotemResetButton';

const TotemHome: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useTotemAuth();
  const [isIdle, setIsIdle] = useState(true);

  useEffect(() => {
    document.documentElement.classList.add('totem-mode');
    return () => {
      document.documentElement.classList.remove('totem-mode');
    };
  }, []);

  useEffect(() => {
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
      gradient: 'from-urbana-gold via-urbana-gold-vibrant to-urbana-gold-light',
      iconGradient: 'from-urbana-gold-vibrant to-urbana-gold',
    },
    {
      icon: CheckCircle,
      title: 'Check-in',
      subtitle: 'Já Cheguei',
      onClick: () => navigate('/totem/search'),
      gradient: 'from-green-500 via-emerald-500 to-teal-500',
      iconGradient: 'from-green-400 to-emerald-500',
    },
    {
      icon: CreditCard,
      title: 'Check-out',
      subtitle: 'Pagamento',
      onClick: () => navigate('/totem/checkout-search'),
      gradient: 'from-blue-500 via-cyan-500 to-sky-500',
      iconGradient: 'from-cyan-400 to-blue-500',
    },
    {
      icon: ShoppingBag,
      title: 'Produtos',
      subtitle: 'E Cuidados',
      onClick: () => navigate('/totem/search'),
      gradient: 'from-purple-500 via-fuchsia-500 to-pink-500',
      iconGradient: 'from-fuchsia-400 to-purple-500',
    }
  ];

  return (
    <div className="fixed inset-0 w-screen h-screen bg-gradient-to-br from-urbana-black via-urbana-black to-urbana-brown flex flex-col items-center justify-center p-3 sm:p-4 md:p-6 lg:p-8 relative font-poppins overflow-hidden">
      {/* Animated background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-urbana-gold/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-urbana-gold-vibrant/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(197, 161, 91, 0.15) 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>
      </div>

      {/* Logout Button */}
      <Button
        onClick={handleLogout}
        variant="ghost"
        size="sm"
        className="absolute top-3 right-3 sm:top-4 sm:right-4 md:top-6 md:right-6 gap-2 h-10 sm:h-12 md:h-14 px-3 sm:px-4 md:px-6 text-urbana-light bg-urbana-black-soft/50 backdrop-blur-sm border border-urbana-gray/30 active:bg-urbana-gold/20 active:border-urbana-gold active:text-urbana-gold transition-all duration-200 z-10 active:scale-95 rounded-xl"
      >
        <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
        <span className="hidden sm:inline text-xs sm:text-sm md:text-base">Sair</span>
      </Button>

      {/* Reset Button */}
      <TotemResetButton />

      <div className="text-center space-y-6 sm:space-y-8 md:space-y-10 lg:space-y-12 max-w-7xl w-full z-10">
        {/* Logo with enhanced animation */}
        <div className="flex justify-center mb-4 sm:mb-6 md:mb-8 animate-scale-in">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-urbana-gold via-urbana-gold-vibrant to-urbana-gold-light blur-2xl sm:blur-3xl opacity-40 animate-glow" />
            <div className="absolute inset-0 bg-urbana-gold/20 blur-xl animate-pulse-slow" />
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-28 md:h-28 lg:w-36 lg:h-36 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-urbana-gold-vibrant via-urbana-gold to-urbana-gold-dark flex items-center justify-center shadow-2xl border-2 sm:border-4 border-urbana-gold/30 group-active:scale-95 transition-transform duration-200">
              <Scissors className="w-8 h-8 sm:w-10 sm:h-10 md:w-14 md:h-14 lg:w-18 lg:h-18 text-urbana-black drop-shadow-lg" />
              <div className="absolute -inset-1 bg-gradient-to-r from-urbana-gold-vibrant to-urbana-gold rounded-2xl sm:rounded-3xl opacity-0 group-active:opacity-20 blur transition-opacity duration-200" />
            </div>
          </div>
        </div>

        {/* Welcome Message with staggered animation */}
        <div className="space-y-2 sm:space-y-3 md:space-y-4 lg:space-y-6">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-light text-urbana-light tracking-wide animate-fade-in opacity-90">
            Bem-vindo à
          </h1>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl xl:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-urbana-gold-vibrant via-urbana-gold to-urbana-gold-light animate-shimmer animate-fade-up"
              style={{ backgroundSize: '200% auto', animationDelay: '0.2s' }}>
            COSTA URBANA
          </h2>
          <div className="flex items-center justify-center gap-2 sm:gap-3 md:gap-4 text-urbana-light/70 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="h-px w-6 sm:w-10 md:w-16 lg:w-20 bg-gradient-to-r from-transparent via-urbana-gold to-urbana-gold-vibrant" />
            <div className="flex items-center gap-1 sm:gap-2">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-urbana-gold-vibrant animate-pulse" />
              <p className="text-[10px] sm:text-xs md:text-sm lg:text-lg xl:text-xl font-light tracking-wider uppercase">
                Sistema de Autoatendimento
              </p>
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-urbana-gold-vibrant animate-pulse" />
            </div>
            <div className="h-px w-6 sm:w-10 md:w-16 lg:w-20 bg-gradient-to-l from-transparent via-urbana-gold to-urbana-gold-vibrant" />
          </div>
        </div>

        {/* Enhanced Menu Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-6 pt-4 sm:pt-6 md:pt-8 lg:pt-12 px-2 sm:px-0">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={index}
                onClick={item.onClick}
                className="group relative bg-gradient-to-br from-urbana-black-soft/80 to-urbana-black-soft/60 backdrop-blur-sm rounded-xl sm:rounded-2xl lg:rounded-3xl p-3 sm:p-4 md:p-6 lg:p-8 transition-all duration-200 active:scale-95 border border-urbana-gray/20 active:border-urbana-gold/50 overflow-hidden animate-slide-up"
                style={{ animationDelay: `${0.6 + index * 0.1}s` }}
              >
                {/* Gradient overlay on active */}
                <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-active:opacity-10 transition-opacity duration-200`} />
                
                {/* Glow effect */}
                <div className={`absolute -inset-1 bg-gradient-to-r ${item.gradient} opacity-0 group-active:opacity-30 blur-xl transition-opacity duration-200`} />
                
                {/* Content */}
                <div className="relative flex flex-col items-center gap-2 sm:gap-3 md:gap-4">
                  {/* Icon with gradient background */}
                  <div className={`relative w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-lg sm:rounded-xl bg-gradient-to-br ${item.iconGradient} opacity-20 group-active:opacity-100 flex items-center justify-center transition-all duration-200 shadow-lg`}>
                    <Icon className={`w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 lg:w-10 lg:h-10 text-urbana-light group-active:text-white transition-colors duration-200 drop-shadow-lg`} />
                  </div>
                  
                  {/* Text */}
                  <div className="text-center space-y-0.5 sm:space-y-1">
                    <h3 className="text-xs sm:text-sm md:text-lg lg:text-xl xl:text-2xl font-bold text-urbana-light group-active:text-white transition-colors duration-200">
                      {item.title}
                    </h3>
                    <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-urbana-light/60 group-active:text-urbana-light/80 transition-colors duration-200">
                      {item.subtitle}
                    </p>
                  </div>
                </div>

                {/* Corner accent */}
                <div className={`absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br ${item.gradient} opacity-0 group-active:opacity-20 blur-2xl transition-opacity duration-200`} />
              </button>
            );
          })}
        </div>

        {/* Enhanced Instructions */}
        <div className="pt-4 sm:pt-6 md:pt-8 lg:pt-12 animate-fade-in" style={{ animationDelay: '1s' }}>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-urbana-gold-light/80 font-light tracking-wide flex items-center justify-center gap-2 animate-pulse">
            <span className="inline-block w-2 h-2 bg-urbana-gold-vibrant rounded-full animate-ping" />
            Toque na tela para começar
            <span className="inline-block w-2 h-2 bg-urbana-gold-vibrant rounded-full animate-ping" />
          </p>
        </div>

        {/* Footer */}
        <div className="pt-3 sm:pt-4 md:pt-6 lg:pt-8 animate-fade-in" style={{ animationDelay: '1.2s' }}>
          <p className="text-[9px] sm:text-[10px] md:text-xs text-urbana-light/20 uppercase tracking-widest">
            Powered by Beltec Soluções
          </p>
        </div>
      </div>
    </div>
  );
};

export default TotemHome;
