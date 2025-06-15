
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

  // Usar array corretamente já filtrado e padronizado
  const { services, barbers } = useAppointmentData();

  // Passe barbers para useAvailability
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

  useEffect(() => {
    if (initialData && services.length > 0 && !selectedService) {
      const service = services.find(s => s.id === initialData.serviceId);
      if (service) {
        setSelectedService(service);
      }
    }
  }, [initialData, services, selectedService]);

  // Atualizar chamada de disponibilidade!
  const wrappedCheckBarberAvailability = async (date: Date, time: string, serviceId: string) => {
    // barbers já filtrado e formatado corretamente
    await checkBarberAvailability(date, time, serviceId, barbers);
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
    // Atualiza o contexto usado no <BarberSelectionField>!
    checkBarberAvailability: wrappedCheckBarberAvailability,
    applyCoupon,
    removeCoupon: () => {
      form.setValue('couponCode', '');
      form.setValue('discountAmount', 0);
      removeCoupon();
    },
  };
};

export type { FormData, BarberAvailabilityInfo } from './types';

