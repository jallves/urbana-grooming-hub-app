
import React from 'react';
import { Search } from 'lucide-react';
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AppointmentFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
}

const AppointmentFilters: React.FC<AppointmentFiltersProps> = ({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
}) => {
  return (
    <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar por nome do cliente..."
          className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-urbana-gold focus:ring-urbana-gold"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      <Select
        value={statusFilter || "all"}
        onValueChange={setStatusFilter}
      >
        <SelectTrigger className="w-[180px] bg-gray-700 border-gray-600 text-white">
          <SelectValue placeholder="Filtrar por status" />
        </SelectTrigger>
        <SelectContent className="bg-gray-800 border-gray-600 text-white">
          <SelectItem value="all" className="focus:bg-urbana-gold focus:text-black">Todos os status</SelectItem>
          <SelectItem value="scheduled" className="focus:bg-urbana-gold focus:text-black">Agendado</SelectItem>
          <SelectItem value="confirmed" className="focus:bg-urbana-gold focus:text-black">Confirmado</SelectItem>
          <SelectItem value="completed" className="focus:bg-urbana-gold focus:text-black">Finalizado</SelectItem>
          <SelectItem value="cancelled" className="focus:bg-urbana-gold focus:text-black">Cancelado</SelectItem>
          <SelectItem value="no_show" className="focus:bg-urbana-gold focus:text-black">Não Compareceu</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default AppointmentFilters;
