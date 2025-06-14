
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
        // BUSCA APENAS STAFF ATIVO E ROLE "barber" DO BANCO
        const { data, error } = await supabase
          .from('staff')
          .select('id, name, email, phone, role, is_active, image_url, experience, specialties, commission_rate, created_at, updated_at')
          .eq('is_active', true)
          .eq('role', 'barber')
          .order('name', { ascending: true });

        if (error) {
          setBarbers([]);
          return;
        }

        if (data && data.length > 0) {
          setBarbers(data);
        } else {
          setBarbers([]);
        }
      } catch (error) {
        setBarbers([]);
      } finally {
        setLoadingBarbers(false);
      }
    };

    fetchBarbers();
  }, [toast]);

  return {
    services,
    barbers, // este array já vem filtrado da base de dados
    loadingBarbers
  };
};
