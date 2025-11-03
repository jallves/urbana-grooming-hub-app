import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogOut, Calendar, CreditCard, ShoppingBag, CheckCircle, Sparkles } from 'lucide-react';
import { useTotemAuth } from '@/contexts/TotemAuthContext';
import { NewFeaturesModal } from '@/components/totem/NewFeaturesModal';
import costaUrbanaLogo from '@/assets/costa-urbana-logo.png';

const TotemHome: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useTotemAuth();
  const [isIdle, setIsIdle] = useState(true);
  const [showNewFeatures, setShowNewFeatures] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add('totem-mode');
    
    // Mostrar modal de novas features na primeira visita
    const hasSeenNewFeatures = localStorage.getItem('totem_seen_new_features');
    if (!hasSeenNewFeatures) {
      setTimeout(() => setShowNewFeatures(true), 1000);
    }
    
    return () => {
      document.documentElement.classList.remove('totem-mode');
    };
  }, []);

  const handleCloseNewFeatures = () => {
    setShowNewFeatures(false);
    localStorage.setItem('totem_seen_new_features', 'true');
  };

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
      title: 'Novo Agendamento',
      subtitle: 'Agende seu horário',
      onClick: () => navigate('/totem/search', { state: { action: 'novo-agendamento' } }),
      gradient: 'from-amber-400 via-yellow-500 to-orange-500',
      iconGradient: 'from-yellow-400 to-orange-500',
      iconColor: 'text-yellow-400',
      glowColor: 'shadow-yellow-500/50',
    },
    {
      icon: CheckCircle,
      title: 'Check-in',
      subtitle: 'Já Cheguei',
      onClick: () => navigate('/totem/search', { state: { action: 'check-in' } }),
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
    <div className="fixed inset-0 w-screen h-screen bg-gradient-to-br from-urbana-black via-urbana-black to-urbana-brown flex flex-col items-center justify-center p-2 sm:p-4 md:p-6 lg:p-8 relative font-poppins overflow-hidden">
      {/* Animated background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-urbana-gold/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-urbana-gold-vibrant/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
      </div>

      {/* Logout Button */}
      <Button
        onClick={handleLogout}
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 sm:top-3 sm:right-3 md:top-4 md:right-4 gap-1 sm:gap-2 h-8 sm:h-10 md:h-12 px-2 sm:px-3 md:px-4 text-xs sm:text-sm md:text-base text-urbana-light bg-urbana-black-soft/50 backdrop-blur-sm border border-urbana-gray/30 active:bg-urbana-gold/20 active:border-urbana-gold active:text-urbana-gold transition-all duration-200 z-10 active:scale-95 rounded-lg"
        style={{ touchAction: 'manipulation' }}
      >
        <LogOut className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
        <span className="hidden sm:inline">Sair</span>
      </Button>

      <div className="text-center space-y-2 sm:space-y-4 md:space-y-6 max-w-7xl w-full z-10">
        {/* Logo */}
        <div className="flex justify-center mb-2 sm:mb-4 md:mb-6 animate-scale-in">
          <div className="relative group w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 lg:w-40 lg:h-40">
            <img 
              src={costaUrbanaLogo} 
              alt="Costa Urbana Logo" 
              className="w-full h-full object-contain group-active:scale-95 transition-transform duration-200"
            />
          </div>
        </div>

        {/* Welcome Message */}
        <div className="space-y-0.5 sm:space-y-1 md:space-y-2">
          <h1 className="text-sm sm:text-xl md:text-2xl lg:text-3xl font-light text-urbana-light tracking-wide animate-fade-in opacity-90">
            Bem-vindo à
          </h1>
          <h2 className="text-lg sm:text-2xl md:text-3xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-urbana-gold-vibrant via-urbana-gold to-urbana-gold-light animate-shimmer"
              style={{ backgroundSize: '200% auto', animationDelay: '0.2s' }}>
            COSTA URBANA
          </h2>
          <div className="flex items-center justify-center gap-1 sm:gap-2 text-urbana-light/70 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="h-px w-3 sm:w-6 md:w-10 bg-gradient-to-r from-transparent via-urbana-gold to-urbana-gold-vibrant" />
            <div className="flex items-center gap-0.5 sm:gap-1">
              <Sparkles className="w-2 h-2 sm:w-3 sm:h-3 text-urbana-gold-vibrant animate-pulse" />
              <p className="text-[8px] sm:text-xs md:text-sm font-light tracking-wider uppercase">
                Sistema de Autoatendimento
              </p>
              <Sparkles className="w-2 h-2 sm:w-3 sm:h-3 text-urbana-gold-vibrant animate-pulse" />
            </div>
            <div className="h-px w-3 sm:w-6 md:w-10 bg-gradient-to-l from-transparent via-urbana-gold to-urbana-gold-vibrant" />
          </div>
        </div>

        {/* Menu Grid - Mobile optimized */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4 pt-2 sm:pt-4 md:pt-6 px-1 sm:px-2">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={index}
                onClick={item.onClick}
                className="group relative bg-gradient-to-br from-urbana-black-soft/80 to-urbana-black-soft/60 backdrop-blur-sm rounded-lg sm:rounded-xl md:rounded-2xl p-2 sm:p-3 md:p-5 transition-all duration-150 active:scale-94 border-2 border-urbana-gray/20 active:border-urbana-gold/50 overflow-hidden animate-slide-up min-h-[80px] sm:min-h-[110px] md:min-h-[140px]"
                style={{ 
                  animationDelay: `${0.6 + index * 0.1}s`,
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                {/* Gradient overlay on active */}
                <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-active:opacity-10 transition-opacity duration-150`} />
                
                {/* Content */}
                <div className="relative flex flex-col items-center gap-1 sm:gap-2 md:gap-3">
                  {/* Icon */}
                  <div className={`relative w-8 h-8 sm:w-11 sm:h-11 md:w-14 md:h-14 lg:w-20 lg:h-20 rounded-lg sm:rounded-xl bg-gradient-to-br ${item.iconGradient} opacity-80 group-active:opacity-100 flex items-center justify-center transition-all duration-150 shadow-xl ${item.glowColor} group-active:shadow-2xl`}>
                    <Icon className={`w-4 h-4 sm:w-5 sm:h-5 md:w-7 md:h-7 lg:w-10 lg:h-10 ${item.iconColor} group-active:text-white transition-all duration-150 drop-shadow-lg group-active:scale-110`} />
                  </div>
                  
                  {/* Text */}
                  <div className="text-center space-y-0">
                    <h3 className="text-[10px] sm:text-xs md:text-base lg:text-lg font-bold text-urbana-light group-active:text-white transition-colors duration-150">
                      {item.title}
                    </h3>
                    <p className="text-[8px] sm:text-[10px] md:text-sm text-urbana-light/60 group-active:text-urbana-light/80 transition-colors duration-150">
                      {item.subtitle}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Instructions */}
        <div className="pt-2 sm:pt-4 md:pt-6 animate-fade-in" style={{ animationDelay: '1s' }}>
          <p className="text-[10px] sm:text-sm md:text-base text-urbana-gold-light/80 font-light tracking-wide flex items-center justify-center gap-1 sm:gap-2 animate-pulse">
            <span className="inline-block w-1 h-1 sm:w-1.5 sm:h-1.5 bg-urbana-gold-vibrant rounded-full animate-ping" />
            Toque na tela para começar
            <span className="inline-block w-1 h-1 sm:w-1.5 sm:h-1.5 bg-urbana-gold-vibrant rounded-full animate-ping" />
          </p>
          
          <button
            onClick={() => setShowNewFeatures(true)}
            className="mt-2 sm:mt-4 text-xs sm:text-sm text-urbana-gold/60 hover:text-urbana-gold flex items-center justify-center gap-1 sm:gap-2 transition-colors mx-auto"
          >
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
            Ver novidades do totem
          </button>
        </div>

        {/* Footer */}
        <div className="pt-1 sm:pt-2 md:pt-3 animate-fade-in" style={{ animationDelay: '1.2s' }}>
          <p className="text-[7px] sm:text-[8px] md:text-[9px] text-urbana-light/20 uppercase tracking-widest">
            Powered by Beltec Soluções
          </p>
        </div>
      </div>
      
      {/* New Features Modal */}
      <NewFeaturesModal 
        isOpen={showNewFeatures} 
        onClose={handleCloseNewFeatures} 
      />
    </div>
  );
};

export default TotemHome;
