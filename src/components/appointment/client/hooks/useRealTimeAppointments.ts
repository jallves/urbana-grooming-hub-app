import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Appointment } from '@/types/appointment';

export const useRealTimeAppointments = (date: Date) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          start_time,
          end_time,
          status,
          notes,
          client_id,
          service_id,
          staff_id,
          coupon_code,
          discount_amount,
          created_at,
          updated_at,
          service:services (
            id,
            name,
            price,
            duration
          ),
          staff:staff (
            id,
            name,
            image_url
          )
        `)
        .gte('start_time', startOfDay.toISOString())
        .lte('start_time', endOfDay.toISOString())
        .in('status', ['scheduled', 'confirmed']);

      if (error) throw error;

      // Transform the data to match the expected format
      const transformedAppointments = (data || []).map(appointment => ({
        ...appointment,
        // Keep all appointment fields
        id: appointment.id,
        client_id: appointment.client_id,
        service_id: appointment.service_id,
        staff_id: appointment.staff_id,
        start_time: appointment.start_time,
        end_time: appointment.end_time,
        status: appointment.status,
        notes: appointment.notes,
        coupon_code: appointment.coupon_code,
        discount_amount: appointment.discount_amount,
        created_at: appointment.created_at,
        updated_at: appointment.updated_at,
        // Include joined relations
        service: appointment.service,
        staff: appointment.staff
      })) as Appointment[];

      setAppointments(transformedAppointments);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setError('Erro ao carregar agendamentos');
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchAppointments();

    // Setup real-time subscription
    const channel = supabase
      .channel('appointments')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'appointments' },
        (payload) => {
          console.log('Real-time update received:', payload);
          fetchAppointments(); // Refresh appointments on any change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [date, fetchAppointments]);

  return { appointments, loading, error };
};
