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
  
  const filteredAppointments = appointments.filter((appointment: PainelAgendamento) => {
    // Se não tem sessão de totem, cliente não apareceu - não mostrar
    if (!appointment.totem_sessions || appointment.totem_sessions.length === 0) {
      return false;
    }

    const latestSession = appointment.totem_sessions[appointment.totem_sessions.length - 1];
    
    // Tem check-in E check-out (completo) - SEMPRE mostrar
    if (latestSession.check_in_time && latestSession.check_out_time) {
      // Aplicar filtro de status
      if (statusFilter !== 'all' && appointment.status !== statusFilter) {
        return false;
      }
      
      // Aplicar filtro de busca
      const clientName = appointment.painel_clientes?.nome?.toLowerCase() || '';
      const query = searchQuery.toLowerCase();
      return clientName.includes(query);
    }

    // Tem check-in mas NÃO tem check-out (em andamento ou checkout pendente)
    if (latestSession.check_in_time && !latestSession.check_out_time) {
      // Verificar se tem checkout pendente (venda aberta)
      const hasOpenSale = appointment.vendas && 
        appointment.vendas.some((v: any) => v.status === 'ABERTA');
      
      // Verificar se está no status de checkout
      const isInCheckout = latestSession.status === 'checkout';
      
      // Se tem venda aberta OU está em checkout, sempre mostrar (checkout pendente)
      if (hasOpenSale || isInCheckout) {
        // Aplicar filtro de status
        if (statusFilter !== 'all' && appointment.status !== statusFilter) {
          return false;
        }
        
        // Aplicar filtro de busca
        const clientName = appointment.painel_clientes?.nome?.toLowerCase() || '';
        const query = searchQuery.toLowerCase();
        return clientName.includes(query);
      }
      
      // Caso contrário, apenas mostrar se ainda não passou o horário
      const appointmentDate = parseISO(appointment.data + 'T' + appointment.hora);
      if (appointmentDate > new Date()) {
        // Aplicar filtro de status
        if (statusFilter !== 'all' && appointment.status !== statusFilter) {
          return false;
        }
        
        // Aplicar filtro de busca
        const clientName = appointment.painel_clientes?.nome?.toLowerCase() || '';
        const query = searchQuery.toLowerCase();
        return clientName.includes(query);
      }
    }

    return false;
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
