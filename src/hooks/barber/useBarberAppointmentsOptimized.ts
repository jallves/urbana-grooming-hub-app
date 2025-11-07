
import { useState, useEffect, useCallback } from 'react';
import { useBarberData } from './useBarberData';
import { useBarberAppointmentFetch } from './useBarberAppointmentFetch';
import { useBarberAppointmentActions } from './useBarberAppointmentActions';
import { useBarberAppointmentStats } from './useBarberAppointmentStats';
import { useBarberAppointmentModal } from './useBarberAppointmentModal';

export const useBarberAppointmentsOptimized = () => {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  
  // Usar hooks separados para melhor organização
  const { barberData, isLoading: isLoadingBarber } = useBarberData();
  const { appointments, loading, fetchAppointments, setAppointments } = useBarberAppointmentFetch(barberData?.id || null);
  const { handleCompleteAppointment, handleCancelAppointment } = useBarberAppointmentActions({
    barberId: barberData?.id || null,
    onUpdate: fetchAppointments
  });
  const stats = useBarberAppointmentStats(appointments);
  const modalHandlers = useBarberAppointmentModal();

  // Busca inicial
  useEffect(() => {
    if (barberData?.id) {
      fetchAppointments();
    }
  }, [barberData?.id, fetchAppointments]);

  // Handlers otimizados com atualização otimista
  const optimizedCompleteAppointment = useCallback(async (appointmentId: string) => {
    const appointment = appointments.find(a => a.id === appointmentId);
    if (!appointment) return;

    setUpdatingId(appointmentId);
    
    // Atualização otimista
    setAppointments(prev => 
      prev.map(apt => 
        apt.id === appointmentId 
          ? { ...apt, status: 'completed' }
          : apt
      )
    );

    const success = await handleCompleteAppointment(appointmentId, appointment);
    
    if (!success) {
      // Reverter se falhou
      setAppointments(prev => 
        prev.map(apt => 
          apt.id === appointmentId 
            ? { ...apt, status: appointment.status }
            : apt
        )
      );
    }

    setUpdatingId(null);
  }, [appointments, handleCompleteAppointment, setAppointments]);

  const optimizedCancelAppointment = useCallback(async (appointmentId: string) => {
    const appointment = appointments.find(a => a.id === appointmentId);
    if (!appointment) return;

    setUpdatingId(appointmentId);
    
    // Atualização otimista
    setAppointments(prev => 
      prev.map(apt => 
        apt.id === appointmentId 
          ? { ...apt, status: 'cancelled' }
          : apt
      )
    );

    const success = await handleCancelAppointment(appointmentId, appointment);
    
    if (!success) {
      // Reverter se falhou
      setAppointments(prev => 
        prev.map(apt => 
          apt.id === appointmentId 
            ? { ...apt, status: appointment.status }
            : apt
        )
      );
    }

    setUpdatingId(null);
  }, [appointments, handleCancelAppointment, setAppointments]);

  return {
    appointments,
    loading: loading || isLoadingBarber,
    stats,
    updatingId,
    fetchAppointments,
    handleCompleteAppointment: optimizedCompleteAppointment,
    handleCancelAppointment: optimizedCancelAppointment,
    ...modalHandlers
  };
};
