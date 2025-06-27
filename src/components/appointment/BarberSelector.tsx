
import React, { useEffect, useState } from 'react';
import { useBarberAvailability } from '@/hooks/useBarberAvailability';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Clock, Loader2, AlertCircle } from 'lucide-react';

interface BarberSelectorProps {
  serviceId: string;
  date?: Date;
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
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    console.log('BarberSelector - useEffect disparado:', {
      serviceId,
      date,
      time,
      duration
    });

    if (!serviceId || !date || !time) {
      console.log('Parâmetros insuficientes para buscar barbeiros');
      return;
    }

    console.log('Buscando barbeiros disponíveis...');
    setHasSearched(true);
    fetchAvailableBarbers(serviceId, date, time, duration);
  }, [serviceId, date, time, duration, fetchAvailableBarbers]);

  // Log do estado atual
  useEffect(() => {
    console.log('BarberSelector - Estado atual:', {
      availableBarbers: availableBarbers.length,
      isLoading,
      selectedBarberId
    });
  }, [availableBarbers, isLoading, selectedBarberId]);

  const canShowResults = serviceId && date && time && hasSearched;

  if (!canShowResults) {
    return (
      <Card className="bg-[#1F2937] border-gray-600">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="h-5 w-5" />
            Barbeiros Disponíveis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-400">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Selecione o serviço, data e horário para ver os barbeiros disponíveis</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="bg-[#1F2937] border-gray-600">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="h-5 w-5" />
            Barbeiros Disponíveis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-400">
            <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin" />
            <p>Verificando disponibilidade dos barbeiros...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (availableBarbers.length === 0) {
    return (
      <Card className="bg-[#1F2937] border-gray-600">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="h-5 w-5" />
            Barbeiros Disponíveis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-400">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
            <p className="text-lg font-medium mb-2">Nenhum barbeiro disponível</p>
            <p className="text-sm">
              Não há barbeiros disponíveis para este horário. 
              Tente selecionar outro horário ou data.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-[#1F2937] border-gray-600">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Users className="h-5 w-5" />
          Barbeiros Disponíveis
          <Badge variant="secondary" className="ml-2">
            {availableBarbers.length} disponível{availableBarbers.length !== 1 ? 'eis' : ''}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Select 
          value={selectedBarberId} 
          onValueChange={onBarberChange}
          disabled={disabled}
        >
          <SelectTrigger className="bg-[#374151] border-gray-600 text-white">
            <SelectValue placeholder="Selecione um barbeiro" />
          </SelectTrigger>
          <SelectContent className="bg-[#374151] border-gray-600">
            {availableBarbers.map((barber) => (
              <SelectItem 
                key={barber.id} 
                value={barber.id}
                className="text-white hover:bg-gray-700 focus:bg-gray-700"
              >
                <div className="flex items-center gap-3 w-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={barber.image_url} alt={barber.name} />
                    <AvatarFallback className="bg-[#F59E0B] text-black">
                      {barber.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-medium">{barber.name}</div>
                    {barber.specialties && (
                      <div className="text-xs text-gray-400">
                        {barber.specialties}
                      </div>
                    )}
                  </div>
                  <Badge variant="outline" className="text-green-400 border-green-400">
                    Disponível
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
};
