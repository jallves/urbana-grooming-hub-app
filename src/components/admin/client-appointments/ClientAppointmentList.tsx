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
    if (statusFilter !== 'all' && appointment.status !== statusFilter) {
      return false;
    }
    
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
    <div className="w-full space-y-3 px-2 py-2 sm:space-y-4 sm:px-4">
      <Card className="p-2 bg-black dark:bg-black-800 shadow-sm border border-black-200 dark:border-black-700 sm:p-3 md:p-4">
        <ClientAppointmentFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          compact={window.innerWidth < 640}
        />
        
        <div className="mt-3 rounded-md border border-black-200 dark:border-black-700 overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[600px] sm:min-w-full">
              <ClientAppointmentTable
                appointments={filteredAppointments}
                isLoading={isLoading}
                onEdit={handleEditAppointment}
                onStatusChange={handleStatusChange}
                onDelete={handleDeleteAppointment}
                compact={window.innerWidth < 640}
              />
            </div>
          </div>
        </div>
      </Card>
      
      {isEditDialogOpen && selectedAppointment && (
        <ClientAppointmentEditDialog
          isOpen={isEditDialogOpen}
          onClose={handleCloseEditDialog}
          appointmentId={selectedAppointment}
          onUpdate={handleUpdateAppointment}
          compact={window.innerWidth < 640}
        />
      )}
    </div>
  );
};

export default ClientAppointmentList;