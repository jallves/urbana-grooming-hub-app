
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useClientFormData } from './client/hooks/useClientFormData';
import ServiceSelect from './client/ServiceSelect';
import BarbershopStaffSelect from './client/BarbershopStaffSelect';
import EnhancedDateTimePicker from './client/EnhancedDateTimePicker';
import NotesField from './client/NotesField';
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

  const handleSubmit = (data: any) => {
    console.log('Form submitted:', data);
    // Handle form submission here
    onSuccess?.();
  };

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
              services={services}
              form={form}
            />
            
            <BarbershopStaffSelect 
              staffMembers={staffMembers}
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
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
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
      </CardContent>
    </Card>
  );
};

export default ClientAppointmentForm;
