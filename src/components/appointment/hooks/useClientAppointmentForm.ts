import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Service, StaffMember } from '@/types/appointment';
import { useAppointmentConfirmation } from '@/hooks/useAppointmentConfirmation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const appointmentSchema = z.object({
  service_id: z.string().min(1, "Selecione um serviço"),
  date: z.date({
    required_error: "Selecione uma data",
  }),
  time: z.string().min(1, "Selecione um horário"),
  staff_id: z.string().optional(),
  notes: z.string().optional(),
  couponCode: z.string().optional(),
  discountAmount: z.number().optional(),
});

type FormData = z.infer<typeof appointmentSchema>;

export const useClientAppointmentForm = (clientId: string) => {
  const { toast } = useToast();
  const { sendConfirmation, isSending } = useAppointmentConfirmation();
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<StaffMember[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [barberAvailability, setBarberAvailability] = useState<boolean>(true);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [disabledDays, setDisabledDays] = useState<Date[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountAmount: number } | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [finalServicePrice, setFinalServicePrice] = useState(0);

  const form = useForm<FormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      service_id: '',
      date: undefined,
      time: '',
      staff_id: '',
      notes: '',
      couponCode: '',
      discountAmount: 0,
    },
  });

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const { data, error } = await supabase
          .from('services')
          .select('*')
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
      try {
        const { data, error } = await supabase
          .from('staff')
          .select('*')
          .eq('role', 'barber')
          .order('name', { ascending: true });

        if (error) {
          console.error("Erro ao buscar barbeiros:", error);
          toast({
            title: "Erro",
            description: "Não foi possível carregar os barbeiros.",
            variant: "destructive",
          });
        }

        if (data) {
          setBarbers(data);
        }
      } catch (error) {
        console.error("Erro ao buscar barbeiros:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os barbeiros.",
          variant: "destructive",
        });
      }
    };

    fetchBarbers();
  }, [toast]);

  const fetchAvailableTimes = useCallback(async (date: Date, serviceId: string) => {
    if (!date || !serviceId) return;

    setIsCheckingAvailability(true);
    try {
      const selectedDate = new Date(date);
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;

      const { data, error } = await supabase.functions.invoke('get-available-times', {
        body: {
          date: formattedDate,
          service_id: serviceId
        }
      });

      if (error) {
        console.error("Erro ao buscar horários disponíveis:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os horários disponíveis.",
          variant: "destructive",
        });
        setAvailableTimes([]);
      }

      if (data) {
        setAvailableTimes(data);
      }
    } catch (error) {
      console.error("Erro ao buscar horários disponíveis:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os horários disponíveis.",
        variant: "destructive",
      });
      setAvailableTimes([]);
    } finally {
      setIsCheckingAvailability(false);
    }
  }, [supabase, toast]);

  const checkBarberAvailability = useCallback(async (date: Date, time: string, serviceId: string, staffId: string) => {
    if (!date || !time || !serviceId || !staffId) {
      setBarberAvailability(true);
      return;
    }

    setIsCheckingAvailability(true);
    try {
      const selectedDate = new Date(date);
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;

      const { data, error } = await supabase.functions.invoke('check-barber-availability', {
        body: {
          date: formattedDate,
          time: time,
          service_id: serviceId,
          staff_id: staffId
        }
      });

      if (error) {
        console.error("Erro ao verificar disponibilidade do barbeiro:", error);
        toast({
          title: "Erro",
          description: "Não foi possível verificar a disponibilidade do barbeiro.",
          variant: "destructive",
        });
        setBarberAvailability(false);
      }

      if (data) {
        setBarberAvailability(data.available);
      }
    } catch (error) {
      console.error("Erro ao verificar disponibilidade do barbeiro:", error);
      toast({
        title: "Erro",
        description: "Não foi possível verificar a disponibilidade do barbeiro.",
        variant: "destructive",
      });
      setBarberAvailability(false);
    } finally {
      setIsCheckingAvailability(false);
    }
  }, [supabase, toast]);

  const applyCoupon = useCallback(async (couponCode: string, servicePrice: number) => {
    if (!couponCode) return;

    setIsApplyingCoupon(true);
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode)
        .single();

      if (error) {
        console.error("Erro ao buscar cupom:", error);
        toast({
          title: "Cupom inválido",
          description: "Cupom não encontrado ou inválido.",
          variant: "destructive",
        });
        setAppliedCoupon(null);
        setFinalServicePrice(servicePrice);
        return;
      }

      if (data) {
        // Check if the coupon is expired
        if (data.expires_at && new Date(data.expires_at) < new Date()) {
          toast({
            title: "Cupom expirado",
            description: "Este cupom expirou.",
            variant: "destructive",
          });
          setAppliedCoupon(null);
          setFinalServicePrice(servicePrice);
          return;
        }

        setAppliedCoupon({ code: data.code, discountAmount: data.discount_amount });
        setFinalServicePrice(servicePrice - data.discount_amount);
        toast({
          title: "Cupom aplicado",
          description: `Cupom ${data.code} aplicado com sucesso!`,
        });
      }
    } catch (error) {
      console.error("Erro ao buscar cupom:", error);
      toast({
        title: "Cupom inválido",
        description: "Cupom não encontrado ou inválido.",
        variant: "destructive",
      });
      setAppliedCoupon(null);
      setFinalServicePrice(servicePrice);
    } finally {
      setIsApplyingCoupon(false);
    }
  }, [supabase, toast]);

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setFinalServicePrice(selectedService?.price || 0);
    form.setValue('couponCode', '');
    form.setValue('discountAmount', 0);
    toast({
      title: "Cupom removido",
      description: "Cupom removido com sucesso!",
    });
  };

  useEffect(() => {
    const fetchDisabledDays = async () => {
      try {
        const { data, error } = await supabase
          .from('appointments')
          .select('start_time');

        if (error) {
          console.error("Erro ao buscar datas agendadas:", error);
          toast({
            title: "Erro",
            description: "Não foi possível carregar as datas agendadas.",
            variant: "destructive",
          });
          return;
        }

        if (data) {
          const disabledDates = data.map(item => {
            const date = new Date(item.start_time);
            date.setHours(0, 0, 0, 0); // Reset time to midnight
            return date;
          });
          setDisabledDays(disabledDates);
        }
      } catch (error) {
        console.error("Erro ao buscar datas agendadas:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar as datas agendadas.",
          variant: "destructive",
        });
      }
    };

    fetchDisabledDays();
  }, [toast]);

  const onSubmit = async (data: FormData) => {
    if (!selectedService) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um serviço.",
        variant: "destructive",
      });
      return;
    }

    if (!data.date || !data.time) {
      toast({
        title: "Erro", 
        description: "Por favor, selecione uma data e horário.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const [hours, minutes] = data.time.split(':').map(Number);
      const selectedDate = new Date(data.date);
      selectedDate.setHours(hours, minutes, 0, 0);

      const appointmentData = {
        client_id: clientId,
        service_id: data.service_id,
        staff_id: data.staff_id || null,
        start_time: selectedDate.toISOString(),
        end_time: new Date(selectedDate.getTime() + selectedService.duration * 60000).toISOString(),
        notes: data.notes || null,
        coupon_code: data.couponCode || null,
        discount_amount: appliedCoupon ? appliedCoupon.discountAmount : 0,
        status: 'scheduled',
      };

      const { error } = await supabase
        .from('appointments')
        .insert([appointmentData]);

      if (error) {
        console.error("Erro ao criar agendamento:", error);
        throw new Error(error.message || "Não foi possível criar o agendamento.");
      }

      // Show success message
      toast({
        title: "🎉 Agendamento Confirmado!",
        description: `Seu agendamento de ${selectedService.name} foi confirmado com sucesso para ${format(new Date(data.date), "dd/MM/yyyy", { locale: ptBR })} às ${data.time}.`,
        duration: 6000,
      });

      // Send confirmation email/WhatsApp
      try {
        await sendConfirmation({
          clientName: 'Nome do Cliente', // Replace with actual client name
          clientEmail: 'email@example.com', // Replace with actual client email
          serviceName: selectedService.name,
          staffName: 'Nome do Barbeiro', // Replace with actual staff name
          appointmentDate: selectedDate,
          servicePrice: selectedService.price.toString(),
          serviceDuration: selectedService.duration,
          preferredMethod: 'email', // You might want to get this from the user
        });
      } catch (confirmationError) {
        console.error("Erro ao enviar confirmação:", confirmationError);
        toast({
          title: "Erro ao enviar confirmação",
          description: "O agendamento foi criado, mas houve um problema ao enviar a confirmação.",
          variant: "destructive",
        });
      }

      // Reset form after successful submission
      form.reset({
        service_id: '',
        date: undefined,
        time: '',
        staff_id: '',
        notes: '',
        couponCode: '',
        discountAmount: 0,
      });

      // Clear selected service and applied coupon
      setSelectedService(null);
      setAppliedCoupon(null);

    } catch (error: any) {
      console.error('Erro ao criar agendamento:', error);
      toast({
        title: "Erro ao agendar",
        description: error.message || "Não foi possível criar o agendamento. Tente novamente.",
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
    setSelectedService,
    availableTimes,
    barberAvailability,
    isCheckingAvailability,
    isSending,
    disabledDays,
    appliedCoupon,
    isApplyingCoupon,
    finalServicePrice,
    setFinalServicePrice,
    onSubmit,
    fetchAvailableTimes,
    checkBarberAvailability,
    applyCoupon,
    removeCoupon,
  };
};
