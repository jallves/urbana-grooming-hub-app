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

  const filteredAppointments = useMemo(() => {
    return appointments.filter((appointment) => {
      if (statusFilter !== 'all' && appointment.status !== statusFilter) return false;
      const clientName = appointment.painel_clientes?.nome?.toLowerCase() || '';
      return clientName.includes(searchQuery.toLowerCase());
    });
  }, [appointments, statusFilter, searchQuery]);

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
    <div className="w-full max-w-none h-full bg-gradient-to-br from-gray-50 to-gray-100 px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header com gradiente */}
      <div className="relative overflow-hidden bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8">
        <div className="absolute inset-0 bg-gradient-to-r from-urbana-gold/10 via-yellow-500/10 to-urbana-gold/10" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-gradient-to-br from-urbana-gold to-yellow-600 shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 font-playfair">
                Agendamentos de Clientes
              </h1>
              <p className="text-sm text-gray-600 mt-1 font-raleway">
                Gerencie todos os agendamentos dos clientes em tempo real
              </p>
            </div>
            <Button
              onClick={handleCreateAppointment}
              className="bg-gradient-to-r from-urbana-gold to-yellow-600 hover:from-yellow-600 hover:to-urbana-gold text-white shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Agendamento
            </Button>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      <ClientAppointmentStats appointments={appointments} />

      {/* Card principal com filtro e tabela */}
      <Card className="flex-1 flex flex-col bg-white border-0 shadow-lg min-h-[500px] rounded-2xl overflow-hidden">
        <CardHeader className="pb-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle className="text-xl font-bold text-gray-900 font-playfair flex items-center gap-2">
              <span className="text-2xl">📋</span>
              Lista de Agendamentos
              <span className="ml-2 px-3 py-1 bg-gradient-to-r from-urbana-gold to-yellow-600 text-white text-xs rounded-full font-semibold">
                {filteredAppointments.length}
              </span>
            </CardTitle>
            {/* Filtros: empilhado no mobile, horizontal no desktop */}
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
