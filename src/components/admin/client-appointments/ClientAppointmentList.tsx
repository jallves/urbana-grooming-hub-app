import React, { useState } from 'react';
import { useClientAppointments, type PainelAgendamento } from './useClientAppointments';
import ClientAppointmentFilters from './ClientAppointmentFilters';
import ClientAppointmentTable from './ClientAppointmentTable';
import ClientAppointmentEditDialog from './ClientAppointmentEditDialog';
import { parseISO } from 'date-fns';

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
  
  // LEI PÉTREA: Filtrar agendamentos baseado nos 4 estados (3 automáticos + 1 manual)
  const filteredAppointments = appointments.filter((appointment: PainelAgendamento) => {
    // Verificar se foi cancelado manualmente
    const statusUpper = appointment.status?.toUpperCase() || '';
    let currentStatus: string;
    
    if (statusUpper === 'CANCELADO') {
      currentStatus = 'cancelado';
    } else {
      const hasCheckIn = appointment.totem_sessions && 
        appointment.totem_sessions.length > 0 && 
        appointment.totem_sessions.some(s => s.check_in_time);
      
      const hasCheckOut = appointment.totem_sessions && 
        appointment.totem_sessions.some(s => s.check_out_time);

      // Determinar status atual (Lei Pétrea)
      if (!hasCheckIn) {
        currentStatus = 'agendado'; // Check-in Pendente
      } else if (hasCheckIn && !hasCheckOut) {
        currentStatus = 'check_in_finalizado'; // Checkout Pendente
      } else {
        currentStatus = 'concluido'; // Concluído
      }
    }

    // Aplicar filtro de status
    if (statusFilter !== 'all' && currentStatus !== statusFilter) {
      return false;
    }

    // Aplicar filtro de busca
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
