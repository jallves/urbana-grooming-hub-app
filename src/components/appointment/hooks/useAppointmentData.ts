
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
        const { data, error } = await supabase
          .from('staff_sequencial')
          .select('*')
          .eq('is_active', true)
          .eq('role', 'barber')
          .order('name', { ascending: true });

        // Retornar barbeiros APENAS COM UUID válido:
        let filtered: Barber[] =
          Array.isArray(data)
            ? data
                .filter((b) => !!b.uuid_id && !!b.name)
                .map((b) => ({
                  id: String(b.uuid_id), // sempre string UUID
                  uuid_id: b.uuid_id ?? '',
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
                }))
            : [];

        setBarbers(filtered);
        console.log('[useAppointmentData] (staff_sequencial) Barbeiros retornados:', filtered);
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
