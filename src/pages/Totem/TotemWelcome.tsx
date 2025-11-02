import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, ChevronRight, Crown } from 'lucide-react';
import costaUrbanaLogo from '@/assets/costa-urbana-logo.png';

const TotemWelcome: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { staffName } = location.state || { staffName: 'Colaborador' };

  useEffect(() => {
    document.documentElement.classList.add('totem-mode');
    
    // Redirecionar automaticamente após 3 segundos
    const timer = setTimeout(() => {
      navigate('/totem');
    }, 3000);

    return () => {
      clearTimeout(timer);
      document.documentElement.classList.remove('totem-mode');
    };
  }, [navigate]);

  return (
    <div className="fixed inset-0 w-screen h-screen bg-gradient-to-br from-urbana-black via-urbana-brown/30 to-urbana-black flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 relative font-poppins overflow-hidden">
      {/* Animated background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-urbana-gold/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-urbana-gold-vibrant/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(197, 161, 91, 0.15) 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center space-y-8 sm:space-y-12 max-w-4xl">
        {/* Logo with premium effect */}
        <div className="flex justify-center animate-scale-in">
          <div className="relative group">
            {/* Multiple glow layers for depth */}
            <div className="absolute -inset-8 bg-gradient-to-br from-urbana-gold via-urbana-gold-vibrant to-transparent blur-3xl opacity-50 animate-pulse" />
            <div className="absolute -inset-12 bg-urbana-gold/30 blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '0.5s' }} />
            
            {/* Logo container with premium border */}
            <div className="relative w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 p-6 rounded-3xl bg-gradient-to-br from-urbana-black-soft/80 to-urbana-black/90 backdrop-blur-sm border-2 border-urbana-gold/50 shadow-2xl overflow-hidden">
              {/* Inner gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-urbana-gold/20 via-transparent to-transparent" />
              
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
              
              {/* Logo */}
              <img 
                src={costaUrbanaLogo} 
                alt="Costa Urbana" 
                className="relative w-full h-full object-contain drop-shadow-2xl"
              />
              
              {/* Corner accents */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-urbana-gold rounded-tl-xl" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-urbana-gold rounded-tr-xl" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-urbana-gold rounded-bl-xl" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-urbana-gold rounded-br-xl" />
            </div>
          </div>
        </div>

        {/* Welcome message with elegant animation */}
        <div className="space-y-6 sm:space-y-8 animate-fade-up" style={{ animationDelay: '0.3s' }}>
          {/* Crown icon */}
          <div className="flex justify-center">
            <div className="relative">
              <Crown className="w-12 h-12 sm:w-16 sm:h-16 text-urbana-gold drop-shadow-2xl animate-pulse" />
              <div className="absolute inset-0 bg-urbana-gold blur-xl opacity-50" />
            </div>
          </div>

          {/* Main greeting */}
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-urbana-gold-vibrant via-urbana-gold to-urbana-gold-light animate-shimmer leading-tight" style={{ backgroundSize: '200% auto' }}>
              Bem-vindo
            </h1>
            
            {/* Staff name with premium styling */}
            <div className="inline-block px-8 py-4 bg-gradient-to-r from-urbana-gold/20 via-urbana-gold/30 to-urbana-gold/20 border-2 border-urbana-gold/50 rounded-2xl backdrop-blur-sm">
              <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-urbana-light">
                {staffName}
              </p>
            </div>
          </div>

          {/* Subtitle with sparkles */}
          <div className="flex items-center justify-center gap-3">
            <Sparkles className="w-5 h-5 text-urbana-gold-vibrant animate-pulse" />
            <p className="text-lg sm:text-xl md:text-2xl text-urbana-gold-light font-light tracking-wide">
              Sistema de Gestão Premium
            </p>
            <Sparkles className="w-5 h-5 text-urbana-gold-vibrant animate-pulse" style={{ animationDelay: '0.5s' }} />
          </div>

          {/* Decorative line */}
          <div className="flex items-center justify-center gap-2 mt-8">
            <div className="h-px w-16 sm:w-24 bg-gradient-to-r from-transparent via-urbana-gold to-urbana-gold" />
            <div className="w-2 h-2 bg-urbana-gold rounded-full animate-ping" />
            <div className="h-px w-16 sm:w-24 bg-gradient-to-l from-transparent via-urbana-gold to-urbana-gold" />
          </div>
        </div>

        {/* Loading indicator with text */}
        <div className="space-y-4 animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <div className="flex items-center justify-center gap-3 text-urbana-gold-light/80">
            <span className="text-base sm:text-lg font-light">Carregando ambiente premium</span>
            <ChevronRight className="w-5 h-5 animate-pulse" />
          </div>
          
          {/* Progress bar */}
          <div className="max-w-md mx-auto h-1 bg-urbana-gray/20 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-urbana-gold via-urbana-gold-vibrant to-urbana-gold rounded-full animate-[slideRight_3s_ease-in-out]" />
          </div>
        </div>

        {/* Footer badge */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-fade-in" style={{ animationDelay: '0.9s' }}>
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-urbana-black-soft/50 border border-urbana-gold/30 rounded-full backdrop-blur-sm">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-xs sm:text-sm text-urbana-light/60 font-medium uppercase tracking-wider">
              Sistema Autenticado
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TotemWelcome;
