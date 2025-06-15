
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Service, StaffMember } from '@/types/appointment';
import { Barber } from '@/types/barber';

export const useAppointmentData = () => {
  const { toast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
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
        console.log('[useAppointmentData] Buscando barbeiros ativos...');
        
        const { data, error } = await supabase
          .from('staff')
          .select('*')
          .eq('is_active', true)
          .eq('role', 'barber')
          .order('name', { ascending: true });

        console.log('[useAppointmentData] Resultado da query:', { data, error });

        if (error) {
          console.error("Erro ao buscar barbeiros:", error);
          toast({
            title: "Erro",
            description: "Não foi possível carregar os barbeiros.",
            variant: "destructive",
          });
          setBarbers([]);
          return;
        }

        if (!data || data.length === 0) {
          console.warn('[useAppointmentData] Nenhum barbeiro encontrado na tabela staff');
          setBarbers([]);
          return;
        }

        let filtered: Barber[] = data
          .filter((b) => !!b.id && !!b.name && b.is_active === true && b.role === 'barber')
          .map((b) => ({
            id: String(b.id),
            uuid_id: (b as any).uuid_id ?? '',
            name: b.name ?? '',
            email: b.email ?? '',
            phone: b.phone ?? '',
            image_url: b.image_url ?? '',
            specialties: b.specialties ?? '',
            experience: b.experience ?? '',
            commission_rate: b.commission_rate ?? 0,
            is_active: b.is_active ?? true,
            role: b.role ?? 'barber',
            created_at: b.created_at ?? '',
            updated_at: b.updated_at ?? '',
          }));

        console.log('[useAppointmentData] Barbeiros filtrados:', filtered);
        setBarbers(filtered);
      } catch (error) {
        console.error("Erro ao buscar barbeiros:", error);
        toast({
          title: "Erro",
          description: "Erro inesperado ao carregar barbeiros.",
          variant: "destructive",
        });
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
