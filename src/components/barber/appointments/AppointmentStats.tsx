
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, CheckCircle, Clock, DollarSign } from 'lucide-react';

interface AppointmentStatsProps {
  stats: {
    total: number;
    completed: number;
    upcoming: number;
    revenue: number;
  };
}

export const AppointmentStats: React.FC<AppointmentStatsProps> = ({ stats }) => {
  const statsCards = [
    {
      title: 'Total',
      value: stats.total,
      subtitle: 'Agendamentos',
      icon: Calendar,
      color: 'text-blue-400'
    },
    {
      title: 'Concluídos',
      value: stats.completed,
      subtitle: 'Atendimentos',
      icon: CheckCircle,
      color: 'text-green-400'
    },
    {
      title: 'Próximos',
      value: stats.upcoming,
      subtitle: 'Agendados',
      icon: Clock,
      color: 'text-orange-400'
    },
    {
      title: 'Receita',
      value: `R$ ${stats.revenue.toFixed(0)}`,
      subtitle: 'Faturamento',
      icon: DollarSign,
      color: 'text-urbana-gold'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statsCards.map((stat, index) => (
        <Card key={index} className="bg-gray-900 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">{stat.title}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white mb-1">
              {stat.value}
            </div>
            <p className="text-xs text-gray-400">{stat.subtitle}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
