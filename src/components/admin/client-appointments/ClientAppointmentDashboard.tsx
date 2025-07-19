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
    <div className="h-full flex flex-col gap-6 bg-gray-900 text-gray-100 p-4 sm:p-6 lg:p-8 rounded-lg">
      {/* Estatísticas */}
      <ClientAppointmentStats appointments={appointments} />

      {/* Card principal com filtro e tabela */}
      <Card className="flex-1 flex flex-col border border-gray-800 bg-gray-900 shadow-lg min-h-[400px]">
        <CardHeader className="pb-4 border-b border-gray-800">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle className="text-xl font-bold text-gray-100">
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
