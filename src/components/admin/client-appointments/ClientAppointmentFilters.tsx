
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
    <div className="flex flex-col gap-2 sm:gap-3 w-full">
      {/* Campo de busca - Full width no mobile */}
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        <Input
          placeholder="Buscar cliente..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 pr-3 h-9 sm:h-10 border-gray-200 focus:border-urbana-gold focus:ring-urbana-gold/20 bg-white shadow-sm text-sm w-full"
        />
      </div>

      {/* Filtro de status - Full width no mobile */}
      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm w-full">
        <Filter className="h-4 w-4 text-gray-500 flex-shrink-0" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full border-0 focus:ring-0 h-6 font-medium text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white border-gray-200 shadow-lg">
            <SelectItem value="all" className="cursor-pointer hover:bg-gray-50 text-sm">
              <span className="font-medium">📋 Todos</span>
            </SelectItem>
            <SelectItem value="agendado" className="cursor-pointer hover:bg-blue-50 text-sm">
              <span className="font-medium">📅 Agendado (Check-in Pendente)</span>
            </SelectItem>
            <SelectItem value="check_in_finalizado" className="cursor-pointer hover:bg-orange-50 text-sm">
              <span className="font-medium">✅ Check-in Finalizado (Checkout Pendente)</span>
            </SelectItem>
            <SelectItem value="concluido" className="cursor-pointer hover:bg-green-50 text-sm">
              <span className="font-medium">🎉 Concluído</span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default ClientAppointmentFilters;
