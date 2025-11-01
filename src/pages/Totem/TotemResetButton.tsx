import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RotateCcw } from 'lucide-react';

export const TotemResetButton = () => {
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = async () => {
    try {
      setIsResetting(true);

      // Get the most recent appointment with a totem session
      const { data: appointments, error: queryError } = await supabase
        .from('painel_agendamentos')
        .select(`
          id,
          data,
          hora,
          painel_clientes!inner(nome),
          totem_sessions!inner(id, status)
        `)
        .order('created_at', { ascending: false })
        .limit(1);

      if (queryError) throw queryError;

      if (!appointments || appointments.length === 0) {
        toast.error('Nenhum agendamento encontrado para resetar');
        return;
      }

      const appointmentId = appointments[0].id;

      // Call edge function to reset
      const { data, error } = await supabase.functions.invoke('totem-reset-appointment', {
        body: { appointment_id: appointmentId }
      });

      if (error) throw error;

      toast.success('Agendamento resetado com sucesso!');
      
      // Reload the page after a short delay
      setTimeout(() => {
        window.location.href = '/totem/home';
      }, 1000);

    } catch (error) {
      console.error('Error resetting appointment:', error);
      toast.error('Erro ao resetar agendamento');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <Button
      onClick={handleReset}
      disabled={isResetting}
      variant="outline"
      size="sm"
      className="fixed bottom-4 right-4 z-50"
    >
      <RotateCcw className="w-4 h-4 mr-2" />
      {isResetting ? 'Resetando...' : 'Resetar Último Agendamento'}
    </Button>
  );
};
