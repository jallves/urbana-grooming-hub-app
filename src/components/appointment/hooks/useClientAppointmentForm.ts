import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, isBefore, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAppointmentConfirmation } from '@/hooks/useAppointmentConfirmation';
import { StaffMember, Service } from '@/types/appointment';

interface BarberAvailabilityInfo {
  id: string;
  name: string;
  available: boolean;
}

interface AppliedCoupon {
  code: string;
  discountAmount: number;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
}

const formSchema = z.object({
  serviceId: z.string({
    required_error: "Por favor, selecione um serviço"
  }),
  barberId: z.string({
    required_error: "Por favor, selecione um barbeiro"
  }),
  date: z.date({
    required_error: "Por favor, selecione uma data"
  }),
  time: z.string({
    required_error: "Por favor, selecione um horário"
  }),
  notes: z.string().optional(),
});

export type ClientAppointmentFormData = z.infer<typeof formSchema>;

export function useClientAppointmentForm(clientId: string) {
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<StaffMember[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [barberAvailability, setBarberAvailability] = useState<BarberAvailabilityInfo[]>([]);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [clientData, setClientData] = useState<any>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const { toast } = useToast();
  const { sendConfirmation, isSending } = useAppointmentConfirmation();

  const form = useForm<ClientAppointmentFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      serviceId: '',
      barberId: '',
      notes: '',
    },
  });

  // Calculate final service price
  const finalServicePrice = selectedService 
    ? appliedCoupon 
      ? selectedService.price - appliedCoupon.discountAmount
      : selectedService.price
    : 0;

  // Fetch client data
  useEffect(() => {
    const fetchClientData = async () => {
      if (!clientId) return;
      
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('id', clientId)
          .single();

        if (error) throw error;
        setClientData(data);
      } catch (error) {
        console.error('Error fetching client data:', error);
      }
    };

    fetchClientData();
  }, [clientId]);

  // Fetch services and barbers when component mounts
  useEffect(() => {
    const fetchServicesAndBarbers = async () => {
      try {
        const { data: servicesData, error: servicesError } = await supabase
          .from('services')
          .select('*')
          .eq('is_active', true);

        if (servicesError) throw servicesError;
        setServices(servicesData || []);

        const { data: barbersData, error: barbersError } = await supabase
          .from('staff')
          .select('*')
          .eq('is_active', true);

        if (barbersError) throw barbersError;
        setBarbers(barbersData || []);
      } catch (error: any) {
        console.error('Error fetching services or barbers:', error);
        toast({
          title: 'Erro ao carregar dados',
          description: 'Não foi possível carregar os serviços ou barbeiros disponíveis.',
          variant: 'destructive',
        });
      }
    };

    fetchServicesAndBarbers();
  }, [toast]);

  // When service changes, update selected service details
  useEffect(() => {
    const serviceId = form.getValues('serviceId');
    if (!serviceId) return;
    
    const service = services.find(s => s.id === serviceId);
    setSelectedService(service || null);
    
    form.setValue('barberId', '');
    form.setValue('date', undefined as any);
    form.setValue('time', '');
  }, [form.watch('serviceId'), services, form]);

  const generateTimeSlots = (selectedDate: Date | undefined, serviceDuration: number) => {
    if (!selectedDate) return [];
    
    const slots = [];
    const today = new Date();
    const startHour = isSameDay(selectedDate, today) ? Math.max(new Date().getHours() + 1, 8) : 8;
    
    for (let hour = startHour; hour < 20; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (isSameDay(selectedDate, today)) {
          const currentTime = new Date();
          if (hour < currentTime.getHours() || (hour === currentTime.getHours() && minute <= currentTime.getMinutes())) {
            continue;
          }
        }
        
        const formattedHour = hour.toString().padStart(2, '0');
        const formattedMinute = minute.toString().padStart(2, '0');
        slots.push(`${formattedHour}:${formattedMinute}`);
      }
    }
    
    return slots;
  };

  const checkBarberAvailability = async (date: Date, timeSlot: string) => {
    if (!date || !timeSlot || !selectedService || !barbers.length) {
      console.log('Dados insuficientes para verificação, mostrando todos como disponíveis');
      setBarberAvailability(barbers.map(barber => ({
        id: barber.id,
        name: barber.name,
        available: true
      })));
      return;
    }

    console.log('Verificando disponibilidade dos barbeiros:', { date, timeSlot, serviceDuration: selectedService.duration });
    setIsCheckingAvailability(true);

    try {
      const [hours, minutes] = timeSlot.split(':').map(Number);
      const startTime = new Date(date);
      startTime.setHours(hours, minutes, 0, 0);

      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + selectedService.duration);

      console.log('Verificando conflitos entre:', startTime.toISOString(), 'e', endTime.toISOString());

      const activeBarbers = barbers.filter(barber => barber.is_active);
      
      const availability = await Promise.all(activeBarbers.map(async (barber) => {
        const { data: appointments, error } = await supabase
          .from('appointments')
          .select('id, start_time, end_time')
          .eq('staff_id', barber.id)
          .eq('status', 'scheduled')
          .gte('start_time', startTime.toISOString().split('T')[0])
          .lte('start_time', new Date(startTime.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

        if (error) {
          console.error('Erro ao verificar disponibilidade para', barber.name, ':', error);
          return {
            id: barber.id,
            name: barber.name,
            available: false
          };
        }

        console.log(`Agendamentos encontrados para ${barber.name}:`, appointments);

        const hasConflict = appointments?.some(appointment => {
          const appStart = new Date(appointment.start_time);
          const appEnd = new Date(appointment.end_time);
          
          const conflict = startTime < appEnd && endTime > appStart;
          
          if (conflict) {
            console.log(`Conflito encontrado para ${barber.name}:`, {
              existente: `${appStart.toISOString()} - ${appEnd.toISOString()}`,
              novo: `${startTime.toISOString()} - ${endTime.toISOString()}`
            });
          }
          
          return conflict;
        }) || false;

        return {
          id: barber.id,
          name: barber.name,
          available: !hasConflict
        };
      }));

      console.log('Resultado da verificação de disponibilidade:', availability);
      setBarberAvailability(availability);

      const currentBarberId = form.getValues('barberId');
      if (currentBarberId) {
        const currentBarberAvailable = availability.find(b => b.id === currentBarberId)?.available;
        if (!currentBarberAvailable) {
          const firstAvailable = availability.find(b => b.available);
          if (firstAvailable) {
            form.setValue('barberId', firstAvailable.id);
            toast({
              title: "Barbeiro não disponível",
              description: `O barbeiro selecionado não está disponível neste horário. Selecionamos ${firstAvailable.name} automaticamente.`,
            });
          } else {
            form.setValue('barberId', '');
            toast({
              title: "Nenhum barbeiro disponível",
              description: "Não há barbeiros disponíveis para o horário selecionado. Por favor, escolha outro horário.",
              variant: "destructive",
            });
          }
        }
      }
    } catch (error) {
      console.error("Error checking barber availability:", error);
      toast({
        title: "Erro ao verificar disponibilidade",
        description: "Não foi possível verificar a disponibilidade dos barbeiros.",
        variant: "destructive",
      });
      setBarberAvailability(barbers.map(barber => ({
        id: barber.id,
        name: barber.name,
        available: true
      })));
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  // Update available times when date changes
  useEffect(() => {
    const selectedDate = form.getValues('date');
    if (selectedDate && selectedService) {
      const times = generateTimeSlots(selectedDate, selectedService.duration);
      setAvailableTimes(times);
      form.setValue('time', '');
    }
  }, [form.watch('date'), selectedService, form]);

  // Check availability when time changes
  useEffect(() => {
    const selectedDate = form.getValues('date');
    const selectedTime = form.getValues('time');
    
    if (selectedDate && selectedTime && selectedService) {
      checkBarberAvailability(selectedDate, selectedTime);
    }
  }, [form.watch('time'), form.watch('date'), selectedService, form]);

  const disabledDays = (date: Date) => {
    return isBefore(date, new Date()) && !isSameDay(date, new Date());
  };

  const onApplyCoupon = async (couponCode: string) => {
    if (!selectedService || !couponCode) return;

    setIsApplyingCoupon(true);
    try {
      // Verificar se o cupom existe e está válido
      const { data: coupon, error } = await supabase
        .from('discount_coupons')
        .select('*')
        .eq('code', couponCode)
        .eq('is_active', true)
        .lte('valid_from', new Date().toISOString().split('T')[0])
        .or(`valid_until.is.null,valid_until.gte.${new Date().toISOString().split('T')[0]}`)
        .single();

      if (error || !coupon) {
        toast({
          title: "Cupom inválido",
          description: "O cupom não foi encontrado ou não está válido.",
          variant: "destructive",
        });
        return;
      }

      // Verificar limite de uso
      if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
        toast({
          title: "Cupom esgotado",
          description: "Este cupom já atingiu o limite máximo de utilizações.",
          variant: "destructive",
        });
        return;
      }

      // Calcular desconto
      let discountAmount = 0;
      if (coupon.discount_type === 'percentage') {
        discountAmount = selectedService.price * (coupon.discount_value / 100);
      } else {
        discountAmount = coupon.discount_value;
      }

      // Garantir que o desconto não seja maior que o preço
      discountAmount = Math.min(discountAmount, selectedService.price);

      setAppliedCoupon({
        code: coupon.code,
        discountAmount,
        discountType: coupon.discount_type as 'percentage' | 'fixed',
        discountValue: coupon.discount_value,
      });

      toast({
        title: "Cupom aplicado!",
        description: `Desconto de R$ ${discountAmount.toFixed(2)} aplicado com sucesso.`,
      });
    } catch (error) {
      console.error('Error applying coupon:', error);
      toast({
        title: "Erro ao aplicar cupom",
        description: "Não foi possível aplicar o cupom. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const onRemoveCoupon = () => {
    setAppliedCoupon(null);
    toast({
      title: "Cupom removido",
      description: "O cupom foi removido do agendamento.",
    });
  };

  const onSubmit = async (values: ClientAppointmentFormData) => {
    if (!selectedService || !clientId || !clientData) return;
    
    setLoading(true);
    
    try {
      const [hours, minutes] = values.time.split(':').map(Number);
      const startTime = new Date(values.date);
      startTime.setHours(hours, minutes, 0, 0);

      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + selectedService.duration);

      // Criar agendamento
      const appointmentData = {
        client_id: clientId,
        service_id: values.serviceId,
        staff_id: values.barberId,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        status: 'scheduled',
        notes: values.notes || null,
        coupon_code: appliedCoupon?.code || null,
        discount_amount: appliedCoupon?.discountAmount || 0,
      };

      const { data: appointmentResult, error } = await supabase
        .from('appointments')
        .insert(appointmentData)
        .select(`
          *,
          services:service_id (*),
          staff:staff_id (*)
        `)
        .single();

      if (error) throw error;

      // Se houver cupom aplicado, incrementar o uso
      if (appliedCoupon) {
        const { data: couponData } = await supabase
          .from('discount_coupons')
          .select('current_uses')
          .eq('code', appliedCoupon.code)
          .single();

        await supabase
          .from('discount_coupons')
          .update({ 
            current_uses: (couponData?.current_uses || 0) + 1
          })
          .eq('code', appliedCoupon.code);

        // Inserir registro na tabela de aplicação de cupons
        await supabase
          .from('appointment_coupons')
          .insert({
            appointment_id: appointmentResult.id,
            coupon_id: (await supabase
              .from('discount_coupons')
              .select('id')
              .eq('code', appliedCoupon.code)
              .single()).data?.id,
            discount_amount: appliedCoupon.discountAmount,
          });
      }

      // Enviar confirmação automaticamente por email
      await sendConfirmation({
        clientName: clientData.name,
        clientEmail: clientData.email,
        clientPhone: clientData.phone || '',
        serviceName: selectedService.name,
        staffName: appointmentResult.staff.name,
        appointmentDate: startTime,
        servicePrice: finalServicePrice.toString(),
        serviceDuration: selectedService.duration,
        preferredMethod: 'email',
      });

      // Mostrar mensagem de sucesso
      const successMessage = appliedCoupon 
        ? `Seu agendamento foi confirmado para ${format(startTime, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} com desconto de R$ ${appliedCoupon.discountAmount.toFixed(2)}. Total: R$ ${finalServicePrice.toFixed(2)}. A confirmação foi enviada por email.`
        : `Seu agendamento foi confirmado para ${format(startTime, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}. A confirmação foi enviada por email.`;

      toast({
        title: "Agendamento Realizado com Sucesso",
        description: successMessage,
      });

      form.reset();
      setAppliedCoupon(null);
    } catch (error: any) {
      console.error("Error creating appointment:", error);
      toast({
        title: "Erro ao criar agendamento",
        description: error.message || "Não foi possível realizar o agendamento. Por favor, tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    form,
    loading,
    services,
    barbers,
    selectedService,
    availableTimes,
    barberAvailability,
    isCheckingAvailability,
    clientData,
    isSending,
    disabledDays,
    appliedCoupon,
    isApplyingCoupon,
    finalServicePrice,
    onSubmit,
    onApplyCoupon,
    onRemoveCoupon,
  };
}
