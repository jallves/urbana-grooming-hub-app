
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useClientFormData } from './client/hooks/useClientFormData';
import { useAppointmentSubmit } from './hooks/useAppointmentSubmit';
import ServiceSelect from './client/ServiceSelect';
import BarbershopStaffSelect from './client/BarbershopStaffSelect';
import EnhancedDateTimePicker from './client/EnhancedDateTimePicker';
import NotesField from './client/NotesField';
import AppointmentFormActions from './client/AppointmentFormActions';
import { Loader2 } from 'lucide-react';

interface ClientAppointmentFormProps {
  clientName?: string;
  onSuccess?: () => void;
}

const ClientAppointmentForm: React.FC<ClientAppointmentFormProps> = ({
  clientName = '',
  onSuccess
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const {
    form,
    isLoading,
    services,
    staffMembers,
    selectedService,
  } = useClientFormData(clientName);

  const { handleSubmit, isSubmitting } = useAppointmentSubmit(onSuccess);

  if (isLoading) {
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
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ServiceSelect 
              form={form} 
              services={services} 
              isLoading={isLoading} 
            />
            
            <BarbershopStaffSelect 
              form={form} 
              staffMembers={staffMembers} 
              isLoading={isLoading} 
            />
          </div>

          <EnhancedDateTimePicker
            form={form}
            selectedService={selectedService}
            showAdvanced={showAdvanced}
            onToggleAdvanced={() => setShowAdvanced(!showAdvanced)}
          />

          <NotesField form={form} />
          
          <AppointmentFormActions 
            isSubmitting={isSubmitting}
            onCancel={() => form.reset()}
          />
        </form>
      </CardContent>
    </Card>
  );
};

export default ClientAppointmentForm;
