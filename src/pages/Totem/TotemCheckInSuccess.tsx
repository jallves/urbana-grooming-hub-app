import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, User, Scissors, Sparkles, Crown, Clock, Home } from 'lucide-react';
import costaUrbanaLogo from '@/assets/logo-costa-urbana.png';
import barbershopBg from '@/assets/barbershop-background.jpg';
import { Button } from '@/components/ui/button';

const TotemCheckInSuccess: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { client, appointment } = location.state || {};
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    // Add totem-mode class for touch optimization
    document.documentElement.classList.add('totem-mode');
    
    if (!client || !appointment) {
      navigate('/totem/home');
      return;
    }

    // Countdown timer - decrementa a cada segundo
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          navigate('/totem/home');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(countdownInterval);
      document.documentElement.classList.remove('totem-mode');
    };
  }, [navigate, client, appointment]);

  const handleGoHome = () => {
    navigate('/totem/home');
  };

  if (!client || !appointment) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 w-screen h-screen flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 font-poppins relative overflow-hidden"
      style={{
        backgroundImage: `url(${barbershopBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-urbana-black/90 via-urbana-black/85 to-urbana-brown/80" />

      {/* Premium background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-emerald-500/15 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-urbana-gold/15 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
      </div>

      <div className="text-center space-y-6 sm:space-y-8 max-w-2xl z-10 relative">
        
        {/* Logo com cantos decorativos - PADRÃO DO TOTEM */}
        <div className="flex justify-center mb-4 animate-scale-in">
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-br from-urbana-gold via-urbana-gold-vibrant to-transparent blur-2xl opacity-30" />
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 p-4 rounded-2xl bg-urbana-black-soft/80 backdrop-blur-sm border-2 border-urbana-gold/50 shadow-2xl overflow-hidden">
              <img 
                src={costaUrbanaLogo} 
                alt="Costa Urbana" 
                className="w-full h-full object-contain"
              />
              {/* Cantos decorativos */}
              <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-urbana-gold rounded-tl-lg" />
              <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-urbana-gold rounded-tr-lg" />
              <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-urbana-gold rounded-bl-lg" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-urbana-gold rounded-br-lg" />
            </div>
          </div>
        </div>

        {/* Success Icon */}
        <div className="flex justify-center animate-scale-in" style={{ animationDelay: '0.1s' }}>
          <div className="relative">
            <div className="absolute -inset-6 bg-gradient-to-br from-emerald-400 via-green-500 to-emerald-600 blur-2xl opacity-40" />
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-emerald-400 via-green-500 to-emerald-600 flex items-center justify-center shadow-2xl border-4 border-emerald-400/30">
              <CheckCircle className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-white" strokeWidth={2.5} />
              <Sparkles className="absolute top-2 right-2 w-5 h-5 text-white/80" />
            </div>
          </div>
        </div>

        {/* Success Message */}
        <div className="space-y-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/40 rounded-full">
              <Crown className="w-4 h-4 text-emerald-400" />
              <span className="text-xs sm:text-sm text-emerald-400 font-bold uppercase tracking-wider">Check-in Confirmado</span>
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-green-400 to-emerald-300">
            Bem-vindo, {client.nome.split(' ')[0]}!
          </h1>
          
          <p className="text-lg sm:text-xl text-urbana-light/80">
            Aguarde confortavelmente, você será chamado em breve ✨
          </p>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          {/* Client Card */}
          <div className="p-4 sm:p-5 bg-urbana-black/60 backdrop-blur-xl border-2 border-urbana-gold/30 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-urbana-gold/20 flex items-center justify-center">
                <User className="w-5 h-5 sm:w-6 sm:h-6 text-urbana-gold" />
              </div>
              <div className="text-left">
                <p className="text-xs text-urbana-light/50 uppercase tracking-wider">Cliente</p>
                <p className="text-lg sm:text-xl font-bold text-urbana-gold truncate">{client.nome}</p>
              </div>
            </div>
          </div>
          
          {/* Barber Card */}
          <div className="p-4 sm:p-5 bg-urbana-black/60 backdrop-blur-xl border-2 border-emerald-500/30 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Scissors className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
              </div>
              <div className="text-left">
                <p className="text-xs text-urbana-light/50 uppercase tracking-wider">Profissional</p>
                <p className="text-lg sm:text-xl font-bold text-emerald-400 truncate">{appointment.barbeiro?.nome}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Service Badge */}
        <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="inline-flex items-center gap-3 px-5 py-3 bg-urbana-gold/10 border-2 border-urbana-gold/40 rounded-xl backdrop-blur-sm">
            <Sparkles className="w-5 h-5 text-urbana-gold" />
            <span className="text-lg sm:text-xl font-bold text-urbana-gold">
              {appointment.servico?.nome}
            </span>
          </div>
        </div>

        {/* Countdown Section */}
        <div className="space-y-4 animate-fade-in" style={{ animationDelay: '0.5s' }}>
          {/* Countdown Circle */}
          <div className="flex justify-center">
            <div className="relative w-20 h-20 sm:w-24 sm:h-24">
              {/* Background circle */}
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="50%"
                  cy="50%"
                  r="45%"
                  fill="none"
                  stroke="rgba(212, 165, 116, 0.2)"
                  strokeWidth="4"
                />
                {/* Progress circle */}
                <circle
                  cx="50%"
                  cy="50%"
                  r="45%"
                  fill="none"
                  stroke="url(#countdownGradient)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${(countdown / 10) * 283} 283`}
                  className="transition-all duration-1000 ease-linear"
                />
                <defs>
                  <linearGradient id="countdownGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#D4A574" />
                    <stop offset="100%" stopColor="#E8C49A" />
                  </linearGradient>
                </defs>
              </svg>
              {/* Countdown number */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl sm:text-3xl font-black text-urbana-gold">{countdown}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-2 text-urbana-light/60">
            <Clock className="w-4 h-4" />
            <span className="text-sm sm:text-base">Voltando à tela inicial em {countdown} segundos</span>
          </div>

          {/* Go Home Button */}
          <Button
            onClick={handleGoHome}
            className="px-6 py-3 h-auto bg-urbana-gold/20 hover:bg-urbana-gold/30 border-2 border-urbana-gold/50 text-urbana-gold font-bold rounded-xl transition-all duration-200 touch-manipulation"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <Home className="w-5 h-5 mr-2" />
            Voltar ao Início
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TotemCheckInSuccess;
