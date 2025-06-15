
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Service, StaffMember } from '@/types/appointment';

// NOVO: Função utilitária para verificar se é objeto StaffMember válido
function isValidBarber(b: any): b is StaffMember {
  return !!b && typeof b.id === 'string' && b.role === 'barber' && b.is_active;
}

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

        if (error) {
          toast({
            title: "Erro",
            description: "Ocorreu um erro técnico ao buscar barbeiros.",
            variant: "destructive",
          });
          setBarbers([]);
          setLoadingBarbers(false);
          return;
        }

        if (!data || data.length === 0) {
          toast({
            title: "Nenhum barbeiro ativo encontrado",
            description: "Não há barbeiros cadastrados ou disponíveis atualmente. Por favor, contate a barbearia.",
            variant: "destructive",
          });
          setBarbers([]);
          setLoadingBarbers(false);
          return;
        }

        let filtered: StaffMember[] =
          Array.isArray(data)
            ? data
                .map((b) => ({
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
                }))
                .filter(isValidBarber)
            : [];

        setBarbers(filtered);
        if (filtered.length === 0) {
          toast({
            title: "Nenhum barbeiro ativo encontrado",
            description: "Não há barbeiros cadastrados ou disponíveis atualmente. Por favor, contate a barbearia.",
            variant: "destructive",
          });
        }
        console.log('[useAppointmentData] (staff) Barbeiros retornados:', filtered);
      } catch (error) {
        console.error("Erro ao buscar barbeiros:", error);
        setBarbers([]);
        toast({
          title: "Erro",
          description: "Ocorreu um erro técnico ao buscar barbeiros.",
          variant: "destructive",
        });
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
