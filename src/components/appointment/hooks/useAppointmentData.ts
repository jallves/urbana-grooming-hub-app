
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Service, StaffMember } from '@/types/appointment';
import { Barber } from '@/types/barber';

export const useAppointmentData = () => {
  const { toast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loadingBarbers, setLoadingBarbers] = useState(true);
  const [loadingServices, setLoadingServices] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        console.log('[useAppointmentData] Buscando serviços...');
        
        const { data, error } = await supabase
          .from('services')
          .select('*')
          .eq('is_active', true)
          .order('name', { ascending: true });

        if (error) {
          console.error("[useAppointmentData] Erro ao buscar serviços:", error);
          toast({
            title: "Erro",
            description: "Não foi possível carregar os serviços.",
            variant: "destructive",
          });
          setServices([]);
          return;
        }

        console.log('[useAppointmentData] Serviços carregados:', data?.length || 0);
        setServices(data || []);
      } catch (error) {
        console.error("[useAppointmentData] Erro inesperado ao buscar serviços:", error);
        setServices([]);
        toast({
          title: "Erro",
          description: "Erro inesperado ao carregar serviços.",
          variant: "destructive",
        });
      } finally {
        setLoadingServices(false);
      }
    };

    fetchServices();
  }, [toast]);

  useEffect(() => {
    const fetchBarbers = async () => {
      setLoadingBarbers(true);
      try {
        console.log('[useAppointmentData] Buscando barbeiros da tabela staff...');
        
        const { data: staffData, error: staffError } = await supabase
          .from('staff')
          .select('*')
          .eq('is_active', true)
          .order('name', { ascending: true });

        console.log('[useAppointmentData] Resultado da consulta staff:', { 
          data: staffData, 
          error: staffError,
          count: staffData?.length || 0
        });

        if (staffError) {
          console.error("[useAppointmentData] Erro na consulta staff:", staffError);
          throw staffError;
        }

        if (!staffData || staffData.length === 0) {
          console.warn('[useAppointmentData] Nenhum barbeiro ativo encontrado na tabela staff');
          setBarbers([]);
          toast({
            title: "Aviso",
            description: "Nenhum barbeiro ativo encontrado. Verifique se há barbeiros cadastrados no sistema.",
            variant: "destructive",
          });
          return;
        }

        // Processar dados da tabela staff
        const processedBarbers: Barber[] = staffData
          .filter((staff) => {
            const isValid = !!(staff.id && staff.name && staff.is_active === true);
            if (!isValid) {
              console.warn('[useAppointmentData] Barbeiro inválido filtrado:', staff);
            }
            return isValid;
          })
          .map((staff) => ({
            id: staff.id, // Manter UUID original
            uuid_id: staff.id, // UUID original
            name: staff.name,
            email: staff.email || '',
            phone: staff.phone || '',
            image_url: staff.image_url || '',
            specialties: staff.specialties || '',
            experience: staff.experience || '',
            commission_rate: staff.commission_rate || 0,
            is_active: staff.is_active ?? true,
            role: staff.role || 'barber',
            created_at: staff.created_at || '',
            updated_at: staff.updated_at || '',
          }));

        console.log('[useAppointmentData] Barbeiros processados da staff:', processedBarbers);
        setBarbers(processedBarbers);

      } catch (error) {
        console.error("[useAppointmentData] Erro crítico ao buscar barbeiros:", error);
        setBarbers([]);
        toast({
          title: "Erro",
          description: "Erro ao carregar barbeiros. Verifique sua conexão.",
          variant: "destructive",
        });
      } finally {
        setLoadingBarbers(false);
      }
    };

    fetchBarbers();
  }, [toast]);

  const loading = loadingServices || loadingBarbers;

  console.log('[useAppointmentData] Estado final:', {
    loading,
    servicesCount: services.length,
    barbersCount: barbers.length,
    barbers
  });

  return {
    services,
    barbers,
    loadingBarbers,
    loading
  };
};
