import React, { useState } from 'react';
import { useAppointments } from './useAppointments';
import AppointmentFilters from './AppointmentFilters';
import AppointmentTable from './AppointmentTable';
import DeleteConfirmationDialog from './DeleteConfirmationDialog';
import AppointmentForm from '../AppointmentForm';

const AppointmentList: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
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

  const filteredAppointments = appointments.filter(appointment => {
    if (statusFilter !== 'all' && appointment.status !== statusFilter) return false;

    const clientName = appointment.client?.name?.toLowerCase() || '';
    return clientName.includes(searchQuery.toLowerCase());
  });

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
      {/* Filtros fixos no topo */}
      <div className="p-4 border-b border-gray-200 bg-white shrink-0">
        <AppointmentFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
        />
      </div>

      {/* Tabela com rolagem interna, ocupa todo o restante da altura */}
      <div className="flex-1 overflow-auto bg-white">
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

      {/* Modal de edição */}
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

      {/* Modal de confirmação de exclusão */}
      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={executeDeleteAppointment}
      />
    </div>
  );
};

export default AppointmentList;
