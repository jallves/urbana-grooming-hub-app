
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface AppointmentFiltersBarProps {
  onFiltersChange?: (filters: any) => void;
}

const AppointmentFiltersBar: React.FC<AppointmentFiltersBarProps> = ({ onFiltersChange }) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedStaff, setSelectedStaff] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<Date>();
  
  const handleClearFilters = () => {
    setSelectedStatus('all');
    setSelectedStaff('all');
    setSelectedDate(undefined);
    onFiltersChange?.({
      status: 'all',
      staff: 'all',
      date: null,
    });
  };

  const handleFilterChange = () => {
    onFiltersChange?.({
      status: selectedStatus,
      staff: selectedStaff,
      date: selectedDate,
    });
  };

  return (
    <div className="flex flex-wrap gap-4 items-center">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">Filtros:</span>
      </div>

      <Select value={selectedStatus} onValueChange={setSelectedStatus}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os Status</SelectItem>
          <SelectItem value="scheduled">Agendado</SelectItem>
          <SelectItem value="confirmed">Confirmado</SelectItem>
          <SelectItem value="completed">Concluído</SelectItem>
          <SelectItem value="cancelled">Cancelado</SelectItem>
          <SelectItem value="no-show">Não Compareceu</SelectItem>
        </SelectContent>
      </Select>

      <Select value={selectedStaff} onValueChange={setSelectedStaff}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Profissional" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          {/* TODO: Add dynamic staff options */}
        </SelectContent>
      </Select>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-40 justify-start text-left font-normal",
              !selectedDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDate ? (
              format(selectedDate, "dd/MM/yyyy", { locale: ptBR })
            ) : (
              "Selecionar data"
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            initialFocus
            className="pointer-events-auto"
          />
        </PopoverContent>
      </Popover>

      <div className="flex gap-2">
        <Button 
          onClick={handleFilterChange}
          size="sm"
          variant="default"
        >
          Aplicar Filtros
        </Button>
        <Button 
          onClick={handleClearFilters}
          size="sm"
          variant="outline"
          className="gap-2"
        >
          <X className="h-4 w-4" />
          Limpar
        </Button>
      </div>
    </div>
  );
};

export default AppointmentFiltersBar;
