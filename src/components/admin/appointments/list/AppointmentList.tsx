import React, { useState } from 'react';
import ModernCard from '@/components/ui/containers/ModernCard';
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
    if (statusFilter !== 'all' && appointment.status !== statusFilter) {
      return false;
    }
    
    const clientName = appointment.client?.name?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    
    return clientName.includes(query);
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
    <div className="w-full space-y-6">
      <ModernCard
        title="Lista de Agendamentos"
        description="Visualize e gerencie todos os agendamentos"
        className="w-full"
        gradient={false}
        contentClassName="p-0"
      >
        <div className="p-4 sm:p-6">
          <AppointmentFilters
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
          />
        </div>
        
        <div className="border-t border-gray-200">
          <AppointmentTable
            appointments={filteredAppointments}
            isLoading={isLoading}
            onEdit={handleEditAppointment}
            onStatusChange={handleStatusChange}
            onDelete={confirmDeleteAppointment}
          />
        </div>
      </ModernCard>
      
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