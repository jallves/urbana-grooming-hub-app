
import React from 'react';
import BarberLayout from '../components/barber/BarberLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, DollarSign, Users, Clock, CheckCircle, TrendingUp, ArrowRight } from 'lucide-react';
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
      bgColor: 'from-blue-500/10 to-blue-600/5',
      stats: loading ? '...' : metrics.upcomingAppointments
    },
    {
      title: 'Comissões',
      description: 'Acompanhar ganhos',
      icon: DollarSign,
      path: '/barbeiro/comissoes',
      color: 'text-urbana-gold',
      bgColor: 'from-yellow-500/10 to-amber-600/5',
      stats: loading ? '...' : `R$ ${metrics.totalRevenue.toFixed(0)}`
    },
    {
      title: 'Meus Clientes',
      description: 'Histórico de atendimentos',
      icon: Users,
      path: '/barbeiro/clientes',
      color: 'text-green-400',
      bgColor: 'from-green-500/10 to-emerald-600/5',
      stats: loading ? '...' : metrics.completedAppointments
    },
    {
      title: 'Agenda Completa',
      description: 'Visualizar calendário',
      icon: Clock,
      path: '/barbeiro/agenda',
      color: 'text-purple-400',
      bgColor: 'from-purple-500/10 to-violet-600/5',
      stats: 'Visualizar'
    }
  ];

  const statsCards = [
    {
      title: 'Agendamentos',
      value: loading ? '...' : metrics.totalAppointments,
      subtitle: 'Este mês',
      icon: Calendar,
      color: 'text-blue-400',
      bgGradient: 'from-blue-500/10 to-blue-600/5'
    },
    {
      title: 'Concluídos',
      value: loading ? '...' : metrics.completedAppointments,
      subtitle: 'Atendimentos',
      icon: CheckCircle,
      color: 'text-green-400',
      bgGradient: 'from-green-500/10 to-green-600/5'
    },
    {
      title: 'Receita',
      value: loading ? '...' : `R$ ${metrics.totalRevenue.toFixed(0)}`,
      subtitle: 'Este mês',
      icon: DollarSign,
      color: 'text-urbana-gold',
      bgGradient: 'from-yellow-500/10 to-amber-600/5'
    },
    {
      title: 'Próximos',
      value: loading ? '...' : metrics.upcomingAppointments,
      subtitle: 'Agendados',
      icon: TrendingUp,
      color: 'text-orange-400',
      bgGradient: 'from-orange-500/10 to-red-600/5'
    }
  ];

  return (
    <BarberLayout title="Dashboard">
      <div className="w-full h-full min-h-screen bg-gray-900">
        <div className="w-full space-y-6 p-6">
          {/* Welcome Section */}
          <div className="w-full text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">
              Bem-vindo, {user?.email?.split('@')[0]}
            </h2>
            <p className="text-base text-gray-400">Gerencie seu trabalho com excelência profissional</p>
          </div>

          {/* Stats Cards - Grid responsivo sem limitação de largura */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {statsCards.map((stat, index) => (
              <Card key={index} className="w-full bg-gray-800/50 border-gray-700/50 backdrop-blur-sm hover:bg-gray-800/70 transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-6 pt-6">
                  <CardTitle className="text-sm font-medium text-gray-300">
                    {stat.title}
                  </CardTitle>
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.bgGradient} flex items-center justify-center`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <div className="text-2xl font-bold text-white mb-1">
                    {stat.value}
                  </div>
                  <p className="text-xs text-gray-400">{stat.subtitle}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Access Cards - Grid responsivo sem limitação de largura */}
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
            {quickAccessItems.map((item, index) => (
              <Card 
                key={index}
                className="w-full bg-gray-800/30 border-gray-700/50 backdrop-blur-sm cursor-pointer transition-all duration-300 hover:bg-gray-800/50 hover:border-urbana-gold/30 hover:shadow-lg hover:shadow-urbana-gold/5 group"
                onClick={() => navigate(item.path)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <item.icon className={`h-6 w-6 ${item.color}`} />
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-lg font-bold ${item.color}`}>
                        {item.stats}
                      </span>
                      <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-urbana-gold group-hover:translate-x-1 transition-all duration-300" />
                    </div>
                  </div>
                  <h3 className="font-bold text-white text-lg mb-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </BarberLayout>
  );
};

export default BarberDashboard;
