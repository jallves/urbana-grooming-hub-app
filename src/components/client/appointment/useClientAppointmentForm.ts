
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Service } from '@/types/appointment';
import { toast } from '@/hooks/use-toast';

// Interface para Staff Member da tabela staff
interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  is_active: boolean;
  image_url?: string;
  specialties?: string;
  experience?: string;
  commission_rate?: number;
  created_at?: string;
  updated_at?: string;
}

const formSchema = z.object({
  service_id: z.string().min(1, 'Serviço é obrigatório'),
  staff_id: z.string().min(1, 'Profissional é obrigatório'),
  date: z.date({
    required_error: 'Data é obrigatória',
  }).refine((date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  }, 'Data não pode ser no passado')
  .refine((date) => {
    // Domingo agora funciona (09:00-13:00)
    return true;
  }, 'Data inválida'),
  time: z.string().min(1, 'Horário é obrigatório')
    .refine((time) => {
      const [hours] = time.split(':').map(Number);
      return hours >= 9 && hours < 20;
    }, 'Horário deve ser entre 09h e 20h'),
  notes: z.string().optional(),
});

export type ClientAppointmentFormValues = z.infer<typeof formSchema>;

export const useClientAppointmentForm = (defaultDate: Date = new Date(), appointmentId?: string) => {
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const form = useForm<ClientAppointmentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      service_id: '',
      staff_id: '',
      date: defaultDate,
      time: '',
      notes: '',
    },
  });

  // Fetch serviços do painel_servicos
  const { data: services, isLoading: isLoadingServices } = useQuery({
    queryKey: ['painel_servicos'],
    queryFn: async () => {
      console.log('🔍 Cliente: Buscando serviços...');
      const { data, error } = await supabase
        .from('painel_servicos')
        .select('*')
        .eq('is_active', true)
        .gt('preco', 0)
        .order('nome');
      
      if (error) {
        console.error('❌ Erro ao buscar serviços:', error);
        throw new Error(error.message);
      }
      
      console.log('✅ Serviços encontrados:', data?.length || 0);
      return (data || []).map(s => ({
        id: s.id,
        name: s.nome,
        price: Number(s.preco),
        duration: s.duracao,
        description: s.descricao,
        is_active: s.is_active
      })) as Service[];
    },
  });

  // Fetch staff (barbeiros) do painel_barbeiros
  const { data: staffMembers, isLoading: isLoadingStaff } = useQuery({
    queryKey: ['painel_barbeiros'],
    queryFn: async () => {
      console.log('🔍 Cliente: Buscando barbeiros...');
      
      const { data, error } = await supabase
        .from('painel_barbeiros')
        .select('*')
        .eq('is_active', true)
        .order('nome');
      
      if (error) {
        console.error('❌ Erro ao buscar barbeiros:', error);
        throw new Error(error.message);
      }
      
      console.log('✅ Barbeiros encontrados:', data?.length || 0, data);
      return (data || []).map(b => ({
        id: b.id,
        name: b.nome,
        email: b.email || '',
        phone: b.telefone || undefined,
        role: b.role || 'barber',
        is_active: b.is_active ?? true,
        image_url: b.image_url || undefined,
        specialties: b.specialties as string[] | string | null,
        experience: b.experience || null,
        commission_rate: b.commission_rate ?? 50,
        staff_id: b.staff_id || undefined
      })) as StaffMember[];
    },
  });

  // Buscar dados do agendamento existente se estivermos editando
  const { data: appointmentData } = useQuery({
    queryKey: ['client-appointment', appointmentId],
    queryFn: async () => {
      if (!appointmentId) return null;
      
      console.log('🔍 Cliente: Buscando dados do agendamento:', appointmentId);
      
      const { data, error } = await supabase
        .from('painel_agendamentos')
        .select(`
          *,
          servico:painel_servicos(*),
          barbeiro:painel_barbeiros(*)
        `)
        .eq('id', appointmentId)
        .single();
      
      if (error) {
        console.error('❌ Erro ao buscar agendamento:', error);
        throw new Error(error.message);
      }
      
      console.log('✅ Dados do agendamento encontrados:', data);
      return data;
    },
    enabled: !!appointmentId,
  });

  // Popular formulário com dados existentes
  useEffect(() => {
    if (appointmentData) {
      const timeString = appointmentData.hora;
      const dateStr = appointmentData.data;
      const dateObj = new Date(dateStr + 'T12:00:00');
      
      form.reset({
        service_id: appointmentData.servico_id,
        staff_id: appointmentData.barbeiro_id || '',
        date: dateObj,
        time: timeString,
        notes: '',
      });

      if (services) {
        const service = services.find(s => s.id === appointmentData.servico_id);
        setSelectedService(service || null);
      }
    }
  }, [appointmentData, services, form]);

  // Atualiza serviço selecionado
  useEffect(() => {
    const subscription = form.watch((values) => {
      const service = services?.find((s) => s.id === values.service_id);
      setSelectedService(service || null);
    });
    return () => subscription.unsubscribe();
  }, [services, form]);

  const isLoading = isLoadingServices || isLoadingStaff;

  console.log('📊 useClientAppointmentForm - Estado:', {
    isLoading,
    servicesCount: services?.length || 0,
    staffCount: staffMembers?.length || 0,
    selectedService: selectedService?.name,
    formValues: form.getValues()
  });

  return {
    form,
    isLoading,
    services: services || [],
    staffMembers: staffMembers || [],
    selectedService,
  };
};
