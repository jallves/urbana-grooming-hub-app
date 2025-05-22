
import React, { useEffect, useState } from 'react';
import { DialogContent, DialogHeader, DialogTitle, Dialog } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import DateTimePicker from '@/components/admin/appointments/form/DateTimePicker';

interface BarberAppointmentFormProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate?: Date;
  appointmentId?: string; 
  dateTimeOnly?: boolean;
}

const BarberAppointmentForm: React.FC<BarberAppointmentFormProps> = ({ 
  isOpen, 
  onClose,
  defaultDate = new Date(),
  appointmentId,
  dateTimeOnly = true // By default, only allow date/time editing
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [appointmentData, setAppointmentData] = useState<any>(null);
  
  const form = useForm({
    defaultValues: {
      date: defaultDate,
      time: defaultDate ? `${String(defaultDate.getHours()).padStart(2, '0')}:${String(defaultDate.getMinutes()).padStart(2, '0')}` : '10:00',
    }
  });
  
  // Fetch the existing appointment data
  useEffect(() => {
    const fetchAppointmentData = async () => {
      if (!appointmentId) return;
      
      setIsLoading(true);
      try {
        const { data: appointment, error } = await supabase
          .from('appointments')
          .select(`
            *,
            services:service_id (*),
            clients:client_id (*),
            staff:staff_id (*)
          `)
          .eq('id', appointmentId)
          .single();
          
        if (error) throw error;
        
        if (appointment) {
          setAppointmentData(appointment);
          
          // Parse date and time from start_time
          const startDate = new Date(appointment.start_time);
          
          form.reset({
            date: startDate,
            time: `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`,
          });
        }
      } catch (error) {
        console.error('Error fetching appointment:', error);
        toast.error('Não foi possível carregar os dados do agendamento');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAppointmentData();
  }, [appointmentId, form]);
  
  const onSubmit = async (data: any) => {
    if (!appointmentId || !appointmentData) return;
    
    try {
      setIsLoading(true);
      
      // Format the date and time
      const [hours, minutes] = data.time.split(':').map(Number);
      const startDate = new Date(data.date);
      startDate.setHours(hours, minutes, 0, 0);
      
      // Calculate end time based on service duration
      const endDate = new Date(startDate);
      endDate.setMinutes(endDate.getMinutes() + (appointmentData.services?.duration || 60));
      
      const updateData = {
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
      };
      
      // Update only the date/time of the appointment
      const { error } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', appointmentId);
        
      if (error) throw error;
      
      toast.success('Agendamento atualizado com sucesso');
      onClose();
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast.error('Não foi possível atualizar o agendamento');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            Reagendar Horário
          </DialogTitle>
        </DialogHeader>
        
        {appointmentData && (
          <div className="mb-4">
            <div className="grid gap-2">
              <div>
                <span className="font-medium">Cliente:</span> {appointmentData.clients?.name}
              </div>
              <div>
                <span className="font-medium">Serviço:</span> {appointmentData.services?.name}
              </div>
              <div>
                <span className="font-medium">Profissional:</span> {appointmentData.staff?.name}
              </div>
              <div>
                <span className="font-medium">Duração:</span> {appointmentData.services?.duration} minutos
              </div>
            </div>
          </div>
        )}
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <DateTimePicker form={form} />
            
            <div className="flex justify-end space-x-2 pt-4">
              <button 
                type="button"
                onClick={onClose}
                className="px-4 py-2 border rounded-md"
              >
                Cancelar
              </button>
              
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                disabled={isLoading}
              >
                {isLoading ? 'Salvando...' : 'Reagendar'}
              </button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default BarberAppointmentForm;
