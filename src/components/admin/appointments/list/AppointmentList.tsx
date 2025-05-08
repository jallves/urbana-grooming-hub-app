
import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
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
    // Filter by status
    if (statusFilter !== 'all' && appointment.status !== statusFilter) {
      return false;
    }
    
    // Filter by search query
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
    <>
      <Card className="p-4">
        <AppointmentFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
        />
        
        <div className="rounded-md border">
          <AppointmentTable
            appointments={filteredAppointments}
            isLoading={isLoading}
            onEdit={handleEditAppointment}
            onStatusChange={handleStatusChange}
            onDelete={confirmDeleteAppointment}
          />
        </div>
      </Card>
      
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
    </>
  );
};

export default AppointmentList;
