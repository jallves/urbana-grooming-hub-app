
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
      icon: <Calendar className="h-5 w-5 text-blue-400" />,
      color: "text-blue-400"
    },
    {
      title: "Concluídos",
      value: stats.completed,
      icon: <CheckCircle className="h-5 w-5 text-green-400" />,
      color: "text-green-400"
    },
    {
      title: "Próximos",
      value: stats.upcoming,
      icon: <Clock className="h-5 w-5 text-orange-400" />,
      color: "text-orange-400"
    },
    {
      title: "Receita",
      value: `R$ ${stats.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: <DollarSign className="h-5 w-5 text-purple-400" />,
      color: "text-purple-400"
    }
  ];

  return (
    <div className="panel-grid-responsive mobile-stats-grid">
      {statsItems.map((item, index) => (
        <Card key={index} className="panel-card-responsive mobile-stat-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="panel-text-responsive font-medium text-white">{item.title}</CardTitle>
            {item.icon}
          </CardHeader>
          <CardContent>
            <div className={`text-xl md:text-2xl font-bold ${item.color}`}>
              {item.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
