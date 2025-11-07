
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
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center w-full sm:w-auto">
      {/* Campo de busca */}
      <div className="relative flex-1 sm:min-w-[300px]">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar por nome do cliente..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-10 border-gray-200 focus:border-urbana-gold focus:ring-urbana-gold/20 bg-white shadow-sm"
        />
      </div>

      {/* Filtro de status */}
      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
        <Filter className="h-4 w-4 text-gray-500" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px] border-0 focus:ring-0 h-6 font-medium">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white border-gray-200 shadow-lg">
            <SelectItem value="all" className="cursor-pointer hover:bg-gray-50">
              <span className="font-medium">📋 Todos</span>
            </SelectItem>
            <SelectItem value="agendado" className="cursor-pointer hover:bg-yellow-50">
              <span className="font-medium">⏰ Agendado</span>
            </SelectItem>
            <SelectItem value="confirmado" className="cursor-pointer hover:bg-blue-50">
              <span className="font-medium">✓ Confirmado</span>
            </SelectItem>
            <SelectItem value="concluido" className="cursor-pointer hover:bg-green-50">
              <span className="font-medium">✓ Concluído</span>
            </SelectItem>
            <SelectItem value="cancelado" className="cursor-pointer hover:bg-red-50">
              <span className="font-medium">✗ Cancelado</span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default ClientAppointmentFilters;
