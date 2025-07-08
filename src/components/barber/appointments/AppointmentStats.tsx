
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, CheckCircle, Clock, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';

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
      color: 'text-blue-400',
      bgGradient: 'from-blue-500/10 to-cyan-500/10',
      borderColor: 'border-blue-500/20'
    },
    {
      title: 'Concluídos',
      value: stats.completed,
      subtitle: 'Atendimentos',
      icon: CheckCircle,
      color: 'text-green-400',
      bgGradient: 'from-green-500/10 to-emerald-500/10',
      borderColor: 'border-green-500/20'
    },
    {
      title: 'Próximos',
      value: stats.upcoming,
      subtitle: 'Agendados',
      icon: Clock,
      color: 'text-orange-400',
      bgGradient: 'from-orange-500/10 to-red-500/10',
      borderColor: 'border-orange-500/20'
    },
    {
      title: 'Receita',
      value: `R$ ${stats.revenue.toFixed(0)}`,
      subtitle: 'Faturamento',
      icon: DollarSign,
      color: 'text-urbana-gold',
      bgGradient: 'from-urbana-gold/10 to-yellow-500/10',
      borderColor: 'border-urbana-gold/20'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsCards.map((stat, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 * index }}
          whileHover={{ scale: 1.05 }}
        >
          <Card className={`bg-gradient-to-br ${stat.bgGradient} backdrop-blur-lg border ${stat.borderColor} hover:border-urbana-gold/40 transition-all duration-300`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">{stat.title}</CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-white mb-1">
                {stat.value}
              </div>
              <p className="text-xs text-gray-400">{stat.subtitle}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};
