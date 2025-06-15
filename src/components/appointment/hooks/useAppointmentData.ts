
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

        // Corrigir: Usar UUID para id do barbeiro!
        let filtered: Barber[] =
          Array.isArray(data)
            ? data.map((b) => ({
                id: b.uuid_id ? b.uuid_id : b.id, // id = uuid_id (UUID) como string!
                uuid_id: b.uuid_id ?? undefined,
                name: b.name ?? '',
                email: b.email ?? undefined,
                phone: b.phone ?? undefined,
                image_url: b.image_url ?? undefined,
                specialties: b.specialties ?? undefined,
                experience: b.experience ?? undefined,
                commission_rate: b.commission_rate ?? null,
                is_active: b.is_active ?? true,
                role: b.role ?? undefined,
                created_at: b.created_at ?? undefined,
                updated_at: b.updated_at ?? undefined,
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
