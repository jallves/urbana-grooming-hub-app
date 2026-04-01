
import React from 'react';
import { Search, X } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";

interface FilterOption {
  id: string;
  name: string;
}

interface AppointmentFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  dateFilter: Date | undefined;
  setDateFilter: (date: Date | undefined) => void;
  barberFilter: string;
  setBarberFilter: (barber: string) => void;
  serviceFilter: string;
  setServiceFilter: (service: string) => void;
  barbers: FilterOption[];
  services: FilterOption[];
}

const AppointmentFilters: React.FC<AppointmentFiltersProps> = ({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  dateFilter,
  setDateFilter,
  barberFilter,
  setBarberFilter,
  serviceFilter,
  setServiceFilter,
  barbers,
  services,
}) => {
  const hasActiveFilters = searchQuery || statusFilter !== 'all' || dateFilter || barberFilter !== 'all' || serviceFilter !== 'all';

  const clearAllFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setDateFilter(undefined);
    setBarberFilter('all');
    setServiceFilter('all');
  };

  return (
    <div className="flex flex-col space-y-2 sm:space-y-3 mb-3 sm:mb-4 w-full">
      {/* Busca por cliente */}
      <div className="relative w-full">
        <Search className="absolute left-2 sm:left-3 top-2 sm:top-2.5 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar cliente..."
          className="pl-7 sm:pl-10 text-xs sm:text-sm h-8 sm:h-10 w-full"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Grid de filtros */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {/* Filtro de Data */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full h-8 sm:h-10 text-xs sm:text-sm justify-start text-left font-normal",
                !dateFilter && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-1 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              {dateFilter ? format(dateFilter, "dd/MM/yyyy") : "Data"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateFilter}
              onSelect={setDateFilter}
              locale={ptBR}
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>

        {/* Filtro de Status */}
        <Select value={statusFilter || "all"} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full h-8 sm:h-10 text-xs sm:text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            <SelectItem value="scheduled">Agendado</SelectItem>
            <SelectItem value="confirmed">Confirmado</SelectItem>
            <SelectItem value="completed">Finalizado</SelectItem>
            <SelectItem value="cancelled">Cancelado</SelectItem>
            <SelectItem value="no_show">Não Compareceu</SelectItem>
            <SelectItem value="ausente">Ausente</SelectItem>
          </SelectContent>
        </Select>

        {/* Filtro de Barbeiro */}
        <Select value={barberFilter || "all"} onValueChange={setBarberFilter}>
          <SelectTrigger className="w-full h-8 sm:h-10 text-xs sm:text-sm">
            <SelectValue placeholder="Barbeiro" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Barbeiros</SelectItem>
            {barbers.map((b) => (
              <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Filtro de Serviço */}
        <Select value={serviceFilter || "all"} onValueChange={setServiceFilter}>
          <SelectTrigger className="w-full h-8 sm:h-10 text-xs sm:text-sm">
            <SelectValue placeholder="Serviço" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Serviços</SelectItem>
            {services.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Botão limpar filtros */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAllFilters}
          className="self-start text-xs text-muted-foreground hover:text-foreground h-7"
        >
          <X className="w-3 h-3 mr-1" />
          Limpar filtros
        </Button>
      )}
    </div>
  );
};

export default AppointmentFilters;
