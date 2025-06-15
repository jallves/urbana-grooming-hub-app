
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Service, StaffMember } from '@/types/appointment';

// StaffMember should have id: number
export const useAppointmentData = () => {
  const { toast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  // Make sure StaffMember uses id: number
  const [barbers, setBarbers] = useState<StaffMember[]>([]);
  const [loadingBarbers, setLoadingBarbers] = useState(false);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const { data, error } = await supabase
          .from('services')
          .select('*')
          .eq('is_active', true)
          .order('name', { ascending: true });

        if (error) {
          console.error("Erro ao buscar serviços:", error);
          toast({
            title: "Erro",
            description: "Não foi possível carregar os serviços.",
            variant: "destructive",
          });
        }

        if (data) {
          setServices(data);
        }
      } catch (error) {
        console.error("Erro ao buscar serviços:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os serviços.",
          variant: "destructive",
        });
      }
    };

    fetchServices();
  }, [toast]);

  useEffect(() => {
    const fetchBarbersWithFallback = async () => {
      setLoadingBarbers(true);
      try {
        const { data, error } = await supabase
          .from('staff_sequencial')
          .select('*')
          .eq('is_active', true)
          .eq('role', 'barber')
          .order('name', { ascending: true });

        let filtered =
          Array.isArray(data)
            ? data.map((b) => ({
                ...b,
                id: b.id, // Keep numeric type
                barber_id: b.id,
              }))
            : [];

        setBarbers(filtered as StaffMember[]); // id: number!
        console.log(
          '[useAppointmentData] (staff_sequencial) Barbeiros retornados (prontos para seleção):',
          filtered
        );
      } catch (error) {
        console.error("Erro ao buscar barbeiros:", error);
        setBarbers([]);
      } finally {
        setLoadingBarbers(false);
      }
    };

    fetchBarbersWithFallback();
  }, [toast]);

  return {
    services,
    barbers,
    loadingBarbers
  };
};
