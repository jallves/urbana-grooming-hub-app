import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogOut, CalendarPlus, UserCheck, Wallet, Package, Sparkles } from 'lucide-react';
import { useTotemAuth } from '@/contexts/TotemAuthContext';
import { NewFeaturesModal } from '@/components/totem/NewFeaturesModal';
import { TimeoutWarning } from '@/components/totem/TimeoutWarning';
import { useTotemTimeout } from '@/hooks/totem/useTotemTimeout';
import { toast } from 'sonner';
import costaUrbanaLogo from '@/assets/logo-costa-urbana.png';
import barbershopBg from '@/assets/barbershop-background.jpg';

const TotemHome: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useTotemAuth();
  const [isIdle, setIsIdle] = useState(true);
  const [showNewFeatures, setShowNewFeatures] = useState(false);

  // Sistema de timeout aprimorado
  const { showWarning, formatTimeLeft, extendTime } = useTotemTimeout({
    timeout: 5 * 60 * 1000, // 5 minutos
    warningTime: 30 * 1000, // Avisar 30s antes
    enabled: false, // Desabilitado na home (reativado nas outras telas)
    onTimeout: () => {
      toast.info('Sessão encerrada por inatividade');
      logout();
    },
  });

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
      icon: CalendarPlus,
      title: 'Novo Agendamento',
      subtitle: 'Agende seu horário',
      onClick: () => navigate('/totem/search', { state: { action: 'novo-agendamento' } }),
      gradient: 'from-amber-400 via-yellow-500 to-orange-500',
      iconGradient: 'from-yellow-400 to-orange-500',
      iconColor: 'text-yellow-400',
      glowColor: 'shadow-yellow-500/50',
    },
    {
      icon: UserCheck,
      title: 'Check-in',
      subtitle: 'Já Cheguei',
      onClick: () => navigate('/totem/search', { state: { action: 'check-in' } }),
      gradient: 'from-emerald-400 via-green-500 to-teal-500',
      iconGradient: 'from-green-400 to-teal-500',
      iconColor: 'text-emerald-400',
      glowColor: 'shadow-green-500/50',
    },
    {
      icon: Wallet,
      title: 'Check-out',
      subtitle: 'Pagamento',
      onClick: () => navigate('/totem/checkout-search'),
      gradient: 'from-sky-400 via-blue-500 to-indigo-500',
      iconGradient: 'from-cyan-400 to-blue-500',
      iconColor: 'text-sky-400',
      glowColor: 'shadow-blue-500/50',
    },
    {
      icon: Package,
      title: 'Produtos',
      subtitle: 'E Cuidados',
      onClick: () => navigate('/totem/search', { state: { action: 'produtos' } }),
      gradient: 'from-fuchsia-400 via-purple-500 to-pink-500',
      iconGradient: 'from-pink-400 to-purple-500',
      iconColor: 'text-fuchsia-400',
      glowColor: 'shadow-purple-500/50',
    }
  ];

  return (
    <div className="fixed inset-0 w-screen h-screen flex flex-col items-center justify-center p-2 sm:p-4 md:p-6 lg:p-8 relative font-poppins overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <img 
          src={barbershopBg} 
          alt="Barbearia" 
          className="w-full h-full object-cover"
        />
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-urbana-black/80 via-urbana-black/75 to-urbana-brown/70" />
      </div>

      {/* Premium background effects with depth */}
      <div className="absolute inset-0 overflow-hidden z-0">
        <div className="absolute top-0 left-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-urbana-gold/10 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-urbana-gold-vibrant/10 rounded-full blur-3xl opacity-40" />
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
        className="absolute top-2 right-2 sm:top-3 sm:right-3 md:top-4 md:right-4 gap-1 sm:gap-2 h-8 sm:h-10 md:h-12 px-2 sm:px-3 md:px-4 text-xs sm:text-sm md:text-base text-urbana-light bg-urbana-black-soft/50 backdrop-blur-sm border border-urbana-gray/30 active:bg-urbana-gold/20 active:border-urbana-gold active:text-urbana-gold transition-all duration-200 z-10 active:scale-95 rounded-lg"
        style={{ touchAction: 'manipulation' }}
      >
        <LogOut className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
        <span className="hidden sm:inline">Sair</span>
      </Button>

      <div className="text-center space-y-2 sm:space-y-4 md:space-y-6 max-w-7xl w-full z-10">
        {/* Logo with premium frame and depth */}
        <div className="flex justify-center mb-2 sm:mb-4 md:mb-6 animate-scale-in">
          <div className="relative group w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 lg:w-40 lg:h-40">
            {/* Multi-layered glow for depth */}
            <div className="absolute -inset-4 bg-gradient-to-br from-urbana-gold via-urbana-gold-vibrant to-transparent blur-2xl opacity-30" />
            <div className="absolute -inset-6 bg-urbana-gold/20 blur-3xl opacity-20" />
            
            {/* Premium border frame */}
            <div className="absolute inset-0 rounded-2xl border-2 border-urbana-gold/30" />
            
            <img 
              src={costaUrbanaLogo} 
              alt="Costa Urbana Logo" 
              className="relative w-full h-full object-contain group-active:scale-95 transition-all duration-300 drop-shadow-2xl"
            />
            
            {/* Corner accents */}
            <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-urbana-gold rounded-tl-lg" />
            <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-urbana-gold rounded-tr-lg" />
            <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-urbana-gold rounded-bl-lg" />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-urbana-gold rounded-br-lg" />
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
              <Sparkles className="w-2 h-2 sm:w-3 sm:h-3 text-urbana-gold-vibrant opacity-80" />
              <p className="text-[8px] sm:text-xs md:text-sm font-light tracking-wider uppercase">
                Sistema de Autoatendimento Premium
              </p>
              <Sparkles className="w-2 h-2 sm:w-3 sm:h-3 text-urbana-gold-vibrant opacity-80" />
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
                className="group relative backdrop-blur-xl rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6 transition-all duration-300 active:scale-95 border border-white/10 overflow-hidden animate-slide-up min-h-[100px] sm:min-h-[130px] md:min-h-[160px] shadow-lg active:shadow-2xl"
                style={{ 
                  animationDelay: `${0.6 + index * 0.1}s`,
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  background: 'rgba(255, 255, 255, 0.03)'
                }}
              >
                {/* Glassmorphism background com tema do módulo */}
                <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-[0.08] group-active:opacity-[0.15] transition-all duration-300`} />
                
                {/* Efeito de profundidade */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
                
                {/* Border glow temático */}
                <div className={`absolute inset-0 rounded-xl md:rounded-2xl border border-transparent group-active:border-white/20 transition-all duration-300`} />
                
                {/* Content */}
                <div className="relative flex flex-col items-center justify-center gap-2 sm:gap-3 md:gap-4 h-full">
                  {/* Icon container com tema */}
                  <div className="relative">
                    {/* Glow effect temático */}
                    <div className={`absolute -inset-3 bg-gradient-to-br ${item.iconGradient} blur-2xl opacity-30 group-active:opacity-50 transition-all duration-300`} />
                    
                    {/* Icon background glassmorphism */}
                    <div className="relative w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-xl backdrop-blur-sm flex items-center justify-center transition-all duration-300 border border-white/10"
                         style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                      <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${item.iconGradient} opacity-20 group-active:opacity-30 transition-all duration-300`} />
                      <Icon className={`relative w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 lg:w-10 lg:h-10 ${item.iconColor} group-active:scale-110 transition-all duration-300 drop-shadow-lg`} />
                    </div>
                  </div>
                  
                  {/* Text com melhor contraste */}
                  <div className="text-center space-y-0.5">
                    <h3 className="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-white drop-shadow-lg">
                      {item.title}
                    </h3>
                    <p className="text-[9px] sm:text-xs md:text-sm text-white/70 drop-shadow-md">
                      {item.subtitle}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Instructions with elegant styling */}
        <div className="pt-2 sm:pt-4 md:pt-6 animate-fade-in" style={{ animationDelay: '1s' }}>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-urbana-gold/5 border border-urbana-gold/20 rounded-full backdrop-blur-sm">
            <span className="inline-block w-1.5 h-1.5 bg-urbana-gold-vibrant rounded-full opacity-80" />
            <p className="text-[10px] sm:text-sm md:text-base text-urbana-gold-light/90 font-light tracking-wide">
              Toque na tela para começar
            </p>
            <span className="inline-block w-1.5 h-1.5 bg-urbana-gold-vibrant rounded-full opacity-80" />
          </div>
          
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

      <TimeoutWarning
        open={showWarning}
        timeLeft={formatTimeLeft}
        onExtend={extendTime}
      />
    </div>
  );
};

export default TotemHome;
