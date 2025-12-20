import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Service, StaffMember } from '@/types/appointment';
import { toast } from '@/hooks/use-toast';

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

export type ClientFormValues = z.infer<typeof formSchema>;

export const useClientFormData = (defaultDate: Date = new Date(), appointmentId?: string) => {
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [availableStaff, setAvailableStaff] = useState<StaffMember[]>([]);
  const [unavailableStaff, setUnavailableStaff] = useState<StaffMember[]>([]);

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      service_id: '',
      staff_id: '',
      date: defaultDate,
      time: '',
      notes: '',
    },
  });

  // Fetch serviços ativos do painel_servicos
  const { data: services, isLoading: isLoadingServices } = useQuery({
    queryKey: ['painel_servicos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('painel_servicos')
        .select('*')
        .eq('is_active', true)
        .gt('preco', 0)
        .order('nome');
      if (error) throw new Error(error.message);
      
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
      const { data, error } = await supabase
        .from('painel_barbeiros')
        .select('*')
        .eq('is_active', true)
        .order('nome');
      if (error) throw new Error(error.message);
      return (data || []).map(b => ({
        id: b.id,
        name: b.nome,
        email: b.email,
        phone: b.telefone,
        image_url: b.image_url,
        specialties: b.specialties,
        experience: b.experience,
        commission_rate: b.commission_rate,
        is_active: b.is_active,
        role: b.role
      })) as StaffMember[];
    },
  });

  // Atualiza serviço selecionado
  useEffect(() => {
    const subscription = form.watch((values) => {
      const service = services?.find((s) => s.id === values.service_id);
      setSelectedService(service || null);
    });
    return () => subscription.unsubscribe();
  }, [services, form]);

  // Verifica disponibilidade dos barbeiros
  useEffect(() => {
    const checkAvailability = async () => {
      const date = form.getValues('date');
      const time = form.getValues('time');
      const duration = selectedService?.duration || 60;

      if (!date || !time || !staffMembers?.length) {
        setAvailableStaff(staffMembers || []);
        setUnavailableStaff([]);
        return;
      }

      const [hours, minutes] = time.split(':').map(Number);
      const startTime = new Date(date);
      startTime.setHours(hours, minutes, 0, 0);

      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + duration);

      const dateStr = startTime.toISOString().split('T')[0];
      const timeStr = time;
      
      const availability = await Promise.all(
        staffMembers.map(async (staff) => {
          let query = supabase
            .from('painel_agendamentos')
            .select('id, data, hora, servico:painel_servicos(duracao)')
            .eq('barbeiro_id', staff.id)
            .eq('status', 'agendado')
            .eq('data', dateStr);

          if (appointmentId) {
            query = query.neq('id', appointmentId);
          }

          const { data: appointments, error } = await query;
          if (error) return { staff, available: false };

          const hasConflict = appointments?.some(appt => {
            const [apptHours, apptMinutes] = appt.hora.split(':').map(Number);
            const apptStart = new Date(startTime);
            apptStart.setHours(apptHours, apptMinutes, 0, 0);
            const apptDuration = (appt.servico as any)?.duracao || 60;
            const apptEnd = new Date(apptStart);
            apptEnd.setMinutes(apptEnd.getMinutes() + apptDuration);
            return startTime < apptEnd && endTime > apptStart;
          });

          return { staff, available: !hasConflict };
        })
      );

      const available = availability.filter(a => a.available).map(a => a.staff);
      const unavailable = availability.filter(a => !a.available).map(a => a.staff);

      setAvailableStaff(available);
      setUnavailableStaff(unavailable);

      const currentStaffId = form.getValues('staff_id');
      const currentStaffAvailable = available.some(s => s.id === currentStaffId);
      if (!currentStaffAvailable) {
        if (available.length > 0) {
          form.setValue('staff_id', available[0].id);
          toast({
            title: 'Barbeiro não disponível',
            description: `Selecionamos automaticamente ${available[0].name}.`,
          });
        } else {
          form.setValue('staff_id', '');
          toast({
            title: 'Nenhum barbeiro disponível',
            description: 'Por favor, escolha outro horário.',
            variant: 'destructive',
          });
        }
      }
    };

    checkAvailability();
  }, [
    form.watch('date'),
    form.watch('time'),
    selectedService,
    staffMembers,
    appointmentId,
  ]);

  const isLoading = isLoadingServices || isLoadingStaff;

  return {
    form,
    isLoading,
    services: services || [],
    staffMembers: staffMembers || [],
    selectedService,
    availableStaff,
    unavailableStaff,
  };
};
