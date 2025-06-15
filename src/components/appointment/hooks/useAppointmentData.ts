
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
        // Buscar barbeiros diretamente da tabela staff (UUID!)
        const { data, error } = await supabase
          .from('staff')
          .select('*')
          .eq('is_active', true)
          .eq('role', 'barber')
          .order('name', { ascending: true });

        let filtered: StaffMember[] =
          Array.isArray(data)
            ? data.map((b) => ({
                ...b,
                id: b.id?.toString?.() ?? '',
                name: b.name ?? '',
                email: b.email ?? '',
                phone: b.phone ?? '',
                image_url: b.image_url ?? '',
                specialties: b.specialties ?? '',
                experience: b.experience ?? '',
                commission_rate: b.commission_rate ?? 0,
                is_active: b.is_active ?? true,
                role: b.role ?? '',
                created_at: b.created_at ?? '',
                updated_at: b.updated_at ?? '',
                uuid_id: b.uuid_id ?? '', // pode não existir
              }))
            : [];

        setBarbers(filtered); // Garantido StaffMember[] com id = uuid (string)
        console.log('[useAppointmentData] (staff) Barbeiros retornados:', filtered);
      } catch (error) {
        console.error("Erro ao buscar barbeiros:", error);
        setBarbers([]);
      } finally {
        setLoadingBarbers(false);
      }
    };

    fetchBarbers();
  }, [toast]);

  return {
    services,
    barbers,
    loadingBarbers
  };
};

