import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, User, Scissors, Sparkles, Crown, ArrowRight } from 'lucide-react';
import costaUrbanaLogo from '@/assets/costa-urbana-logo.png';
import barbershopBg from '@/assets/barbershop-background.jpg';

const TotemCheckInSuccess: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { client, appointment } = location.state || {};

  useEffect(() => {
    // Add totem-mode class for touch optimization
    document.documentElement.classList.add('totem-mode');
    
    if (!client || !appointment) {
      navigate('/totem/home');
      return;
    }

    // Redirect to waiting screen after 3 seconds
    const timer = setTimeout(() => {
      navigate('/totem/waiting', {
        state: { client, appointment, session: location.state?.session }
      });
    }, 3000);

    return () => {
      clearTimeout(timer);
      document.documentElement.classList.remove('totem-mode');
    };
  }, [navigate, client, appointment]);

  if (!client || !appointment) {
    return null;
  }

  return (
    <div className="fixed inset-0 w-screen h-screen flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 font-poppins relative overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <img 
          src={barbershopBg} 
          alt="Barbearia" 
          className="w-full h-full object-cover"
        />
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-urbana-black/85 via-urbana-brown/75 to-urbana-black/80" />
      </div>

      {/* Premium background effects with enhanced depth */}
      <div className="absolute inset-0 overflow-hidden z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl opacity-60" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-urbana-gold/20 rounded-full blur-3xl opacity-50" />
        <div className="absolute top-1/3 right-1/3 w-64 h-64 bg-emerald-400/10 rounded-full blur-2xl opacity-40" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(16, 185, 129, 0.1) 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>
      </div>

      <div className="text-center space-y-8 sm:space-y-10 md:space-y-12 max-w-3xl z-10">
        {/* Success Icon with premium effect - no pulsing */}
        <div className="flex justify-center animate-scale-in">
          <div className="relative group">
            {/* Multiple glow layers for depth */}
            <div className="absolute -inset-8 bg-gradient-to-br from-emerald-400 via-green-500 to-emerald-600 blur-3xl opacity-50" />
            <div className="absolute -inset-12 bg-emerald-500/30 blur-3xl opacity-30" />
            <div className="absolute -inset-4 bg-emerald-400/20 blur-2xl opacity-40" />
            
            {/* Icon container with enhanced styling */}
            <div className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-full bg-gradient-to-br from-emerald-400 via-green-500 to-emerald-600 flex items-center justify-center shadow-2xl border-4 border-emerald-400/30">
              <CheckCircle className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 text-white drop-shadow-2xl" strokeWidth={3} />
              
              {/* Sparkles without pulsing */}
              <Sparkles className="absolute top-4 right-4 w-6 h-6 text-white opacity-80" />
              <Sparkles className="absolute bottom-4 left-4 w-4 h-4 text-emerald-200 opacity-80" />
              <Sparkles className="absolute top-8 left-8 w-3 h-3 text-emerald-100 opacity-60" />
            </div>
            
            {/* Static ring effect */}
            <div className="absolute inset-0 rounded-full border-2 border-emerald-400/20" />
          </div>
        </div>

        {/* Success Message with gradient text */}
        <div className="space-y-6 sm:space-y-8 animate-fade-up" style={{ animationDelay: '0.2s' }}>
          {/* Crown badge */}
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full">
              <Crown className="w-4 h-4 text-emerald-400" />
              <span className="text-xs sm:text-sm text-emerald-400 font-medium uppercase tracking-wider">Check-in Premium</span>
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-green-400 to-emerald-300 animate-shimmer leading-tight" style={{ backgroundSize: '200% auto' }}>
            Check-in Confirmado!
          </h1>
          
          {/* Personalized Welcome Message */}
          <div className="space-y-3">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-urbana-gold via-urbana-gold-light to-urbana-gold">
              Seja bem-vindo, {client.nome.split(' ')[0]}!
            </h2>
            <p className="text-lg sm:text-xl md:text-2xl text-urbana-light/80 font-light">
              É uma honra tê-lo conosco hoje! ✨
            </p>
          </div>
          
          {/* Client info card */}
          <div className="inline-block p-6 sm:p-8 bg-gradient-to-br from-urbana-black-soft/80 to-urbana-black/90 border-2 border-urbana-gold/30 rounded-2xl backdrop-blur-sm shadow-2xl">
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3 sm:gap-4">
                <div className="w-12 h-12 rounded-xl bg-urbana-gold/20 flex items-center justify-center">
                  <User className="w-6 h-6 text-urbana-gold" />
                </div>
                <div className="text-left">
                  <p className="text-sm text-urbana-light/60">Cliente VIP</p>
                  <p className="text-2xl sm:text-3xl font-bold text-urbana-gold">
                    {client.nome}
                  </p>
                </div>
              </div>
              
              <div className="h-px bg-urbana-gold/20" />
              
              <div className="flex items-center justify-center gap-3 sm:gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <Scissors className="w-6 h-6 text-emerald-400" />
                </div>
                <div className="text-left">
                  <p className="text-sm text-urbana-light/60">Profissional</p>
                  <p className="text-xl sm:text-2xl font-bold text-emerald-400">
                    {appointment.barbeiro?.nome}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Service badge with premium styling */}
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-urbana-gold/20 via-urbana-gold/30 to-urbana-gold/20 border-2 border-urbana-gold/50 rounded-2xl backdrop-blur-sm shadow-lg">
            <Sparkles className="w-5 h-5 text-urbana-gold opacity-80" />
            <span className="text-xl sm:text-2xl font-bold text-urbana-gold">
              {appointment.servico?.nome}
            </span>
            <Sparkles className="w-5 h-5 text-urbana-gold opacity-80" />
          </div>
        </div>

        {/* Auto redirect with elegant progress */}
        <div className="space-y-4 animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <div className="flex items-center justify-center gap-3 text-urbana-light/70">
            <span className="text-base sm:text-lg font-light">Preparando experiência premium</span>
            <ArrowRight className="w-5 h-5 opacity-80" />
          </div>
          
          {/* Progress bar */}
          <div className="max-w-md mx-auto h-1 bg-urbana-gray/20 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-400 via-green-500 to-emerald-400 rounded-full animate-[slideRight_3s_ease-in-out]" />
          </div>
          
          <p className="text-sm sm:text-base text-urbana-light/50">
            Acompanhe sua posição na fila em tempo real
          </p>
        </div>

        {/* Logo footer */}
        <div className="pt-8 animate-fade-in" style={{ animationDelay: '0.9s' }}>
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-urbana-black-soft/50 border border-urbana-gold/20 rounded-full backdrop-blur-sm">
            <img src={costaUrbanaLogo} alt="Costa Urbana" className="w-8 h-8 object-contain" />
            <span className="text-xs text-urbana-light/60 font-medium uppercase tracking-wider">
              Sistema Premium de Gestão
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TotemCheckInSuccess;
