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
    const dayOfWeek = date.getDay();
    return dayOfWeek !== 0;
  }, 'Não atendemos aos domingos'),
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

  // Fetch serviços
  const { data: services, isLoading: isLoadingServices } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw new Error(error.message);
      return data as Service[];
    },
  });

  // Fetch staff (barbeiros)
  const { data: staffMembers, isLoading: isLoadingStaff } = useQuery({
    queryKey: ['staff'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw new Error(error.message);
      return data as StaffMember[];
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

      const availability = await Promise.all(
        staffMembers.map(async (staff) => {
          let query = supabase
            .from('appointments')
            .select('id, start_time, end_time')
            .eq('staff_id', staff.id)
            .eq('status', 'scheduled')
            .gte('start_time', startTime.toISOString().split('T')[0])
            .lte('start_time', new Date(startTime.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

          if (appointmentId) {
            query = query.neq('id', appointmentId);
          }

          const { data: appointments, error } = await query;
          if (error) return { staff, available: false };

          const hasConflict = appointments?.some(appt => {
            const appStart = new Date(appt.start_time);
            const appEnd = new Date(appt.end_time);
            return startTime < appEnd && endTime > appStart;
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
