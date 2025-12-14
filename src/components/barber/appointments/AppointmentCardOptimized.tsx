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
  
  // Barbeiro pode editar sem limite de horário (diferente do cliente)
  // Para status "agendado" ou "confirmado":
  // - Pode editar se ainda não passou
  // - Depois de 1h do horário: mostra botão "Ausente"
  const canEdit = (appointment.status === 'scheduled' || appointment.status === 'confirmed') && !isAfter1Hour;
  const canMarkAbsent = (appointment.status === 'scheduled' || appointment.status === 'confirmed') && isAfter1Hour;
  const canCancel = (appointment.status === 'scheduled' || appointment.status === 'confirmed') && !isAfter1Hour;

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
        <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
          {/* Header - Responsivo */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white text-base sm:text-lg truncate">
                {appointment.client_name}
              </h3>
              <p className="text-xs sm:text-sm text-gray-400 mt-0.5 sm:mt-1 truncate">
                {format(appointmentDateTime, "EEEE, dd 'de' MMMM", { locale: ptBR })}
              </p>
              <p className="text-xs sm:text-sm text-urbana-gold font-medium mt-0.5">
                {format(appointmentDateTime, "HH:mm", { locale: ptBR })}
              </p>
            </div>
            <div className="flex-shrink-0 self-start">
              {getStatusBadge()}
            </div>
          </div>

          {/* Service Info - Responsivo */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-2.5 sm:p-3 bg-gray-700/50 rounded-lg">
            <span className="text-xs sm:text-sm text-gray-300 truncate flex-1">
              {appointment.service_name}
            </span>
            <span className="text-sm sm:text-base text-urbana-gold font-semibold flex-shrink-0">
              R$ {appointment.service?.price?.toFixed(2) || '0.00'}
            </span>
          </div>

          {/* Actions - Mobile First */}
          {(canEdit || canMarkAbsent) && (
            <div className="flex flex-col sm:flex-row gap-2 pt-1 sm:pt-2">
              {/* Editar */}
              {canEdit && onEdit && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit(appointment.id, appointment.start_time)}
                  disabled={isUpdating}
                  className="w-full sm:flex-1 h-9 sm:h-8 border-blue-600 text-blue-400 hover:bg-blue-600/10 text-xs sm:text-sm touch-manipulation"
                >
                  <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  Editar
                </Button>
              )}

              {/* Marcar como Ausente */}
              {canMarkAbsent && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAbsentDialog(true)}
                  disabled={isUpdating}
                  className="w-full sm:flex-1 h-9 sm:h-8 border-orange-600 text-orange-400 hover:bg-orange-600/10 text-xs sm:text-sm touch-manipulation"
                >
                  <UserX className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  Ausente
                </Button>
              )}

              {/* Cancelar */}
              {canCancel && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowCancelDialog(true)}
                  disabled={isUpdating}
                  className="w-full sm:flex-1 h-9 sm:h-8 border-red-600 text-red-400 hover:bg-red-600/10 text-xs sm:text-sm touch-manipulation"
                >
                  <X className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  Cancelar
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Dialog de confirmação para CANCELAR - Responsivo */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent className="bg-gray-800 border-gray-700 w-[90vw] max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white text-base sm:text-lg">
              Cancelar agendamento?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400 text-sm">
              Esta ação irá marcar o agendamento como cancelado.
              <strong className="text-red-400 block mt-2">
                Tem certeza que deseja cancelar este agendamento?
              </strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="bg-gray-700 text-white hover:bg-gray-600 w-full sm:w-auto h-10 sm:h-9 text-sm touch-manipulation">
              Não, voltar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                setIsUpdating(true);
                await handleCancelAppointment(appointment.id);
                setIsUpdating(false);
                setShowCancelDialog(false);
              }}
              className="bg-red-600 text-white hover:bg-red-700 w-full sm:w-auto h-10 sm:h-9 text-sm touch-manipulation"
            >
              Sim, cancelar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de confirmação para marcar como AUSENTE - Responsivo */}
      <AlertDialog open={showAbsentDialog} onOpenChange={setShowAbsentDialog}>
        <AlertDialogContent className="bg-gray-800 border-gray-700 w-[90vw] max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white text-base sm:text-lg">
              Marcar cliente como ausente?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400 text-sm">
              Esta ação marcará que o cliente não compareceu ao agendamento. 
              <strong className="text-orange-400 block mt-2">
                Não será gerada receita nem comissão para este agendamento.
              </strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="bg-gray-700 text-white hover:bg-gray-600 w-full sm:w-auto h-10 sm:h-9 text-sm touch-manipulation">
              Não, voltar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                setIsUpdating(true);
                await handleMarkAsAbsent(appointment.id);
                setIsUpdating(false);
                setShowAbsentDialog(false);
              }}
              className="bg-orange-600 text-white hover:bg-orange-700 w-full sm:w-auto h-10 sm:h-9 text-sm touch-manipulation"
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
