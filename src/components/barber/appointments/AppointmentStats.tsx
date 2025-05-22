
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Check, Clock, User } from 'lucide-react';

interface AppointmentStatsProps {
  stats: {
    total: number;
    completed: number;
    upcoming: number;
    revenue: number;
  }
}

export const AppointmentStats: React.FC<AppointmentStatsProps> = ({ stats }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card className="bg-white">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Total de Agendamentos</p>
            <div className="p-2 bg-blue-100 rounded-full">
              <Calendar className="h-4 w-4 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold mt-2">{stats.total}</p>
        </CardContent>
      </Card>
      
      <Card className="bg-white">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Agendamentos Concluídos</p>
            <div className="p-2 bg-green-100 rounded-full">
              <Check className="h-4 w-4 text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold mt-2">{stats.completed}</p>
        </CardContent>
      </Card>
      
      <Card className="bg-white">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Próximos Agendamentos</p>
            <div className="p-2 bg-yellow-100 rounded-full">
              <Clock className="h-4 w-4 text-yellow-600" />
            </div>
          </div>
          <p className="text-2xl font-bold mt-2">{stats.upcoming}</p>
        </CardContent>
      </Card>
      
      <Card className="bg-white">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Receita Total</p>
            <div className="p-2 bg-gray-100 rounded-full">
              <User className="h-4 w-4 text-gray-600" />
            </div>
          </div>
          <p className="text-2xl font-bold mt-2">{formatCurrency(stats.revenue)}</p>
        </CardContent>
      </Card>
    </div>
  );
};
