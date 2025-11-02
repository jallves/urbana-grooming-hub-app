import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Zap, User, Scissors, Clock, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ExpressCheckInProps {
  client: any;
  todayAppointment: any;
  onConfirm: () => void;
  onCancel: () => void;
  isProcessing?: boolean;
}

/**
 * Express Mode: Check-in rápido para clientes frequentes
 * Fase 3: Otimização da experiência
 */
export const ExpressCheckIn: React.FC<ExpressCheckInProps> = ({
  client,
  todayAppointment,
  onConfirm,
  onCancel,
  isProcessing = false,
}) => {
  return (
    <div className="animate-scale-in">
      <Card className="bg-gradient-to-br from-urbana-gold/20 to-urbana-gold-dark/10 border-2 border-urbana-gold p-8 mb-6">
        <div className="text-center space-y-6">
          {/* Express Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-urbana-gold/30 rounded-full border border-urbana-gold">
            <Zap className="w-5 h-5 text-urbana-gold animate-pulse" />
            <span className="text-lg font-bold text-urbana-light">EXPRESS MODE</span>
          </div>

          {/* Greeting */}
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-urbana-light mb-2">
              Olá novamente, {client.nome}! 👋
            </h2>
            <p className="text-xl text-urbana-light/70">
              Detectamos seu agendamento de hoje
            </p>
          </div>

          {/* Appointment Info */}
          <div className="bg-urbana-black/40 backdrop-blur-sm rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-center gap-4 text-lg">
              <Clock className="w-6 h-6 text-urbana-gold" />
              <span className="font-semibold text-urbana-light">
                {format(new Date(`2000-01-01T${todayAppointment.hora}`), 'HH:mm')}
              </span>
            </div>

            <div className="flex items-center justify-center gap-4 text-lg">
              <Scissors className="w-6 h-6 text-urbana-gold" />
              <span className="font-semibold text-urbana-light">
                {todayAppointment.servico?.nome}
              </span>
            </div>

            <div className="flex items-center justify-center gap-4 text-lg">
              <User className="w-6 h-6 text-urbana-gold" />
              <span className="font-semibold text-urbana-light">
                {todayAppointment.barbeiro?.nome}
              </span>
            </div>
          </div>

          {/* CTA */}
          <div className="space-y-4">
            <Button
              size="lg"
              onClick={onConfirm}
              disabled={isProcessing}
              className={cn(
                'w-full text-xl py-8 font-bold',
                'bg-urbana-gold text-urbana-black hover:bg-urbana-gold-light',
                'transform transition-all duration-200',
                'hover:scale-105 active:scale-95'
              )}
            >
              {isProcessing ? (
                <>
                  <Zap className="w-6 h-6 mr-3 animate-pulse" />
                  Processando...
                </>
              ) : (
                <>
                  <Zap className="w-6 h-6 mr-3" />
                  Fazer Check-in Rápido
                </>
              )}
            </Button>

            <Button
              size="lg"
              variant="outline"
              onClick={onCancel}
              disabled={isProcessing}
              className="w-full text-lg py-6 border-urbana-gold/30 text-urbana-light hover:bg-urbana-gold/10"
            >
              Ver Todos os Agendamentos
            </Button>
          </div>

          {/* Badge de cliente frequente */}
          <div className="pt-4 border-t border-urbana-gold/20">
            <p className="text-sm text-urbana-light/60 flex items-center justify-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-urbana-gold animate-pulse" />
              Cliente VIP - Acesso Expresso
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
