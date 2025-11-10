import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Calendar } from 'lucide-react';

const CreateTestAppointmentButton: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);

  const createAppointment = async () => {
    setIsLoading(true);
    
    try {
      console.log('🚀 Criando agendamento de teste...');
      
      const { data, error } = await supabase.functions.invoke('create-test-appointment', {
        body: {},
      });

      if (error) {
        console.error('❌ Erro na edge function:', error);
        throw new Error(error.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Erro desconhecido ao criar agendamento');
      }

      console.log('✅ Agendamento criado:', data);

      toast.success('Agendamento de teste criado!', {
        description: `
          📅 ${data.data.horario}
          👤 Cliente: ${data.data.cliente}
          ✂️ Serviço: ${data.data.servico}
          💈 Barbeiro: ${data.data.barbeiro}
        `,
        duration: 8000,
      });

    } catch (error: any) {
      console.error('💥 Erro ao criar agendamento:', error);
      toast.error('Erro ao criar agendamento de teste', {
        description: error.message || 'Erro desconhecido',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={createAppointment}
      disabled={isLoading}
      variant="default"
      className="gap-2"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Criando agendamento...
        </>
      ) : (
        <>
          <Calendar className="h-4 w-4" />
          Criar Agendamento de Teste
        </>
      )}
    </Button>
  );
};

export default CreateTestAppointmentButton;
