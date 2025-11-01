import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

const TotemCheckInSuccess: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { client, appointment } = location.state || {};

  useEffect(() => {
    // Retorna para home após 5 segundos
    const timer = setTimeout(() => {
      navigate('/totem');
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  if (!client || !appointment) {
    navigate('/totem');
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6 md:p-8">
      <Card className="w-full max-w-3xl p-8 sm:p-12 md:p-16 space-y-8 sm:space-y-10 md:space-y-12 bg-card text-center">
        {/* Success Icon */}
        <div className="flex justify-center">
          <div className="w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40 rounded-full bg-primary/20 flex items-center justify-center">
            <CheckCircle className="w-20 h-20 sm:w-22 sm:h-22 md:w-24 md:h-24 text-primary" />
          </div>
        </div>

        {/* Success Message */}
        <div className="space-y-4 sm:space-y-5 md:space-y-6">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground">
            Check-in Realizado!
          </h1>
          <p className="text-3xl sm:text-3xl md:text-4xl text-muted-foreground">
            Olá, <span className="text-urbana-gold font-bold">{client.nome}</span>
          </p>
          <p className="text-2xl sm:text-2xl md:text-3xl text-muted-foreground">
            Seu barbeiro <span className="font-semibold">{appointment.barbeiro?.nome}</span>
            <br />
            irá chamá-lo em breve.
          </p>
        </div>

        {/* Service Info */}
        <div className="pt-6 sm:pt-7 md:pt-8 pb-3 sm:pb-3 md:pb-4 border-t border-border">
          <p className="text-xl sm:text-xl md:text-2xl text-muted-foreground mb-2">Serviço agendado</p>
          <p className="text-3xl sm:text-3xl md:text-4xl font-bold text-urbana-gold">
            {appointment.servico?.nome}
          </p>
        </div>

        {/* Auto return message */}
        <p className="text-lg sm:text-lg md:text-xl text-muted-foreground animate-pulse">
          Retornando ao início em 5 segundos...
        </p>
      </Card>
    </div>
  );
};

export default TotemCheckInSuccess;
