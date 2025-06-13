import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';

import { Service } from '@/types/appointment';
import { appointmentSchema, FormData } from './types';
import { useAppointmentData } from './useAppointmentData';
import { useAvailability } from './useAvailability';
import { useCoupons } from './useCoupons';
import { useDisabledDays } from './useDisabledDays';
import { useAppointmentSubmit } from './useAppointmentSubmit';

interface InitialAppointmentData {
  serviceId: string;
  staffId: string;
  date: Date;
  notes: string;
}

export const useClientAppointmentForm = (clientId: string, initialData?: InitialAppointmentData) => {
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  // Cria o form usando react-hook-form e zod
  const rawForm = useForm<FormData>({
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

  // Adiciona schema explicitamente para evitar erro TS2344
  const form = {
    ...rawForm,
    schema: appointmentSchema,
  };

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
    () => {
      form.setValue('couponCode', '');
      form.setValue('discountAmount', 0);
      removeCoupon();
    }
  );

  // Quando os serviços forem carregados, aplica o serviço inicial (caso esteja editando)
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

// Exporta os tipos para outros componentes usarem
export type { FormData, BarberAvailabilityInfo } from './types';
