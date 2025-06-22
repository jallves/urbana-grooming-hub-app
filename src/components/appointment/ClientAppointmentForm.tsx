
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { useClientFormData } from './client/hooks/useClientFormData';
import ServiceSelect from './client/ServiceSelect';
import BarbershopStaffSelect from './client/BarbershopStaffSelect';
import EnhancedDateTimePicker from './client/EnhancedDateTimePicker';
import NotesField from './client/NotesField';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const formSchema = z.object({
  service_id: z.string().min(1, 'Serviço é obrigatório'),
  staff_id: z.string().min(1, 'Barbeiro é obrigatório'),
  date: z.date({
    required_error: 'Data é obrigatória',
  }),
  time: z.string().min(1, 'Horário é obrigatório'),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface ClientAppointmentFormProps {
  clientName?: string;
  onSuccess?: () => void;
  clientId?: string;
}

const ClientAppointmentForm: React.FC<ClientAppointmentFormProps> = ({
  clientName = '',
  onSuccess,
  clientId
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  
  const { services, barbers, loading } = useClientFormData();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      service_id: '',
      staff_id: '',
      date: undefined,
      time: '',
      notes: '',
    },
  });

  const handleSubmit = async (data: FormData) => {
    if (!clientId) {
      toast({
        title: "Erro",
        description: "ID do cliente não foi fornecido.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      // Find selected service for duration calculation
      const service = services.find(s => s.id === data.service_id);
      if (!service) {
        throw new Error('Serviço não encontrado');
      }

      // Create start time
      const [hours, minutes] = data.time.split(':').map(Number);
      const startTime = new Date(data.date);
      startTime.setHours(hours, minutes, 0, 0);

      // Calculate end time
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + service.duration);

      // Create appointment object
      const appointmentData = {
        client_id: clientId,
        service_id: data.service_id,
        staff_id: data.staff_id,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        status: 'scheduled',
        notes: data.notes || null,
      };

      const { error } = await supabase
        .from('appointments')
        .insert([appointmentData]);

      if (error) throw error;

      toast({
        title: "Agendamento criado!",
        description: "Seu agendamento foi criado com sucesso.",
      });

      onSuccess?.();
    } catch (error: any) {
      console.error('Erro ao criar agendamento:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível criar o agendamento.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando dados...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agendar Horário</CardTitle>
        <CardDescription>
          Preencha os dados para fazer seu agendamento
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ServiceSelect 
                services={services}
                form={form}
                onServiceChange={(serviceId) => {
                  const service = services.find(s => s.id === serviceId);
                  setSelectedService(service);
                }}
              />
              
              <BarbershopStaffSelect 
                staffMembers={barbers}
                form={form}
              />
            </div>

            <EnhancedDateTimePicker
              form={form}
              showAdvanced={showAdvanced}
              onToggleAdvanced={() => setShowAdvanced(!showAdvanced)}
            />

            <NotesField form={form} />
            
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {}}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="flex-1"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Agendando...
                  </>
                ) : (
                  'Confirmar Agendamento'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default ClientAppointmentForm;
