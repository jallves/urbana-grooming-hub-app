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
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <Card className="w-full max-w-3xl p-16 space-y-12 bg-card text-center">
        {/* Success Icon */}
        <div className="flex justify-center">
          <div className="w-40 h-40 rounded-full bg-green-500/20 flex items-center justify-center">
            <CheckCircle className="w-24 h-24 text-green-500" />
          </div>
        </div>

        {/* Success Message */}
        <div className="space-y-6">
          <h1 className="text-6xl font-bold text-foreground">
            Check-in Realizado!
          </h1>
          <p className="text-4xl text-muted-foreground">
            Olá, <span className="text-urbana-gold font-bold">{client.nome}</span>
          </p>
          <p className="text-3xl text-muted-foreground">
            Seu barbeiro <span className="font-semibold">{appointment.barbeiro?.nome}</span>
            <br />
            irá chamá-lo em breve.
          </p>
        </div>

        {/* Service Info */}
        <div className="pt-8 pb-4 border-t border-border">
          <p className="text-2xl text-muted-foreground mb-2">Serviço agendado</p>
          <p className="text-4xl font-bold text-urbana-gold">
            {appointment.servico?.nome}
          </p>
        </div>

        {/* Auto return message */}
        <p className="text-xl text-muted-foreground animate-pulse">
          Retornando ao início em 5 segundos...
        </p>
      </Card>
    </div>
  );
};

export default TotemCheckInSuccess;
