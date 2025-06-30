
import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { useClientAppointmentsList } from './useClientAppointmentsList';
import ClientAppointmentFilters from './ClientAppointmentFilters';
import ClientAppointmentTable from './ClientAppointmentTable';

interface ClientAppointmentListProps {
  searchQuery?: string;
}

const ClientAppointmentList: React.FC<ClientAppointmentListProps> = ({ searchQuery = '' }) => {
  const [statusFilter, setStatusFilter] = useState('all');
  
  const {
    appointments,
    isLoading
  } = useClientAppointmentsList();
  
  const filteredAppointments = appointments.filter(appointment => {
    // Filter by status
    if (statusFilter !== 'all' && appointment.status !== statusFilter) {
      return false;
    }
    
    // Filter by search query
    if (searchQuery) {
      const serviceName = appointment.service?.name?.toLowerCase() || '';
      const staffName = appointment.staff?.name?.toLowerCase() || '';
      const query = searchQuery.toLowerCase();
      
      return serviceName.includes(query) || staffName.includes(query);
    }
    
    return true;
  });
  
  return (
    <div className="flex flex-col h-full bg-black">
      <Card className="flex-1 flex flex-col bg-gray-800 border-gray-700">
        <div className="p-4 border-b border-gray-700">
          <ClientAppointmentFilters
            searchQuery={searchQuery}
            setSearchQuery={() => {}} // Handled by parent
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
          />
        </div>
        
        <div className="flex-1 overflow-hidden">
          <ClientAppointmentTable
            appointments={filteredAppointments}
            isLoading={isLoading}
          />
        </div>
      </Card>
    </div>
  );
};

export default ClientAppointmentList;
