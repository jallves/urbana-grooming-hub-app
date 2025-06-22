
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
    services,
    barbers,
    loading,
  } = useClientFormData();

  const { loading: submitLoading, isSending, onSubmit } = useAppointmentSubmit();

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
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ServiceSelect 
              services={services}
            />
            
            <BarbershopStaffSelect 
              staffMembers={barbers}
            />
          </div>

          <EnhancedDateTimePicker
            showAdvanced={showAdvanced}
            onToggleAdvanced={() => setShowAdvanced(!showAdvanced)}
          />

          <NotesField />
          
          <AppointmentFormActions 
            isLoading={isSending}
            onCancel={() => {}}
          />
        </form>
      </CardContent>
    </Card>
  );
};

export default ClientAppointmentForm;
