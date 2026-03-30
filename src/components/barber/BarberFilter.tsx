import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Users } from 'lucide-react';
import { useAllBarbersQuery } from '@/hooks/barber/queries/useAllBarbersQuery';

interface BarberFilterProps {
  isBarberAdmin: boolean;
  currentBarberId: string;
  selectedBarberId: string;
  onBarberChange: (barberId: string) => void;
}

const BarberFilter: React.FC<BarberFilterProps> = ({
  isBarberAdmin,
  currentBarberId,
  selectedBarberId,
  onBarberChange,
}) => {
  const { data: barbers = [] } = useAllBarbersQuery(isBarberAdmin);

  if (!isBarberAdmin) return null;

  return (
    <div className="flex items-center gap-2">
      <Users className="h-4 w-4 text-urbana-gold flex-shrink-0" />
      <Select value={selectedBarberId} onValueChange={onBarberChange}>
        <SelectTrigger className="w-[180px] sm:w-[220px] h-8 sm:h-9 bg-urbana-black/60 border-urbana-gold/30 text-urbana-light text-xs sm:text-sm">
          <SelectValue placeholder="Selecionar barbeiro" />
        </SelectTrigger>
        <SelectContent className="bg-urbana-black border-urbana-gold/30">
          {barbers.map((barber) => (
            <SelectItem
              key={barber.id}
              value={barber.id}
              className="text-urbana-light hover:bg-urbana-gold/10 text-xs sm:text-sm"
            >
              {barber.nome}{barber.id === currentBarberId ? ' (Você)' : ''}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default BarberFilter;
