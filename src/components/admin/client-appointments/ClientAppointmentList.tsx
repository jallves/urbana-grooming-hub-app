
import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { useClientAppointments } from './useClientAppointments';
import ClientAppointmentFilters from './ClientAppointmentFilters';
import ClientAppointmentTable from './ClientAppointmentTable';
import ClientAppointmentEditDialog from './ClientAppointmentEditDialog';

const ClientAppointmentList: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedAppointment, setSelectedAppointment] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  const {
    appointments,
    isLoading,
    fetchAppointments,
    handleStatusChange,
    handleDeleteAppointment,
    handleUpdateAppointment
  } = useClientAppointments();
  
  const filteredAppointments = appointments.filter(appointment => {
    // Filter by status
    if (statusFilter !== 'all' && appointment.status !== statusFilter) {
      return false;
    }
    
    // Filter by search query
    const clientName = appointment.painel_clientes?.nome?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    
    return clientName.includes(query);
  });
  
  const handleEditAppointment = (appointmentId: string) => {
    setSelectedAppointment(appointmentId);
    setIsEditDialogOpen(true);
  };
  
  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false);
    setSelectedAppointment(null);
    fetchAppointments();
  };
  
  return (
    <>
      <Card className="p-4">
        <ClientAppointmentFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
        />
        
        <div className="rounded-md border">
          <ClientAppointmentTable
            appointments={filteredAppointments}
            isLoading={isLoading}
            onEdit={handleEditAppointment}
            onStatusChange={handleStatusChange}
            onDelete={handleDeleteAppointment}
          />
        </div>
      </Card>
      
      {isEditDialogOpen && selectedAppointment && (
        <ClientAppointmentEditDialog
          isOpen={isEditDialogOpen}
          onClose={handleCloseEditDialog}
          appointmentId={selectedAppointment}
          onUpdate={handleUpdateAppointment}
        />
      )}
    </>
  );
};

export default ClientAppointmentList;
