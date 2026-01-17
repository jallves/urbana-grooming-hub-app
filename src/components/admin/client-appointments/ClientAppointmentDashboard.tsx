import React, { useState, useCallback, useMemo } from 'react';
import { useClientAppointments } from './useClientAppointments';
import ClientAppointmentStats from './ClientAppointmentStats';
import ClientAppointmentCompactTable from './ClientAppointmentCompactTable';
import ClientAppointmentFilters from './ClientAppointmentFilters';
import ClientAppointmentEditDialog from './ClientAppointmentEditDialog';
import ClientAppointmentCreateDialog from './ClientAppointmentCreateDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const ClientAppointmentDashboard: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedAppointment, setSelectedAppointment] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const {
    appointments,
    isLoading,
    handleStatusChange,
    handleDeleteAppointment,
    handleUpdateAppointment,
  } = useClientAppointments();

  // Função para calcular status real baseado em appointment_totem_sessions e vendas
  const getActualStatus = useCallback((appointment: any): string => {
    const statusFromDB = appointment.status?.toLowerCase() || '';
    
    // PRIORIDADE 1: Status finais do banco (ausente, cancelado, concluido)
    if (statusFromDB === 'ausente' || statusFromDB === 'cancelado' || statusFromDB === 'concluido') {
      return statusFromDB;
    }
    
    // PRIORIDADE 2: Venda paga = concluído
    const hasPaidSale = appointment.vendas && 
      Array.isArray(appointment.vendas) &&
      appointment.vendas.some((v: any) => v.status === 'pago');
    
    if (hasPaidSale) {
      return 'concluido';
    }
    
    // PRIORIDADE 3: Status baseado em appointment_totem_sessions
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
  }, []);

  const filteredAppointments = useMemo(() => {
    return appointments.filter((appointment) => {
      const actualStatus = getActualStatus(appointment);
      
      // Filtrar por status
      if (statusFilter !== 'all' && actualStatus !== statusFilter) {
        return false;
      }
      
      // Filtrar por busca
      const clientName = appointment.painel_clientes?.nome?.toLowerCase() || '';
      return clientName.includes(searchQuery.toLowerCase());
    });
  }, [appointments, statusFilter, searchQuery, getActualStatus]);

  const handleEditAppointment = useCallback((appointmentId: string) => {
    setSelectedAppointment(appointmentId);
    setIsEditDialogOpen(true);
  }, []);

  const handleCloseEditDialog = useCallback(() => {
    setIsEditDialogOpen(false);
    setSelectedAppointment(null);
  }, []);

  const handleCreateAppointment = useCallback(() => {
    setIsCreateDialogOpen(true);
  }, []);

  const handleCloseCreateDialog = useCallback(() => {
    setIsCreateDialogOpen(false);
  }, []);

  return (
    <div className="w-full max-w-none h-full bg-gradient-to-br from-gray-50 to-gray-100 p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      {/* Header com gradiente - Totalmente responsivo */}
      <div className="relative overflow-hidden bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6 md:p-8">
        <div className="absolute inset-0 bg-gradient-to-r from-urbana-gold/10 via-yellow-500/10 to-urbana-gold/10" />
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
            {/* Ícone e Título */}
            <div className="flex items-start gap-3 flex-1">
              <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br from-urbana-gold to-yellow-600 shadow-lg flex-shrink-0">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 font-playfair leading-tight">
                  Agendamentos de Clientes
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 mt-1 font-raleway">
                  Gerencie agendamentos em tempo real
                </p>
              </div>
            </div>
            {/* Botão - Adaptável */}
            <Button
              onClick={handleCreateAppointment}
              className="w-full sm:w-auto bg-gradient-to-r from-urbana-gold to-yellow-600 hover:from-yellow-600 hover:to-urbana-gold text-white shadow-lg text-sm sm:text-base h-10 sm:h-auto"
            >
              <Plus className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Novo </span>Agendamento
            </Button>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      <ClientAppointmentStats appointments={appointments} />

      {/* Card principal com filtro e tabela - 100% responsivo */}
      <Card className="flex-1 flex flex-col bg-white border-0 shadow-lg min-h-[400px] sm:min-h-[500px] rounded-xl sm:rounded-2xl overflow-hidden">
        <CardHeader className="pb-3 sm:pb-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 p-3 sm:p-4 md:p-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* Título com contador */}
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base sm:text-lg md:text-xl font-bold text-gray-900 font-playfair flex items-center gap-1 sm:gap-2">
                <span className="text-lg sm:text-xl md:text-2xl">📋</span>
                <span className="hidden xs:inline">Lista de </span>Agendamentos
                <span className="ml-1 sm:ml-2 px-2 sm:px-3 py-0.5 sm:py-1 bg-gradient-to-r from-urbana-gold to-yellow-600 text-white text-xs rounded-full font-semibold">
                  {filteredAppointments.length}
                </span>
              </CardTitle>
            </div>
            {/* Filtros: sempre empilhados no mobile */}
            <ClientAppointmentFilters
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
            />
          </div>
        </CardHeader>

        <CardContent className="flex-1 p-0 overflow-auto">
          {/* Tabela/lista responsiva */}
          <ClientAppointmentCompactTable
            appointments={filteredAppointments}
            isLoading={isLoading}
            onEdit={handleEditAppointment}
            onStatusChange={handleStatusChange}
            onDelete={handleDeleteAppointment}
          />
        </CardContent>
      </Card>

      {/* Dialog de criação */}
      <ClientAppointmentCreateDialog
        isOpen={isCreateDialogOpen}
        onClose={handleCloseCreateDialog}
        onCreate={handleCloseCreateDialog}
      />

      {/* Dialog de edição */}
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

export default ClientAppointmentDashboard;
