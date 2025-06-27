
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
import { Barber, Staff } from '@/types/barber';

interface InitialAppointmentData {
  serviceId: string;
  staffId: string;
  date: Date;
  notes: string;
}

export const useClientAppointmentForm = (clientId: string, initialData?: InitialAppointmentData, onSuccess?: () => void) => {
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [error, setError] = useState<Error | null>(null);

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

  // Usar hook de dados
  const { services, barbers, loading } = useAppointmentData();

  console.log('[useClientAppointmentForm] Hook de dados retornou:', {
    servicesCount: services.length,
    barbersCount: barbers.length,
    loading,
    services: services.slice(0, 2), // Log apenas os primeiros 2 para debug
    barbers: barbers.slice(0, 2)   // Log apenas os primeiros 2 para debug
  });

  // Usar hook de disponibilidade
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
    loading: submitLoading,
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

  // Wrapper para verificação de disponibilidade de barbeiros
  const wrappedCheckBarberAvailability = async (date: Date, time: string, serviceId: string) => {
    console.log('[useClientAppointmentForm] Verificando disponibilidade com barbeiros:', barbers);
    // Now the barbers already have all required Staff properties
    const barbersData: Staff[] = barbers.map(barber => ({
      id: barber.id,
      name: barber.name,
      email: barber.email || '',
      phone: barber.phone || '',
      image_url: barber.image_url || '',
      specialties: barber.specialties || '',
      experience: barber.experience || '',
      role: barber.role || 'barber',
      is_active: barber.is_active,
      commission_rate: barber.commission_rate || 0,
      created_at: barber.created_at || new Date().toISOString(),
      updated_at: barber.updated_at || new Date().toISOString()
    }));
    await checkBarberAvailability(date, time, serviceId, barbersData);
  };

  const finalLoading = loading || submitLoading;

  console.log('[useClientAppointmentForm] Estado final:', {
    loading: finalLoading,
    servicesCount: services.length,
    barbersCount: barbers.length,
    selectedService: selectedService?.name || 'nenhum'
  });

  return {
    form,
    loading: finalLoading,
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
    checkBarberAvailability: wrappedCheckBarberAvailability,
    applyCoupon,
    removeCoupon: () => {
      form.setValue('couponCode', '');
      form.setValue('discountAmount', 0);
      removeCoupon();
    },
    error,
  };
};

export type { FormData, BarberAvailabilityInfo } from './types';
