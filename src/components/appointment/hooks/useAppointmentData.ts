
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Service, StaffMember } from '@/types/appointment';

export const useAppointmentData = () => {
  const { toast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
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
    const fetchBarbers = async () => {
      setLoadingBarbers(true);
      try {
        // BUSCA APENAS BARBEIROS ATIVOS DA TABELA barbers FAZENDO JOIN COM staff
        const { data, error } = await supabase
          .from('barbers')
          .select(`
            id,
            staff:staff_id (
              id,
              name,
              email,
              phone,
              role,
              is_active,
              image_url,
              experience,
              specialties,
              commission_rate,
              created_at,
              updated_at
            )
          `)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Erro ao buscar barbeiros:', error);
          setBarbers([]);
          return;
        }

        // Filtra apenas os barbeiros cuja staff está ativa
        const filtered = Array.isArray(data)
          ? data
              .filter((b) => b.staff && b.staff.is_active && b.staff.role === 'barber')
              .map((b) => ({
                ...b.staff,
                barber_id: b.id // vincula o id do registro em barbers, caso necessário em outros lugares
              }))
          : [];

        setBarbers(filtered);
        console.log('Barbeiros buscados de barbers+staff:', filtered);
      } catch (error) {
        console.error('Erro ao buscar barbeiros:', error);
        setBarbers([]);
      } finally {
        setLoadingBarbers(false);
      }
    };

    fetchBarbers();
  }, [toast]);

  return {
    services,
    barbers, // já filtrado como barbeiro ativo
    loadingBarbers
  };
};
