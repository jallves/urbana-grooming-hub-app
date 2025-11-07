
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
          className="pl-10 bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-urbana-gold focus:ring-urbana-gold"
        />
      </div>

      {/* Filtro de status */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-gray-600" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 bg-white border-gray-300 text-gray-900 focus:border-urbana-gold focus:ring-urbana-gold">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white border-gray-200 text-gray-900">
            <SelectItem value="all" className="hover:bg-gray-100">Todos</SelectItem>
            <SelectItem value="agendado" className="hover:bg-gray-100">Agendado</SelectItem>
            <SelectItem value="confirmado" className="hover:bg-gray-100">Confirmado</SelectItem>
            <SelectItem value="concluido" className="hover:bg-gray-100">Concluído</SelectItem>
            <SelectItem value="cancelado" className="hover:bg-gray-100">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default ClientAppointmentFilters;
