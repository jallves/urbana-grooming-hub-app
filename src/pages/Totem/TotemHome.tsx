import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogOut, Calendar, CreditCard, ShoppingBag, CheckCircle, Sparkles } from 'lucide-react';
import { useTotemAuth } from '@/contexts/TotemAuthContext';
import costaUrbanaLogo from '@/assets/costa-urbana-logo.png';

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
      gradient: 'from-amber-400 via-yellow-500 to-orange-500',
      iconGradient: 'from-yellow-400 to-orange-500',
      iconColor: 'text-yellow-400',
      glowColor: 'shadow-yellow-500/50',
    },
    {
      icon: CheckCircle,
      title: 'Check-in',
      subtitle: 'Já Cheguei',
      onClick: () => navigate('/totem/search'),
      gradient: 'from-emerald-400 via-green-500 to-teal-500',
      iconGradient: 'from-green-400 to-teal-500',
      iconColor: 'text-emerald-400',
      glowColor: 'shadow-green-500/50',
    },
    {
      icon: CreditCard,
      title: 'Check-out',
      subtitle: 'Pagamento',
      onClick: () => navigate('/totem/checkout-search'),
      gradient: 'from-sky-400 via-blue-500 to-indigo-500',
      iconGradient: 'from-cyan-400 to-blue-500',
      iconColor: 'text-sky-400',
      glowColor: 'shadow-blue-500/50',
    },
    {
      icon: ShoppingBag,
      title: 'Produtos',
      subtitle: 'E Cuidados',
      onClick: () => navigate('/totem/search'),
      gradient: 'from-fuchsia-400 via-purple-500 to-pink-500',
      iconGradient: 'from-pink-400 to-purple-500',
      iconColor: 'text-fuchsia-400',
      glowColor: 'shadow-purple-500/50',
    }
  ];

  return (
    <div className="fixed inset-0 w-screen h-screen bg-gradient-to-br from-urbana-black via-urbana-black to-urbana-brown flex flex-col items-center justify-center p-3 sm:p-4 md:p-6 lg:p-8 xl:p-10 relative font-poppins overflow-hidden landscape:py-2 landscape:px-6">
      {/* Animated background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-72 h-72 sm:w-96 sm:h-96 bg-urbana-gold/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 sm:w-96 sm:h-96 bg-urbana-gold-vibrant/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(197, 161, 91, 0.15) 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>
      </div>

      {/* Logout Button - optimized for all orientations */}
      <Button
        onClick={handleLogout}
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 sm:top-3 sm:right-3 md:top-4 md:right-4 lg:top-6 lg:right-6 gap-2 h-9 sm:h-10 md:h-12 lg:h-14 px-2 sm:px-3 md:px-4 lg:px-6 text-urbana-light bg-urbana-black-soft/50 backdrop-blur-sm border border-urbana-gray/30 active:bg-urbana-gold/20 active:border-urbana-gold active:text-urbana-gold transition-all duration-200 z-10 active:scale-95 rounded-xl landscape:h-8 landscape:px-2 landscape:text-xs"
        style={{ touchAction: 'manipulation' }}
      >
        <LogOut className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
        <span className="hidden sm:inline text-xs sm:text-sm md:text-base landscape:text-xs">Sair</span>
      </Button>

      <div className="text-center space-y-4 sm:space-y-6 md:space-y-8 lg:space-y-10 xl:space-y-12 max-w-7xl w-full z-10 landscape:space-y-2">
        {/* Logo without circle */}
        <div className="flex justify-center mb-4 sm:mb-6 md:mb-8 animate-scale-in landscape:mb-2">
          <div className="relative group w-24 h-24 sm:w-28 sm:h-28 md:w-36 md:h-36 lg:w-44 lg:h-44 landscape:w-16 landscape:h-16 landscape:sm:w-20 landscape:sm:h-20">
            {/* Logo only */}
            <img 
              src={costaUrbanaLogo} 
              alt="Costa Urbana Logo" 
              className="w-full h-full object-contain group-active:scale-95 transition-transform duration-200"
            />
          </div>
        </div>

        {/* Welcome Message with staggered animation */}
        <div className="space-y-1 sm:space-y-2 md:space-y-3 lg:space-y-4 landscape:space-y-1">
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-light text-urbana-light tracking-wide animate-fade-in opacity-90 landscape:text-base landscape:sm:text-xl">
            Bem-vindo à
          </h1>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl xl:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-urbana-gold-vibrant via-urbana-gold to-urbana-gold-light animate-shimmer animate-fade-up landscape:text-xl landscape:sm:text-3xl"
              style={{ backgroundSize: '200% auto', animationDelay: '0.2s' }}>
            COSTA URBANA
          </h2>
          <div className="flex items-center justify-center gap-1 sm:gap-2 md:gap-3 text-urbana-light/70 animate-fade-in landscape:gap-1" style={{ animationDelay: '0.4s' }}>
            <div className="h-px w-4 sm:w-8 md:w-12 lg:w-16 bg-gradient-to-r from-transparent via-urbana-gold to-urbana-gold-vibrant" />
            <div className="flex items-center gap-1 sm:gap-1.5">
              <Sparkles className="w-2 h-2 sm:w-3 sm:h-3 md:w-4 md:h-4 text-urbana-gold-vibrant animate-pulse" />
              <p className="text-[9px] sm:text-xs md:text-sm lg:text-base xl:text-lg font-light tracking-wider uppercase landscape:text-[8px] landscape:sm:text-xs">
                Sistema de Autoatendimento
              </p>
              <Sparkles className="w-2 h-2 sm:w-3 sm:h-3 md:w-4 md:h-4 text-urbana-gold-vibrant animate-pulse" />
            </div>
            <div className="h-px w-4 sm:w-8 md:w-12 lg:w-16 bg-gradient-to-l from-transparent via-urbana-gold to-urbana-gold-vibrant" />
          </div>
        </div>

        {/* Enhanced Menu Grid - optimized for all orientations */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-5 xl:gap-6 pt-3 sm:pt-4 md:pt-6 lg:pt-8 xl:pt-12 px-1 sm:px-2 landscape:grid-cols-4 landscape:gap-2 landscape:pt-2">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={index}
                onClick={item.onClick}
                className="group relative bg-gradient-to-br from-urbana-black-soft/80 to-urbana-black-soft/60 backdrop-blur-sm rounded-xl sm:rounded-2xl lg:rounded-3xl p-3 sm:p-4 md:p-6 lg:p-8 xl:p-9 transition-all duration-150 active:scale-94 border-2 border-urbana-gray/20 active:border-urbana-gold/50 overflow-hidden animate-slide-up min-h-[100px] sm:min-h-[120px] md:min-h-[160px] lg:min-h-[200px] landscape:min-h-[80px] landscape:p-2 landscape:sm:p-3 landscape:rounded-xl"
                style={{ 
                  animationDelay: `${0.6 + index * 0.1}s`,
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                {/* Gradient overlay on active */}
                <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-active:opacity-10 transition-opacity duration-150`} />
                
                {/* Glow effect */}
                <div className={`absolute -inset-1 bg-gradient-to-r ${item.gradient} opacity-0 group-active:opacity-30 blur-xl transition-opacity duration-150`} />
                
                {/* Content */}
                <div className="relative flex flex-col items-center gap-1.5 sm:gap-2 md:gap-3 landscape:gap-1">
                  {/* Icon with vibrant gradient background */}
                  <div className={`relative w-11 h-11 sm:w-13 sm:h-13 md:w-16 md:h-16 lg:w-22 lg:h-22 xl:w-28 xl:h-28 rounded-xl sm:rounded-2xl bg-gradient-to-br ${item.iconGradient} opacity-80 group-active:opacity-100 flex items-center justify-center transition-all duration-150 shadow-xl ${item.glowColor} group-active:shadow-2xl landscape:w-8 landscape:h-8 landscape:sm:w-10 landscape:sm:h-10 landscape:rounded-lg`}>
                    <Icon className={`w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 lg:w-11 lg:h-11 xl:w-14 xl:h-14 ${item.iconColor} group-active:text-white transition-all duration-150 drop-shadow-lg group-active:scale-110 landscape:w-4 landscape:h-4 landscape:sm:w-5 landscape:sm:h-5`} />
                    <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-active:opacity-30 blur-xl transition-opacity duration-150 rounded-xl sm:rounded-2xl`} />
                  </div>
                  
                  {/* Text */}
                  <div className="text-center space-y-0.5 landscape:space-y-0">
                    <h3 className="text-xs sm:text-sm md:text-lg lg:text-xl xl:text-2xl font-bold text-urbana-light group-active:text-white transition-colors duration-150 landscape:text-[10px] landscape:sm:text-xs">
                      {item.title}
                    </h3>
                    <p className="text-[10px] sm:text-xs md:text-base lg:text-lg text-urbana-light/60 group-active:text-urbana-light/80 transition-colors duration-150 landscape:text-[8px] landscape:sm:text-[10px]">
                      {item.subtitle}
                    </p>
                  </div>
                </div>

                {/* Corner accent */}
                <div className={`absolute top-0 right-0 w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br ${item.gradient} opacity-0 group-active:opacity-20 blur-2xl transition-opacity duration-150`} />
              </button>
            );
          })}
        </div>

        {/* Enhanced Instructions */}
        <div className="pt-3 sm:pt-4 md:pt-6 lg:pt-8 xl:pt-12 animate-fade-in landscape:pt-2" style={{ animationDelay: '1s' }}>
          <p className="text-xs sm:text-sm md:text-base lg:text-lg text-urbana-gold-light/80 font-light tracking-wide flex items-center justify-center gap-1 sm:gap-2 animate-pulse landscape:text-[10px] landscape:sm:text-xs">
            <span className="inline-block w-1.5 h-1.5 sm:w-2 sm:h-2 bg-urbana-gold-vibrant rounded-full animate-ping" />
            Toque na tela para começar
            <span className="inline-block w-1.5 h-1.5 sm:w-2 sm:h-2 bg-urbana-gold-vibrant rounded-full animate-ping" />
          </p>
        </div>

        {/* Footer */}
        <div className="pt-2 sm:pt-3 md:pt-4 lg:pt-6 animate-fade-in landscape:pt-1" style={{ animationDelay: '1.2s' }}>
          <p className="text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs text-urbana-light/20 uppercase tracking-widest landscape:text-[7px]">
            Powered by Beltec Soluções
          </p>
        </div>
      </div>
    </div>
  );
};

export default TotemHome;
