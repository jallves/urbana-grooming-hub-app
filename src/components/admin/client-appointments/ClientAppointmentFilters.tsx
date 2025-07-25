
import React from 'react';
import { Search, Filter } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  setStatusFilter
}) => {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Campo de busca */}
      <div className="relative flex-1 sm:max-w-sm">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar por nome do cliente..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      {/* Filtro de status */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-gray-400" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 bg-gray-800 border-gray-700 text-gray-100 focus:border-blue-500 focus:ring-blue-500">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-gray-900 border-gray-700 text-gray-100">
            <SelectItem value="all" className="hover:bg-gray-800">Todos</SelectItem>
            <SelectItem value="agendado" className="hover:bg-gray-800">Agendado</SelectItem>
            <SelectItem value="confirmado" className="hover:bg-gray-800">Confirmado</SelectItem>
            <SelectItem value="concluido" className="hover:bg-gray-800">Concluído</SelectItem>
            <SelectItem value="cancelado" className="hover:bg-gray-800">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default ClientAppointmentFilters;
