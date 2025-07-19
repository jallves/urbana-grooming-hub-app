import React from 'react';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from 'lucide-react';

interface ClientAppointmentFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
}

const ClientAppointmentFilters: React.FC<ClientAppointmentFiltersProps> = ({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Campo de busca */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Buscar por cliente..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-gray-800 text-gray-200 border-gray-700 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
        />
      </div>
      
      {/* Filtro de status */}
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-full sm:w-48 bg-gray-800 text-gray-200 border-gray-700">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent className="bg-gray-900 text-gray-100 border border-gray-700">
          <SelectItem value="all" className="hover:bg-gray-800">Todos</SelectItem>
          <SelectItem value="confirmado" className="hover:bg-gray-800">Confirmado</SelectItem>
          <SelectItem value="concluido" className="hover:bg-gray-800">Concluído</SelectItem>
          <SelectItem value="cancelado" className="hover:bg-gray-800">Cancelado</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default ClientAppointmentFilters;
