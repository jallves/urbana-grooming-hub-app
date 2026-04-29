import React, { useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { toast } from 'sonner';
import { format } from 'date-fns';

import ServiceSelect from '@/components/admin/appointments/form/ServiceSelect';
import StaffSelect from '@/components/admin/appointments/form/StaffSelect';
import NotesField from '@/components/admin/appointments/form/NotesField';
import AppointmentFormActions from '@/components/admin/appointments/form/AppointmentFormActions';
import ClientDateTimePicker from '@/components/client/appointment/ClientDateTimePicker';

import { useClientFormData } from '@/components/client/appointment/useClientFormData';
import { useAppointmentValidation } from '@/hooks/useAppointmentValidation';
import { supabase } from '@/integrations/supabase/client';

interface EditAgendamentoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  agendamento: {
    id: string;
    data: string;          // 'YYYY-MM-DD'
    hora: string;          // 'HH:mm[:ss]'
    servico_id?: string | null;
    barbeiro_id?: string | null;
    notas?: string | null;
  } | null;
}

const parseDateOnly = (iso: string): Date => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

const EditAgendamentoDialog: React.FC<EditAgendamentoDialogProps> = ({
  isOpen,
  onClose,
  onSaved,
  agendamento,
}) => {
  const defaultDate = useMemo(
    () => (agendamento ? parseDateOnly(agendamento.data) : new Date()),
    [agendamento?.id]
  );

  const {
    form,
    isLoading,
    services,
    staffMembers,
    selectedService,
  } = useClientFormData(defaultDate, agendamento?.id);

  const { validateAppointment, isValidating } = useAppointmentValidation();

  // Pre-popula o form quando abrir
  useEffect(() => {
    if (!isOpen || !agendamento) return;
    form.reset({
      service_id: agendamento.servico_id || '',
      staff_id: agendamento.barbeiro_id || '',
      date: parseDateOnly(agendamento.data),
      time: agendamento.hora?.slice(0, 5) || '',
      notes: agendamento.notas || '',
    });
  }, [isOpen, agendamento?.id]);

  const selectedDate = form.watch('date');
  const selectedTime = form.watch('time');
  const selectedStaffId = form.watch('staff_id');

  const onSubmit = async (data: any) => {
    if (!agendamento) return;
    if (!selectedService) {
      toast.error('Selecione um serviço válido.');
      return;
    }

    const validation = await validateAppointment(
      data.staff_id,
      data.date,
      data.time,
      selectedService.duration,
      agendamento.id
    );
    if (!validation.valid) return;

    const dataStr = format(data.date, 'yyyy-MM-dd');

    const { error } = await supabase
      .from('painel_agendamentos')
      .update({
        servico_id: data.service_id,
        barbeiro_id: data.staff_id,
        data: dataStr,
        hora: data.time,
        notas: data.notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', agendamento.id);

    if (error) {
      console.error('Erro ao atualizar agendamento:', error);
      toast.error('Não foi possível atualizar o agendamento.');
      return;
    }

    toast.success('Agendamento atualizado com sucesso!');
    onSaved();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Agendamento</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <ServiceSelect services={services} form={form} />

            <ClientDateTimePicker
              form={form}
              barberId={selectedStaffId}
              serviceDuration={selectedService?.duration}
            />

            <StaffSelect
              staffMembers={staffMembers}
              form={form}
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              serviceDuration={selectedService?.duration}
            />

            <NotesField form={form} />

            <AppointmentFormActions
              isLoading={isLoading || isValidating}
              onClose={onClose}
              isEditing={true}
            />
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditAgendamentoDialog;