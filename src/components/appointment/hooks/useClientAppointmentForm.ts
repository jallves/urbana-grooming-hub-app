
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Service } from '@/types/appointment';
import { appointmentSchema, FormData } from './types';
import { useAppointmentData } from './useAppointmentData';
import { useAvailability } from './useAvailability';
import { useCoupons } from './useCoupons';
import { useDisabledDays } from './useDisabledDays';
import { useAppointmentSubmit } from './useAppointmentSubmit';

export const useClientAppointmentForm = (clientId: string) => {
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  
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
      form.setValue('couponCode', '');
      form.setValue('discountAmount', 0);
      removeCoupon();
    }
  );

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
    removeCoupon: () => {
      form.setValue('couponCode', '');
      form.setValue('discountAmount', 0);
      removeCoupon();
    },
  };
};
