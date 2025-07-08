
import React from 'react';
import BarberLayout from '../components/barber/BarberLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, DollarSign, Users, Clock, CheckCircle, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBarberDashboardMetrics } from '@/hooks/useBarberDashboardMetrics';

const BarberDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { metrics, loading } = useBarberDashboardMetrics();

  const quickAccessItems = [
    {
      title: 'Meus Agendamentos',
      description: 'Gerenciar agenda do dia',
      icon: Calendar,
      path: '/barbeiro/agendamentos',
      color: 'text-blue-400',
      stats: loading ? '...' : metrics.upcomingAppointments
    },
    {
      title: 'Comissões',
      description: 'Acompanhar ganhos',
      icon: DollarSign,
      path: '/barbeiro/comissoes',
      color: 'text-urbana-gold',
      stats: loading ? '...' : `R$ ${metrics.totalRevenue.toFixed(0)}`
    },
    {
      title: 'Meus Clientes',
      description: 'Histórico de atendimentos',
      icon: Users,
      path: '/barbeiro/clientes',
      color: 'text-green-400',
      stats: loading ? '...' : metrics.completedAppointments
    },
    {
      title: 'Agenda Completa',
      description: 'Visualizar calendário',
      icon: Clock,
      path: '/barbeiro/agenda',
      color: 'text-purple-400',
      stats: 'Ver Agenda'
    }
  ];

  const statsCards = [
    {
      title: 'Agendamentos',
      value: loading ? '...' : metrics.totalAppointments,
      subtitle: 'Este mês',
      icon: Calendar,
      color: 'text-blue-400'
    },
    {
      title: 'Concluídos',
      value: loading ? '...' : metrics.completedAppointments,
      subtitle: 'Atendimentos',
      icon: CheckCircle,
      color: 'text-green-400'
    },
    {
      title: 'Receita',
      value: loading ? '...' : `R$ ${metrics.totalRevenue.toFixed(0)}`,
      subtitle: 'Este mês',
      icon: DollarSign,
      color: 'text-urbana-gold'
    },
    {
      title: 'Próximos',
      value: loading ? '...' : metrics.upcomingAppointments,
      subtitle: 'Agendados',
      icon: TrendingUp,
      color: 'text-orange-400'
    }
  ];

  return (
    <BarberLayout title="Dashboard">
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="text-center mb-8">
          <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2">
            Bem-vindo, {user?.email?.split('@')[0]}
          </h2>
          <p className="text-gray-400">Gerencie seu trabalho com excelência profissional</p>
        </div>

        {/* Stats Cards */}
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

        {/* Quick Access Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickAccessItems.map((item, index) => (
            <Card 
              key={index}
              className="bg-gray-900 border-gray-700 cursor-pointer transition-all duration-200 hover:border-urbana-gold"
              onClick={() => navigate(item.path)}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <item.icon className={`h-8 w-8 ${item.color}`} />
                  <span className={`text-lg font-bold ${item.color}`}>{item.stats}</span>
                </div>
                <h3 className="font-bold text-white text-lg mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-400 text-sm">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </BarberLayout>
  );
};

export default BarberDashboard;
