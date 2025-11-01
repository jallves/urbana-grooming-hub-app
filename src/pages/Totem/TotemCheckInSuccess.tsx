import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, User, Scissors } from 'lucide-react';

const TotemCheckInSuccess: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { client, appointment } = location.state || {};

  useEffect(() => {
    // Add totem-mode class for touch optimization
    document.documentElement.classList.add('totem-mode');
    
    if (!client || !appointment) {
      navigate('/totem');
      return;
    }

    // Automatically redirect after 5 seconds
    const timer = setTimeout(() => {
      navigate('/totem');
    }, 5000);

    return () => {
      clearTimeout(timer);
      document.documentElement.classList.remove('totem-mode');
    };
  }, [navigate, client, appointment]);

  if (!client || !appointment) {
    return null;
  }

  return (
    <div className="fixed inset-0 w-screen h-screen bg-urbana-black flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 font-poppins relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-urbana-black via-urbana-brown/20 to-urbana-black opacity-50" />
      
      {/* Animated circles */}
      <div className="absolute top-1/4 left-1/4 w-48 h-48 sm:w-64 sm:h-64 md:w-96 md:h-96 bg-urbana-gold/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-48 h-48 sm:w-64 sm:h-64 md:w-96 md:h-96 bg-urbana-gold/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="text-center space-y-6 sm:space-y-8 md:space-y-10 max-w-xl sm:max-w-2xl md:max-w-3xl z-10 animate-fade-in">
        {/* Success Icon */}
        <div className="flex justify-center mb-4 sm:mb-6 md:mb-8">
          <div className="relative">
            <div className="absolute inset-0 bg-green-500 blur-3xl opacity-40 animate-pulse" />
            <div className="relative w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-2xl border-4 border-green-400/20">
              <CheckCircle className="w-14 h-14 sm:w-18 sm:h-18 md:w-24 md:h-24 text-white" strokeWidth={3} />
            </div>
          </div>
        </div>

        {/* Success Message */}
        <div className="space-y-4 sm:space-y-5 md:space-y-6">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-urbana-light">
            Check-in realizado!
          </h1>
          
          <div className="space-y-3 sm:space-y-4 text-base sm:text-lg md:text-xl lg:text-2xl text-urbana-light/70">
            <p className="flex items-center justify-center gap-2 sm:gap-3 md:gap-4">
              <User className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-urbana-gold" />
              <span>
                Bem-vindo, <span className="text-urbana-gold font-bold">{client.nome}</span>
              </span>
            </p>
            
            <p className="flex items-center justify-center gap-2 sm:gap-3 md:gap-4">
              <Scissors className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-urbana-gold" />
              <span>
                Seu barbeiro <span className="text-urbana-gold font-bold">{appointment.barbeiro?.nome}</span> foi notificado
              </span>
            </p>
          </div>

          <div className="pt-4 sm:pt-6 md:pt-8">
            <div className="inline-block px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 bg-urbana-gold/10 rounded-xl sm:rounded-2xl border-2 border-urbana-gold/30">
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-urbana-gold">
                {appointment.servico?.nome}
              </p>
            </div>
          </div>
        </div>

        {/* Auto redirect message */}
        <div className="pt-6 sm:pt-8 md:pt-12 space-y-3 sm:space-y-4">
          <div className="flex items-center justify-center gap-2 sm:gap-3">
            <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-urbana-gold animate-pulse" />
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-urbana-light/60">
              Retornando automaticamente em alguns segundos...
            </p>
          </div>
          
          <p className="text-xs sm:text-sm md:text-base lg:text-lg text-urbana-light/40">
            Aguarde confortavelmente na recepção
          </p>
        </div>
      </div>
    </div>
  );
};

export default TotemCheckInSuccess;
