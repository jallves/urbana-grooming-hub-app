
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
    const fetchBarbersWithFallback = async () => {
      setLoadingBarbers(true);
      try {
        // Primeiro tenta buscar da tabela barbers + staff
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

        let filtered = Array.isArray(data)
          ? data
              .filter((b) => b.staff && b.staff.is_active && b.staff.role === 'barber')
              .map((b) => ({
                ...b.staff,
                barber_id: b.id // vincula o id do registro em barbers, caso necessário em outros lugares
              }))
          : [];

        // Fallback: se não encontrar barbeiros na tabela barbers, busca direto em staff
        if (filtered.length === 0) {
          console.warn(
            "[FALLBACK] Nenhum barbeiro encontrado via tabela barbers. Buscando barbeiros ativos diretamente na tabela staff."
          );
          const { data: staffBarbers, error: staffError } = await supabase
            .from('staff')
            .select(
              'id, name, email, phone, role, is_active, image_url, experience, specialties, commission_rate, created_at, updated_at'
            )
            .eq('is_active', true)
            .eq('role', 'barber')
            .order('name', { ascending: true });

          if (staffError) {
            console.error('Erro ao buscar barbeiros ativos do staff:', staffError);
            setBarbers([]);
            return;
          }
          filtered = Array.isArray(staffBarbers) ? staffBarbers : [];
        }

        setBarbers(filtered);
        console.log(
          '[useAppointmentData] Barbeiros retornados:',
          filtered
        );
      } catch (error) {
        console.error('Erro ao buscar barbeiros:', error);
        setBarbers([]);
      } finally {
        setLoadingBarbers(false);
      }
    };

    fetchBarbersWithFallback();
  }, [toast]);

  return {
    services,
    barbers, // já filtrado como barbeiro ativo
    loadingBarbers
  };
};
