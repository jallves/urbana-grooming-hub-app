
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useDisabledDays = () => {
  const { toast } = useToast();
  const [disabledDays, setDisabledDays] = useState<Date[]>([]);

  useEffect(() => {
    const fetchDisabledDays = async () => {
      try {
        const { data, error } = await supabase
          .from('appointments')
          .select('start_time');

        if (error) {
          console.error("Erro ao buscar datas agendadas:", error);
          toast({
            title: "Erro",
            description: "Não foi possível carregar as datas agendadas.",
            variant: "destructive",
          });
          return;
        }

        if (data) {
          const disabledDates = data.map(item => {
            const date = new Date(item.start_time);
            date.setHours(0, 0, 0, 0); // Reset time to midnight
            return date;
          });
          setDisabledDays(disabledDates);
        }
      } catch (error) {
        console.error("Erro ao buscar datas agendadas:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar as datas agendadas.",
          variant: "destructive",
        });
      }
    };

    fetchDisabledDays();
  }, [toast]);

  // Create disabled days function
  const isDisabledDay = (date: Date) => {
    return disabledDays.some(disabledDate => 
      disabledDate.getTime() === date.getTime()
    );
  };

  return { disabledDays: isDisabledDay };
};
