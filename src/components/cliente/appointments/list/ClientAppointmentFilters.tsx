
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ClientAppointmentFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
}

const ClientAppointmentFilters: React.FC<ClientAppointmentFiltersProps> = ({
  statusFilter,
  setStatusFilter
}) => {
  return (
    <div className="flex flex-wrap gap-4 items-center">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-urbana-gold font-playfair">Filtrar por:</span>
      </div>

      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-48 bg-gray-800 border-gray-600 text-white">
          <SelectValue placeholder="Status do agendamento" />
        </SelectTrigger>
        <SelectContent className="bg-gray-800 border-gray-600 text-white">
          <SelectItem value="all" className="focus:bg-urbana-gold focus:text-black">Todos os Status</SelectItem>
          <SelectItem value="scheduled" className="focus:bg-urbana-gold focus:text-black">Agendado</SelectItem>
          <SelectItem value="confirmed" className="focus:bg-urbana-gold focus:text-black">Confirmado</SelectItem>
          <SelectItem value="completed" className="focus:bg-urbana-gold focus:text-black">Concluído</SelectItem>
          <SelectItem value="cancelled" className="focus:bg-urbana-gold focus:text-black">Cancelado</SelectItem>
          <SelectItem value="no_show" className="focus:bg-urbana-gold focus:text-black">Não Compareceu</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default ClientAppointmentFilters;
