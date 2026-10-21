
import React from 'react';
import { DialogContent, DialogHeader, DialogTitle, Dialog } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { AlertTriangle, Info } from 'lucide-react';
import { useAppointmentFormData } from './form/useAppointmentFormData';
import { useAppointmentFormSubmit } from './form/useAppointmentFormSubmit';
import ClientSelect from './form/ClientSelect';
import ServiceSelect from './form/ServiceSelect';
import StaffSelect from './form/StaffSelect';
import DateTimePicker from './form/DateTimePicker';
import NotesField from './form/NotesField';
import CouponField from './form/CouponField';
import AppointmentFormActions from './form/AppointmentFormActions';

interface AppointmentFormProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate?: Date;
  appointmentId?: string;
}

const AppointmentForm: React.FC<AppointmentFormProps> = ({ 
  isOpen, 
  onClose,
  defaultDate = new Date(),
  appointmentId
}) => {
  const {
    form,
    isLoading: isFormLoading,
    services,
    staffMembers,
    clients,
    selectedService,
    appointmentStatus
  } = useAppointmentFormData(appointmentId, defaultDate);
  
  const { handleSubmit, isLoading: isSubmitLoading } = useAppointmentFormSubmit({
    appointmentId,
    onClose
  });
  
  const isLoading = isFormLoading || isSubmitLoading;
  
  const onSubmit = async (data: any) => {
    await handleSubmit(data, selectedService);
  };

  const selectedDate = form.watch('date');
  const selectedTime = form.watch('time');
  const selectedStaffId = form.watch('staff_id');

  // Avisos para o administrador
  const isFinishedStatus = ['concluido', 'finalizado', 'cancelado', 'ausente', 'faltou'].includes(
    (appointmentStatus || '').toLowerCase()
  );
  const isEditingUnfinished = !!appointmentId && !!appointmentStatus && !isFinishedStatus;

  const isRetroactive = React.useMemo(() => {
    if (!selectedDate || !selectedTime) return false;
    const [h, m] = String(selectedTime).split(':').map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return false;
    const dt = new Date(selectedDate);
    dt.setHours(h, m, 0, 0);
    return dt.getTime() < Date.now();
  }, [selectedDate, selectedTime]);
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-w-[95vw] max-h-[90vh] overflow-y-auto mx-4">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            {appointmentId ? 'Editar Agendamento' : 'Novo Agendamento'}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {isEditingUnfinished && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                <Info className="h-4 w-4 mt-0.5 shrink-0" />
                <p>
                  <span className="font-semibold">Atenção:</span> este agendamento ainda não foi finalizado
                  (status atual: <span className="font-medium">{appointmentStatus}</span>). As alterações de
                  data, horário, serviço ou profissional serão aplicadas imediatamente e o cliente será
                  notificado por e-mail.
                </p>
              </div>
            )}

            {isRetroactive && (
              <div className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-900">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <p>
                  <span className="font-semibold">Data/horário retroativo:</span> você está
                  {appointmentId ? ' movendo este agendamento' : ' criando um agendamento'} para uma data ou
                  horário que já passou. Confira se é isso mesmo que deseja antes de salvar.
                </p>
              </div>
            )}

            <ClientSelect clients={clients} form={form} />
            
            <ServiceSelect services={services} form={form} />
            
            <DateTimePicker 
              form={form}
              barberId={selectedStaffId}
              serviceDuration={selectedService?.duration}
              skipPastValidation={true}
              appointmentId={appointmentId}
            />
            
            <StaffSelect 
              staffMembers={staffMembers} 
              form={form} 
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              serviceDuration={selectedService?.duration}
              appointmentId={appointmentId}
            />
            
            <NotesField form={form} />
            
            {appointmentId && (
              <CouponField 
                form={form} 
                appointmentId={appointmentId}
                servicePrice={selectedService?.price}
              />
            )}
            
            <AppointmentFormActions 
              isLoading={isLoading} 
              onClose={onClose} 
              isEditing={!!appointmentId} 
            />
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentForm;
