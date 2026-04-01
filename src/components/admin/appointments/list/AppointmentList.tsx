import React, { useState, useMemo } from 'react';
import { useAppointments } from './useAppointments';
import AppointmentFilters from './AppointmentFilters';
import AppointmentTable from './AppointmentTable';
import DeleteConfirmationDialog from './DeleteConfirmationDialog';
import AppointmentForm from '../AppointmentForm';
import { format } from 'date-fns';

const AppointmentList: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [barberFilter, setBarberFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [selectedAppointment, setSelectedAppointment] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState<string | null>(null);

  const {
    appointments,
    isLoading,
    fetchAppointments,
    handleStatusChange,
    handleDeleteAppointment
  } = useAppointments();

  // Extrair barbeiros e serviços únicos
  const barbers = useMemo(() => {
    const map = new Map<string, string>();
    appointments.forEach(a => {
      if (a.staff?.id && a.staff?.name) map.set(a.staff.id, a.staff.name);
    });
    return Array.from(map, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [appointments]);

  const services = useMemo(() => {
    const map = new Map<string, string>();
    appointments.forEach(a => {
      if (a.service?.id && a.service?.name) map.set(a.service.id, a.service.name);
    });
    return Array.from(map, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [appointments]);

  const filteredAppointments = useMemo(() => {
    return appointments.filter(appointment => {
      // Status
      if (statusFilter !== 'all' && appointment.status !== statusFilter) return false;

      // Data
      if (dateFilter) {
        const appointmentDate = format(new Date(appointment.start_time), 'yyyy-MM-dd');
        const filterDate = format(dateFilter, 'yyyy-MM-dd');
        if (appointmentDate !== filterDate) return false;
      }

      // Barbeiro
      if (barberFilter !== 'all' && appointment.staff?.id !== barberFilter) return false;

      // Serviço
      if (serviceFilter !== 'all' && appointment.service?.id !== serviceFilter) return false;

      // Busca por nome
      const clientName = appointment.client?.name?.toLowerCase() || '';
      return clientName.includes(searchQuery.toLowerCase());
    });
  }, [appointments, statusFilter, dateFilter, barberFilter, serviceFilter, searchQuery]);

  const handleEditAppointment = (appointmentId: string) => {
    setSelectedAppointment(appointmentId);
    setIsFormOpen(true);
  };

  const confirmDeleteAppointment = (appointmentId: string) => {
    setAppointmentToDelete(appointmentId);
    setIsDeleteDialogOpen(true);
  };

  const executeDeleteAppointment = async () => {
    if (!appointmentToDelete) return;
    const success = await handleDeleteAppointment(appointmentToDelete);
    if (success) {
      setAppointmentToDelete(null);
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="p-4 shrink-0">
        <AppointmentFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          barberFilter={barberFilter}
          setBarberFilter={setBarberFilter}
          serviceFilter={serviceFilter}
          setServiceFilter={setServiceFilter}
          barbers={barbers}
          services={services}
        />
      </div>

      <div className="flex-1 overflow-auto">
        <div className="min-w-full">
          <AppointmentTable
            appointments={filteredAppointments}
            isLoading={isLoading}
            onEdit={handleEditAppointment}
            onStatusChange={handleStatusChange}
            onDelete={confirmDeleteAppointment}
          />
        </div>
      </div>

      {isFormOpen && selectedAppointment && (
        <AppointmentForm
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setSelectedAppointment(null);
            fetchAppointments();
          }}
          appointmentId={selectedAppointment}
        />
      )}

      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={executeDeleteAppointment}
      />
    </div>
  );
};

export default AppointmentList;
