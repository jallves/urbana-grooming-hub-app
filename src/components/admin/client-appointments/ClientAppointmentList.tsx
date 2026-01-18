import React, { useState } from 'react';
import { useClientAppointments, type PainelAgendamento } from './useClientAppointments';
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
  
  // Função auxiliar para normalizar vendas (pode ser objeto ou array)
  const normalizeVendas = (vendas: any): Array<{ id: string; status: string | null }> => {
    if (!vendas) return [];
    if (Array.isArray(vendas)) return vendas;
    return [vendas];
  };

  // Função para calcular status real baseado em appointment_totem_sessions e vendas
  const getActualStatus = (appointment: PainelAgendamento): string => {
    const statusFromDB = appointment.status?.toLowerCase() || '';
    
    // PRIORIDADE 1: Status finais do banco (ausente, cancelado, concluido)
    if (statusFromDB === 'ausente' || statusFromDB === 'cancelado' || statusFromDB === 'concluido') {
      return statusFromDB;
    }
    
    // PRIORIDADE 2: Venda paga = concluído (normalizar vendas para array)
    const vendasArray = normalizeVendas(appointment.vendas);
    const hasPaidSale = vendasArray.some((v: any) => v.status === 'pago');
    
    if (hasPaidSale) {
      return 'concluido';
    }
    
    // PRIORIDADE 3: Status baseado em appointment_totem_sessions (tabela correta)
    const sessions = appointment.appointment_totem_sessions;
    const hasCheckIn = sessions && 
      Array.isArray(sessions) &&
      sessions.length > 0;
    
    const hasCheckOut = hasCheckIn && 
      sessions.some((s: any) => s.status === 'completed' || s.status === 'checkout_completed');
    
    // Determinar status automático
    if (!hasCheckIn) {
      return 'agendado'; // Check-in Pendente
    } else if (hasCheckIn && !hasCheckOut) {
      return 'check_in_finalizado'; // Checkout Pendente
    } else {
      return 'concluido'; // Concluído
    }
  };

  // LEI PÉTREA: Filtrar agendamentos baseado nos estados calculados
  const filteredAppointments = appointments.filter((appointment: PainelAgendamento) => {
    const currentStatus = getActualStatus(appointment);

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
