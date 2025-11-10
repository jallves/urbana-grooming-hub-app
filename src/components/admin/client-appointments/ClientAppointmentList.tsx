import React, { useState } from 'react';
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
    // Filtro por status
    if (statusFilter !== 'all' && appointment.status !== statusFilter) {
      return false;
    }
    
    // Filtro por nome do cliente
    const clientName = appointment.painel_clientes?.nome?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    
    if (!clientName.includes(query)) {
      return false;
    }
    
    // Filtro de check-in/check-out
    const totemSession = appointment.totem_sessions?.[0];
    const hasCheckIn = totemSession?.check_in_time;
    const hasCheckOut = totemSession?.check_out_time;
    
    // Se tem check-in mas não tem check-out, verificar se o horário já passou
    if (hasCheckIn && !hasCheckOut) {
      const appointmentDate = new Date(appointment.data + 'T' + appointment.hora);
      const now = new Date();
      
      // Se o horário já passou, não mostrar (precisa de check-out)
      if (now > appointmentDate) {
        return false;
      }
    }
    
    return true;
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
    <div className="w-full h-full bg-black">
      <div className="w-full px-4 md:px-6 py-4 bg-black border-b border-gray-700">
        <ClientAppointmentFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
        />
      </div>
      
      <div className="w-full px-4 md:px-6 py-4 overflow-x-auto bg-black">
        <ClientAppointmentTable
          appointments={filteredAppointments}
          isLoading={isLoading}
          onEdit={handleEditAppointment}
          onStatusChange={handleStatusChange}
          onDelete={handleDeleteAppointment}
        />
      </div>
      
      {isEditDialogOpen && selectedAppointment && (
        <ClientAppointmentEditDialog
          isOpen={isEditDialogOpen}
          onClose={handleCloseEditDialog}
          appointmentId={selectedAppointment}
          onUpdate={handleUpdateAppointment}
        />
      )}
    </div>
  );
};

export default ClientAppointmentList;
