
import React, { useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, User, Star } from 'lucide-react';
import { useBarberAvailability } from '@/hooks/useBarberAvailability';

interface BarberSelectorProps {
  serviceId: string;
  date: Date | undefined;
  time: string;
  duration: number;
  selectedBarberId: string;
  onBarberChange: (barberId: string) => void;
  disabled?: boolean;
}

export const BarberSelector: React.FC<BarberSelectorProps> = ({
  serviceId,
  date,
  time,
  duration,
  selectedBarberId,
  onBarberChange,
  disabled = false
}) => {
  const { availableBarbers, isLoading, fetchAvailableBarbers } = useBarberAvailability();

  useEffect(() => {
    if (serviceId && date && time && duration > 0) {
      fetchAvailableBarbers(serviceId, date, time, duration);
    }
  }, [serviceId, date, time, duration, fetchAvailableBarbers]);

  const canShowBarbers = serviceId && date && time && duration > 0;

  if (!canShowBarbers) {
    return (
      <div className="w-full">
        <Select disabled>
          <SelectTrigger className="bg-[#1F2937] border-gray-600 text-white">
            <SelectValue placeholder="Selecione o serviço, data e horário primeiro" />
          </SelectTrigger>
        </Select>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Select 
        value={selectedBarberId} 
        onValueChange={onBarberChange}
        disabled={disabled || isLoading}
      >
        <SelectTrigger className="bg-[#1F2937] border-gray-600 text-white">
          <SelectValue placeholder={
            isLoading ? "Buscando barbeiros disponíveis..." : "Selecione um barbeiro"
          } />
          {isLoading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
        </SelectTrigger>
        <SelectContent className="bg-[#1F2937] border-gray-600">
          {availableBarbers.length > 0 ? (
            availableBarbers.map((barber) => (
              <SelectItem 
                key={barber.id} 
                value={barber.id}
                className="text-white hover:bg-gray-700 focus:bg-gray-700"
              >
                <div className="flex items-center space-x-3 py-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={barber.image_url} alt={barber.name} />
                    <AvatarFallback className="bg-gray-600 text-white">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{barber.name}</span>
                      <Badge variant="secondary" className="bg-green-500 text-white">
                        <Star className="h-3 w-3 mr-1" />
                        Disponível
                      </Badge>
                    </div>
                    {barber.specialties && (
                      <p className="text-xs text-gray-400 mt-1">
                        {barber.specialties}
                      </p>
                    )}
                  </div>
                </div>
              </SelectItem>
            ))
          ) : (
            <div className="px-4 py-3 text-center">
              <div className="text-amber-500 mb-2">
                <User className="h-8 w-8 mx-auto" />
              </div>
              <p className="text-sm text-gray-300">
                Nenhum barbeiro disponível
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Tente outro horário ou data
              </p>
            </div>
          )}
        </SelectContent>
      </Select>
    </div>
  );
};
