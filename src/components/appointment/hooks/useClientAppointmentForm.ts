
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Service, StaffMember } from '@/types/appointment';
import { sanitizeInput } from '@/lib/security';

export interface ClientAppointmentFormData {
  name: string;
  phone: string;
  email?: string;
  serviceId: string;
  barberId: string;
  date: Date;
  time: string;
  notes?: string;
}

interface BarberAvailabilityInfo {
  id: string;
  name: string;
  available: boolean;
}

export const useClientAppointmentForm = (clientId: string) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<StaffMember[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [barberAvailability, setBarberAvailability] = useState<BarberAvailabilityInfo[]>([]);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const { toast } = useToast();

  const form = useForm<ClientAppointmentFormData>({
    defaultValues: {
      serviceId: '',
      barberId: '',
      date: undefined,
      time: '',
      notes: ''
    }
  });

  // Load services and barbers on mount
  useEffect(() => {
    loadServices();
    loadBarbers();
  }, []);

  // Watch for service changes
  useEffect(() => {
    const serviceId = form.watch('serviceId');
    if (serviceId) {
      const service = services.find(s => s.id === serviceId);
      setSelectedService(service || null);
      // Reset time and barber when service changes
      form.setValue('time', '');
      form.setValue('barberId', '');
      setAvailableTimes([]);
      setBarberAvailability([]);
    }
  }, [form.watch('serviceId'), services]);

  // Watch for date changes to load available times
  useEffect(() => {
    const date = form.watch('date');
    const serviceId = form.watch('serviceId');
    
    if (date && serviceId && selectedService) {
      fetchAvailableTimes(date, serviceId, '');
      form.setValue('time', '');
      form.setValue('barberId', '');
    }
  }, [form.watch('date'), selectedService]);

  // Watch for date/time changes to check barber availability
  useEffect(() => {
    const date = form.watch('date');
    const time = form.watch('time');
    const serviceId = form.watch('serviceId');
    
    if (date && time && serviceId) {
      checkBarberAvailability(date, time, serviceId);
    }
  }, [form.watch('date'), form.watch('time'), form.watch('serviceId')]);

  const loadServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error loading services:', error);
      toast({
        title: 'Erro ao carregar serviços',
        description: 'Não foi possível carregar os serviços disponíveis.',
        variant: 'destructive',
      });
    }
  };

  const loadBarbers = async () => {
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setBarbers(data || []);
    } catch (error) {
      console.error('Error loading barbers:', error);
      toast({
        title: 'Erro ao carregar barbeiros',
        description: 'Não foi possível carregar a lista de barbeiros.',
        variant: 'destructive',
      });
    }
  };

  const fetchAvailableTimes = async (date: Date, serviceId: string, staffId: string = '') => {
    try {
      const day = date.toISOString().split('T')[0];
      
      // Get service duration
      const service = services.find(s => s.id === serviceId);
      if (!service) return;

      // Generate time slots from 8:00 to 18:00 in 30-minute intervals
      const businessHours = [];
      for (let hour = 8; hour < 18; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          businessHours.push(timeString);
        }
      }

      // If no specific staff, show all times (they'll be filtered by availability later)
      if (!staffId) {
        setAvailableTimes(businessHours);
        return;
      }

      // Fetch appointments for the specific day and staff
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select('start_time, end_time')
        .eq('staff_id', staffId)
        .gte('start_time', `${day}T00:00:00`)
        .lt('start_time', `${day}T23:59:59`)
        .eq('status', 'scheduled');

      if (error) throw error;

      // Filter out booked times
      const bookedTimes = appointments?.map(apt => {
        const startTime = new Date(apt.start_time);
        return startTime.toTimeString().slice(0, 5);
      }) || [];

      const availableSlots = businessHours.filter(time => !bookedTimes.includes(time));
      setAvailableTimes(availableSlots);
    } catch (error: any) {
      console.error('Error fetching available times:', error);
      toast({
        title: 'Erro ao buscar horários',
        description: 'Não foi possível carregar os horários disponíveis.',
        variant: 'destructive',
      });
      setAvailableTimes([]);
    }
  };

  const checkBarberAvailability = async (date: Date, time: string, serviceId: string) => {
    setIsCheckingAvailability(true);
    try {
      const service = services.find(s => s.id === serviceId);
      if (!service) return;

      const day = date.toISOString().split('T')[0];
      const [hours, minutes] = time.split(':').map(Number);
      const startTime = new Date(date);
      startTime.setHours(hours, minutes, 0, 0);
      
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + service.duration);

      console.log('Checking availability for:', startTime.toISOString(), 'to', endTime.toISOString());

      const availability = await Promise.all(
        barbers.map(async (barber) => {
          const { data: conflicts, error } = await supabase
            .from('appointments')
            .select('id')
            .eq('staff_id', barber.id)
            .eq('status', 'scheduled')
            .or(`and(start_time.lte.${startTime.toISOString()},end_time.gt.${startTime.toISOString()}),and(start_time.lt.${endTime.toISOString()},end_time.gte.${endTime.toISOString()}),and(start_time.gte.${startTime.toISOString()},end_time.lte.${endTime.toISOString()})`);

          if (error) {
            console.error('Error checking availability for barber:', barber.name, error);
            return {
              id: barber.id,
              name: barber.name,
              available: false
            };
          }

          return {
            id: barber.id,
            name: barber.name,
            available: !conflicts || conflicts.length === 0
          };
        })
      );

      setBarberAvailability(availability);
    } catch (error) {
      console.error('Error checking barber availability:', error);
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  const onApplyCoupon = async (code: string) => {
    setIsApplyingCoupon(true);
    try {
      console.log('Validating coupon:', code);

      const { data: coupon, error } = await supabase
        .from('discount_coupons')
        .select('*')
        .eq('code', code.toUpperCase())
        .single();

      if (error || !coupon) {
        toast({
          title: 'Cupom inválido',
          description: 'O cupom informado não foi encontrado.',
          variant: 'destructive',
        });
        return;
      }

      // Verify coupon is active and valid
      if (!coupon.is_active) {
        toast({
          title: 'Cupom inativo',
          description: 'Este cupom não está mais ativo.',
          variant: 'destructive',
        });
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      if (coupon.valid_from > today) {
        toast({
          title: 'Cupom ainda não válido',
          description: 'Este cupom ainda não pode ser usado.',
          variant: 'destructive',
        });
        return;
      }

      if (coupon.valid_until && coupon.valid_until < today) {
        toast({
          title: 'Cupom expirado',
          description: 'Este cupom já expirou.',
          variant: 'destructive',
        });
        return;
      }

      if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
        toast({
          title: 'Cupom esgotado',
          description: 'Este cupom já atingiu o limite de usos.',
          variant: 'destructive',
        });
        return;
      }

      // Calculate discount
      let discountAmount = 0;
      const price = selectedService?.price || 0;
      
      if (coupon.discount_type === 'percentage') {
        discountAmount = price * (coupon.discount_value / 100);
      } else {
        discountAmount = coupon.discount_value;
      }

      discountAmount = Math.min(discountAmount, price);

      setAppliedCoupon({
        code: coupon.code,
        discountType: coupon.discount_type,
        discountValue: coupon.discount_value,
        discountAmount: discountAmount
      });

      toast({
        title: 'Cupom aplicado!',
        description: `Desconto de R$ ${discountAmount.toFixed(2)} aplicado com sucesso.`,
      });
    } catch (error: any) {
      console.error('Error applying coupon:', error);
      toast({
        title: 'Erro ao aplicar cupom',
        description: 'Não foi possível validar o cupom.',
        variant: 'destructive',
      });
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const onRemoveCoupon = () => {
    setAppliedCoupon(null);
    toast({
      title: 'Cupom removido',
      description: 'O cupom foi removido do agendamento.',
    });
  };

  const onSubmit = async (data: ClientAppointmentFormData) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      console.log('Form data being submitted:', data);
      
      // Sanitize all text inputs
      const sanitizedData = {
        ...data,
        notes: data.notes ? sanitizeInput(data.notes) : undefined,
      };
      
      if (!sanitizedData.serviceId || !sanitizedData.barberId || !sanitizedData.date || !sanitizedData.time) {
        throw new Error('Por favor, preencha todos os campos obrigatórios');
      }

      const startTime = new Date(sanitizedData.date);
      const [hours, minutes] = sanitizedData.time.split(':').map(Number);
      startTime.setHours(hours, minutes, 0, 0);

      const service = services.find(s => s.id === sanitizedData.serviceId);
      if (!service) {
        throw new Error('Serviço não encontrado');
      }

      const endTime = new Date(startTime.getTime() + service.duration * 60000);

      // Create appointment
      const appointmentData = {
        client_id: clientId,
        service_id: sanitizedData.serviceId,
        staff_id: sanitizedData.barberId,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        status: 'scheduled',
        notes: sanitizedData.notes || null,
        coupon_code: appliedCoupon?.code || null,
        discount_amount: appliedCoupon?.discountAmount || 0
      };

      const { data: appointmentResult, error: appointmentError } = await supabase
        .from('appointments')
        .insert(appointmentData)
        .select()
        .single();

      if (appointmentError) {
        console.error('Error creating appointment:', appointmentError);
        throw new Error('Erro ao agendar. Tente novamente.');
      }

      // If coupon was applied, update its usage count manually
      if (appliedCoupon) {
        const { data: currentCoupon } = await supabase
          .from('discount_coupons')
          .select('current_uses')
          .eq('code', appliedCoupon.code)
          .single();

        if (currentCoupon) {
          const { error: couponError } = await supabase
            .from('discount_coupons')
            .update({ 
              current_uses: (currentCoupon.current_uses || 0) + 1
            })
            .eq('code', appliedCoupon.code);

          if (couponError) {
            console.error('Error updating coupon usage:', couponError);
          }
        }
      }

      toast({
        title: 'Agendamento realizado com sucesso!',
        description: 'Seu agendamento foi realizado com sucesso.',
      });

      // Reset form
      form.reset();
      setAppliedCoupon(null);
      setAvailableTimes([]);
      setBarberAvailability([]);
    } catch (error: any) {
      console.error('Error submitting appointment:', error);
      setError(error.message || 'Erro ao agendar. Tente novamente.');
      toast({
        title: 'Erro ao agendar',
        description: error.message || 'Erro ao agendar. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function for disabled days
  const disabledDays = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today || date.getDay() === 0; // Disable past dates and Sundays
  };

  return {
    form,
    loading: isSubmitting,
    services,
    barbers,
    selectedService,
    availableTimes,
    barberAvailability,
    isCheckingAvailability,
    isSending: isSubmitting,
    disabledDays,
    appliedCoupon,
    isApplyingCoupon,
    finalServicePrice: selectedService?.price || 0,
    isSubmitting,
    error,
    onSubmit,
    onApplyCoupon,
    onRemoveCoupon,
    fetchAvailableTimes,
  };
};
