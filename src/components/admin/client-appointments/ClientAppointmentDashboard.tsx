import React, { useState, useCallback, useMemo } from 'react';
import { useClientAppointments } from './useClientAppointments';
import ClientAppointmentStats from './ClientAppointmentStats';
import ClientAppointmentCompactTable from './ClientAppointmentCompactTable';
import ClientAppointmentFilters from './ClientAppointmentFilters';
import ClientAppointmentEditDialog from './ClientAppointmentEditDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ClientAppointmentDashboard: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedAppointment, setSelectedAppointment] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

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

  return (
    <div className="w-full max-w-none h-full px-4 sm:px-6 lg:px-8 py-6 space-y-4 sm:space-y-6">
      {/* Estatísticas */}
      <ClientAppointmentStats appointments={appointments} />

      {/* Card principal com filtro e tabela */}
      <Card className="flex-1 flex flex-col bg-background min-h-[400px]">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle className="text-xl font-bold">
              Gestão de Agendamentos
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
