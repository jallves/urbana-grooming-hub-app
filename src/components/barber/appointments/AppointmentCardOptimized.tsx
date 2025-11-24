import React, { useState } from 'react';
import { format, parseISO, isFuture, isPast, addMinutes, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Edit, UserX } from 'lucide-react';
import { useBarberAppointmentActionsOptimized } from '@/hooks/barber/useBarberAppointmentActionsOptimized';
import { useBarberDataQuery } from '@/hooks/barber/queries/useBarberDataQuery';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AppointmentCardProps {
  appointment: any;
  onEdit?: (appointmentId: string, startTime: string) => void;
}

const AppointmentCardOptimized: React.FC<AppointmentCardProps> = ({ appointment, onEdit }) => {
  const [showAbsentDialog, setShowAbsentDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const { data: barberData } = useBarberDataQuery();
  const { handleCancelAppointment, handleMarkAsAbsent } = useBarberAppointmentActionsOptimized({ 
    barberId: barberData?.id || null 
  });

  const appointmentDateTime = parseISO(appointment.start_time);
  const now = new Date();
  const oneHourAfter = addMinutes(appointmentDateTime, 60);
  
  const isUpcoming = isFuture(appointmentDateTime);
  const isPastAppointment = isPast(appointmentDateTime);
  const isAfter1Hour = isAfter(now, oneHourAfter); // Passou 1 hora do horário
  
  // Para status "agendado": 
  // - Antes do horário ou até 1h depois: pode editar e cancelar
  // - Depois de 1h do horário: mostra APENAS botão "Ausente"
  const canEdit = appointment.status === 'scheduled' && isUpcoming;
  const canMarkAbsent = appointment.status === 'scheduled' && isAfter1Hour;
  const canCancel = appointment.status === 'scheduled' && !isAfter1Hour;

  const getStatusBadge = () => {
    const badges = {
      completed: { class: 'bg-green-500/20 text-green-400 border-green-500/30', text: 'Concluído' },
      cancelled: { class: 'bg-red-500/20 text-red-400 border-red-500/30', text: 'Cancelado' },
      confirmed: { class: 'bg-blue-500/20 text-blue-400 border-blue-500/30', text: 'Confirmado' },
      absent: { class: 'bg-orange-500/20 text-orange-400 border-orange-500/30', text: 'Ausente' },
      scheduled: { class: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', text: 'Agendado' }
    };
    
    const badge = badges[appointment.status as keyof typeof badges] || badges.scheduled;
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${badge.class}`}>
        {badge.text}
      </span>
    );
  };

  return (
    <>
      <Card className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-all">
        <div className="p-4 space-y-3">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="font-semibold text-white text-lg">{appointment.client_name}</h3>
              <p className="text-sm text-gray-400 mt-1">
                {format(appointmentDateTime, "EEEE, dd 'de' MMMM", { locale: ptBR })}
              </p>
              <p className="text-sm text-urbana-gold font-medium">
                {format(appointmentDateTime, "HH:mm", { locale: ptBR })}
              </p>
            </div>
            {getStatusBadge()}
          </div>

          {/* Service Info */}
          <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
            <span className="text-gray-300">{appointment.service_name}</span>
            <span className="text-urbana-gold font-semibold">
              R$ {appointment.service?.price?.toFixed(2) || '0.00'}
            </span>
          </div>

          {/* Actions */}
          {(canEdit || canMarkAbsent) && (
            <div className="flex flex-wrap gap-2 pt-2">
              {/* Editar (até 40 minutos após o horário) - Abre modal direto */}
              {canEdit && onEdit && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit(appointment.id, appointment.start_time)}
                  disabled={isUpdating}
                  className="flex-1 min-w-[120px] border-blue-600 text-blue-400 hover:bg-blue-600/10"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              )}

              {/* Marcar como Ausente (sempre disponível para agendados passados) */}
              {canMarkAbsent && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAbsentDialog(true)}
                  disabled={isUpdating}
                  className="flex-1 min-w-[120px] border-orange-600 text-orange-400 hover:bg-orange-600/10"
                >
                  <UserX className="h-4 w-4 mr-2" />
                  Ausente
                </Button>
              )}

              {/* Cancelar (até 40 minutos após o horário) */}
              {canCancel && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowCancelDialog(true)}
                  disabled={isUpdating}
                  className="flex-1 min-w-[120px] border-red-600 text-red-400 hover:bg-red-600/10"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Dialog de confirmação para CANCELAR */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent className="bg-gray-800 border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Cancelar agendamento?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Esta ação irá marcar o agendamento como cancelado.
              <strong className="text-red-400 block mt-2">
                Tem certeza que deseja cancelar este agendamento?
              </strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-700 text-white hover:bg-gray-600">
              Não, voltar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                setIsUpdating(true);
                await handleCancelAppointment(appointment.id);
                setIsUpdating(false);
                setShowCancelDialog(false);
              }}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Sim, cancelar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de confirmação para marcar como AUSENTE */}
      <AlertDialog open={showAbsentDialog} onOpenChange={setShowAbsentDialog}>
        <AlertDialogContent className="bg-gray-800 border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Marcar cliente como ausente?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Esta ação marcará que o cliente não compareceu ao agendamento. 
              <strong className="text-orange-400 block mt-2">
                Não será gerada receita nem comissão para este agendamento.
              </strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-700 text-white hover:bg-gray-600">
              Não, voltar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                setIsUpdating(true);
                await handleMarkAsAbsent(appointment.id);
                setIsUpdating(false);
                setShowAbsentDialog(false);
              }}
              className="bg-orange-600 text-white hover:bg-orange-700"
            >
              Sim, marcar ausente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AppointmentCardOptimized;
