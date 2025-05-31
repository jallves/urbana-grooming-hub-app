
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useClientAuth } from '@/contexts/ClientAuthContext';
import ClientAppointmentForm from '../appointment/ClientAppointmentForm';

interface Appointment {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  notes: string;
  service: {
    name: string;
    price: number;
    duration: number;
  };
  staff: {
    name: string;
  };
}

interface ClientEditAppointmentProps {
  appointment: Appointment;
  onClose: () => void;
  onSuccess: () => void;
}

export const ClientEditAppointment: React.FC<ClientEditAppointmentProps> = ({
  appointment,
  onClose,
  onSuccess,
}) => {
  const { client } = useClientAuth();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointment.id);

      if (error) {
        toast({
          title: "Erro",
          description: "Não foi possível cancelar o agendamento.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Agendamento cancelado",
          description: "Seu agendamento foi cancelado com sucesso.",
        });
        onSuccess();
      }
    } catch (error) {
      console.error('Error canceling appointment:', error);
      toast({
        title: "Erro",
        description: "Erro interno do sistema.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!client) return null;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-urbana-dark border-urbana-gold/20">
        <DialogHeader>
          <DialogTitle className="text-white">Editar Agendamento</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-white/10 p-4 rounded-lg">
            <h4 className="text-white font-semibold mb-2">Agendamento Atual</h4>
            <p className="text-gray-300 text-sm">
              {appointment.service.name} com {appointment.staff.name}
            </p>
            <p className="text-gray-300 text-sm">
              {new Date(appointment.start_time).toLocaleString('pt-BR')}
            </p>
          </div>

          <p className="text-gray-300 text-sm">
            Para editar este agendamento, você pode cancelá-lo e criar um novo, ou entre em contato conosco.
          </p>

          <div className="flex gap-2">
            <Button
              onClick={handleDelete}
              disabled={isDeleting}
              variant="destructive"
              className="flex-1"
            >
              {isDeleting ? "Cancelando..." : "Cancelar Agendamento"}
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-urbana-gold/50 text-urbana-gold hover:bg-urbana-gold hover:text-white"
            >
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
