
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, CalendarDays } from 'lucide-react';

export type FilterType = 'today' | 'week' | 'month';

interface BirthdayFiltersProps {
  filter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

const BirthdayFilters: React.FC<BirthdayFiltersProps> = ({ filter, onFilterChange }) => {
  const filterOptions = [
    { value: 'today', label: 'Hoje', icon: Clock },
    { value: 'week', label: 'Esta Semana', icon: CalendarDays },
    { value: 'month', label: 'Este Mês', icon: Calendar }
  ];

  const selectedOption = filterOptions.find(option => option.value === filter);

  return (
    <div className="flex items-center space-x-4">
      <label className="text-sm font-medium">Período:</label>
      <Select value={filter} onValueChange={(value: FilterType) => onFilterChange(value)}>
        <SelectTrigger className="w-48">
          <SelectValue>
            <div className="flex items-center space-x-2">
              {selectedOption && <selectedOption.icon className="h-4 w-4" />}
              <span>{selectedOption?.label}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {filterOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex items-center space-x-2">
                <option.icon className="h-4 w-4" />
                <span>{option.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default BirthdayFilters;
