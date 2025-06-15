import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Service } from '@/types/appointment';
import { appointmentSchema, FormData } from './types';
import { useAppointmentData } from './useAppointmentData';
import { useAvailability } from './useAvailability';
import { useCoupons } from './useCoupons';
import { useDisabledDays } from './useDisabledDays';
import { useAppointmentSubmit } from './useAppointmentSubmit';
import { format } from 'date-fns';

interface InitialAppointmentData {
  serviceId: string;
  staffId: string;
  date: Date;
  notes: string;
}

export const useClientAppointmentForm = (clientId: string, initialData?: InitialAppointmentData) => {
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  
  const form = useForm<FormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      service_id: initialData?.serviceId || '',
      date: initialData?.date || undefined,
      time: initialData?.date ? format(initialData.date, 'HH:mm') : '',
      staff_id: initialData?.staffId || '',
      notes: initialData?.notes || '',
      couponCode: '',
      discountAmount: 0,
    },
  });

  // MODIFICADO: usar resultado de barbers do hook (que já faz join com staff)
  const { services, barbers } = useAppointmentData();
  
  const {
    availableTimes,
    barberAvailability,
    isCheckingAvailability,
    fetchAvailableTimes,
    checkBarberAvailability,
  } = useAvailability();
  
  const {
    appliedCoupon,
    isApplyingCoupon,
    finalServicePrice,
    setFinalServicePrice,
    applyCoupon,
    removeCoupon,
  } = useCoupons(selectedService);
  
  const { disabledDays } = useDisabledDays();
  
  const {
    loading,
    isSending,
    onSubmit,
  } = useAppointmentSubmit(
    clientId,
    selectedService,
    appliedCoupon,
    form,
    setSelectedService,
    (coupon) => {
      // We need to handle the coupon removal in the main form
      form.setValue('couponCode', '');
      form.setValue('discountAmount', 0);
      removeCoupon();
    }
  );

  // Set initial service when services are loaded and initial data exists
  useEffect(() => {
    if (initialData && services.length > 0 && !selectedService) {
      const service = services.find(s => s.id === initialData.serviceId);
      if (service) {
        setSelectedService(service);
      }
    }
  }, [initialData, services, selectedService]);

  return {
    form,
    loading,
    services,
    // >>> ALTERAÇÃO principal <<<
    barbers, // Agora já vem certinho do barbers join staff, não espera mais por staff!
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
    removeCoupon: () => {
      form.setValue('couponCode', '');
      form.setValue('discountAmount', 0);
      removeCoupon();
    },
  };
};

// Export types for other components
export type { FormData, BarberAvailabilityInfo } from './types';
