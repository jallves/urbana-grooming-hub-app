
import { useState, useCallback } from 'react';
import { parseISO } from 'date-fns';

export const useBarberAppointmentModal = () => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [selectedAppointmentDate, setSelectedAppointmentDate] = useState<Date | null>(null);

  const handleEditAppointment = useCallback((appointmentId: string, startTime: string) => {
    try {
      const appointmentDate = parseISO(startTime);
      setSelectedAppointmentId(appointmentId);
      setSelectedAppointmentDate(appointmentDate);
      setIsEditModalOpen(true);
    } catch (error) {
      console.error('Erro ao editar agendamento:', error);
    }
  }, []);

  const closeEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    setSelectedAppointmentId(null);
    setSelectedAppointmentDate(null);
  }, []);

  return {
    isEditModalOpen,
    selectedAppointmentId,
    selectedAppointmentDate,
    handleEditAppointment,
    closeEditModal
  };
};
