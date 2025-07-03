
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, CheckCircle, Clock, DollarSign } from 'lucide-react';

interface StatsData {
  total: number;
  completed: number;
  upcoming: number;
  revenue: number;
}

interface AppointmentStatsProps {
  stats: StatsData;
}

export const AppointmentStats: React.FC<AppointmentStatsProps> = ({ stats }) => {
  const statsItems = [
    {
      title: "Total de Agendamentos",
      value: stats.total,
      icon: <Calendar className="h-5 w-5 text-blue-600" />,
      color: "text-blue-600"
    },
    {
      title: "Concluídos",
      value: stats.completed,
      icon: <CheckCircle className="h-5 w-5 text-green-600" />,
      color: "text-green-600"
    },
    {
      title: "Próximos",
      value: stats.upcoming,
      icon: <Clock className="h-5 w-5 text-orange-600" />,
      color: "text-orange-600"
    },
    {
      title: "Receita",
      value: `R$ ${stats.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: <DollarSign className="h-5 w-5 text-purple-600" />,
      color: "text-purple-600"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statsItems.map((item, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
            {item.icon}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${item.color}`}>
              {item.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
