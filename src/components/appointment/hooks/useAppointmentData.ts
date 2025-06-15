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

        // Return array as id: number
        let filtered =
          Array.isArray(data)
            ? data.map((b) => ({
                id: Number(b.id),
                barber_id: Number(b.id),
                commission_rate: b.commission_rate ?? 0,
                created_at: b.created_at ?? '',
                email: b.email ?? '',
                experience: b.experience ?? '',
                image_url: b.image_url ?? '',
                is_active: b.is_active ?? true,
                name: b.name ?? '',
                phone: b.phone ?? '',
                role: b.role ?? '',
                specialties: b.specialties ?? '',
                updated_at: b.updated_at ?? '',
                uuid_id: b.uuid_id ?? '',
              }))
            : [];

        setBarbers(filtered); // id is number!
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
