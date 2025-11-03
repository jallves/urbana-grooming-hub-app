import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Calendar, Clock, User, Scissors, Home, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import costaUrbanaLogo from '@/assets/costa-urbana-logo.png';

const TotemAgendamentoSucesso: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { appointment, service, barber, client } = location.state || {};

  useEffect(() => {
    if (!appointment) {
      navigate('/totem/home');
    }
  }, [appointment, navigate]);

  const handleGoHome = () => {
    navigate('/totem/home');
  };

  const handleNewAppointment = () => {
    navigate('/totem/search');
  };

  if (!appointment) return null;

  return (
    <div className="fixed inset-0 w-screen h-screen bg-gradient-to-br from-urbana-black via-urbana-brown/10 to-urbana-black flex items-center justify-center p-3 sm:p-4 md:p-6 lg:p-8 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-urbana-gold/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-urbana-gold-vibrant/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative max-w-4xl w-full space-y-6 sm:space-y-8 animate-fade-in">
        {/* Logo */}
        <div className="flex justify-center mb-6 sm:mb-8">
          <img 
            src={costaUrbanaLogo} 
            alt="Costa Urbana Logo" 
            className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 object-contain animate-scale-in"
          />
        </div>

        {/* Success Icon */}
        <div className="flex justify-center animate-scale-in" style={{ animationDelay: '0.2s' }}>
          <div className="relative">
            <div className="absolute inset-0 bg-green-500/30 rounded-full blur-2xl animate-pulse" />
            <div className="relative w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 text-white" />
            </div>
          </div>
        </div>

        {/* Success Message */}
        <div className="text-center space-y-2 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-urbana-light">
            Agendamento Confirmado!
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-urbana-light/70">
            Seu horário foi reservado com sucesso
          </p>
        </div>

        {/* Appointment Details Card */}
        <Card className="bg-gradient-to-br from-urbana-black-soft/90 to-urbana-black-soft/70 backdrop-blur-sm border-2 border-urbana-gold/30 p-6 sm:p-8 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="space-y-6">
            {/* Client Info */}
            <div className="text-center pb-4 border-b border-urbana-gray/20">
              <p className="text-sm sm:text-base text-urbana-light/60">Cliente</p>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-urbana-gold">
                {client?.nome}
              </p>
            </div>

            {/* Appointment Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Service */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-urbana-gold/20 flex items-center justify-center flex-shrink-0">
                  <Scissors className="w-6 h-6 sm:w-7 sm:h-7 text-urbana-gold" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-urbana-light/60 mb-1">Serviço</p>
                  <p className="text-base sm:text-lg md:text-xl font-semibold text-urbana-light">
                    {service?.nome}
                  </p>
                  <p className="text-sm text-urbana-gold mt-1">
                    R$ {service?.preco.toFixed(2)} • {service?.duracao} min
                  </p>
                </div>
              </div>

              {/* Barber */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-urbana-gold/20 flex items-center justify-center flex-shrink-0">
                  <User className="w-6 h-6 sm:w-7 sm:h-7 text-urbana-gold" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-urbana-light/60 mb-1">Barbeiro</p>
                  <p className="text-base sm:text-lg md:text-xl font-semibold text-urbana-light">
                    {barber?.nome}
                  </p>
                </div>
              </div>

              {/* Date */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-urbana-gold/20 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-6 h-6 sm:w-7 sm:h-7 text-urbana-gold" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-urbana-light/60 mb-1">Data</p>
                  <p className="text-base sm:text-lg md:text-xl font-semibold text-urbana-light">
                    {format(new Date(appointment.data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                </div>
              </div>

              {/* Time */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-urbana-gold/20 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 sm:w-7 sm:h-7 text-urbana-gold" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-urbana-light/60 mb-1">Horário</p>
                  <p className="text-base sm:text-lg md:text-xl font-semibold text-urbana-light">
                    {appointment.hora}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Important Message */}
        <Card className="bg-urbana-gold/10 border-urbana-gold/30 p-4 sm:p-6 animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <p className="text-center text-sm sm:text-base text-urbana-light">
            📱 <strong>Importante:</strong> Chegue 10 minutos antes do horário agendado.
            <br />
            Em caso de atraso ou cancelamento, avise com antecedência.
          </p>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <Button
            onClick={handleNewAppointment}
            variant="outline"
            className="h-14 sm:h-16 text-base sm:text-lg font-semibold gap-2 border-urbana-gold/50 text-urbana-gold hover:bg-urbana-gold/10"
          >
            <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
            Novo Agendamento
            <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </Button>

          <Button
            onClick={handleGoHome}
            className="h-14 sm:h-16 text-base sm:text-lg font-semibold gap-2 bg-urbana-gold hover:bg-urbana-gold-vibrant text-urbana-black"
          >
            <Home className="w-5 h-5 sm:w-6 sm:h-6" />
            Voltar ao Início
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TotemAgendamentoSucesso;
