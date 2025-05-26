
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
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome do cliente..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      <Select
        value={statusFilter || "all"}
        onValueChange={setStatusFilter}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filtrar por status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os status</SelectItem>
          <SelectItem value="scheduled">Agendado</SelectItem>
          <SelectItem value="confirmed">Confirmado</SelectItem>
          <SelectItem value="completed">Finalizado</SelectItem>
          <SelectItem value="cancelled">Cancelado</SelectItem>
          <SelectItem value="no_show">Não Compareceu</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default AppointmentFilters;
