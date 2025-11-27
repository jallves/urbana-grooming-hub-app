
import React from 'react';
import StandardCard from '../components/barber/layouts/StandardCard';
import { Calendar, DollarSign, Clock, CheckCircle, TrendingUp, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBarberDashboardMetrics } from '@/hooks/useBarberDashboardMetrics';
import { useBarberAuth } from '@/hooks/useBarberAuth';

const BarberDashboard: React.FC = () => {
  const { displayName } = useBarberAuth();
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
      stats: loading ? '...' : `R$ ${metrics.totalCommissions.toFixed(0)}`
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
      subtitle: 'Serviços do mês',
      icon: DollarSign,
      color: 'text-urbana-gold',
      bgGradient: 'from-yellow-500/10 to-amber-600/5'
    },
    {
      title: 'Comissões',
      value: loading ? '...' : `R$ ${metrics.totalCommissions.toFixed(0)}`,
      subtitle: `Pendentes: R$ ${loading ? '...' : metrics.pendingCommissions.toFixed(0)}`,
      icon: TrendingUp,
      color: 'text-green-400',
      bgGradient: 'from-green-500/10 to-emerald-600/5'
    },
  ];

  return (
    <div className="w-full space-y-4 sm:space-y-6">{/* ... keep existing code */}
      {/* Welcome Section */}
      <div className="w-full">
        <h2 className="text-2xl sm:text-3xl font-bold text-urbana-light mb-2">
          Bem-vindo, {displayName}
        </h2>
        <p className="text-sm sm:text-base text-urbana-light/70">Gerencie seu trabalho com excelência profissional</p>
        <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg backdrop-blur-sm">
          <Calendar className="h-4 w-4 text-blue-400" />
          <span className="text-xs sm:text-sm text-blue-300">
            Dados do mês atual: {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {statsCards.map((stat, index) => (
          <StandardCard key={index}>
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="text-xs sm:text-sm font-medium text-urbana-light/70">
                {stat.title}
              </div>
              <div className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-lg bg-gradient-to-br ${stat.bgGradient} flex items-center justify-center`}>
                <stat.icon className={`h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 ${stat.color}`} />
              </div>
            </div>
            <div>
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-urbana-light mb-1">
                {stat.value}
              </div>
              <p className="text-xs text-urbana-light/60">{stat.subtitle}</p>
            </div>
          </StandardCard>
        ))}
      </div>

      {/* Quick Access Cards */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
        {quickAccessItems.map((item, index) => (
          <StandardCard 
            key={index}
            className="cursor-pointer hover:scale-[1.02] transition-transform"
            onClick={() => navigate(item.path)}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${item.bgColor} flex items-center justify-center`}>
                <item.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${item.color}`} />
              </div>
              <div className="flex items-center space-x-2">
                <span className={`text-sm sm:text-lg font-bold ${item.color}`}>
                  {item.stats}
                </span>
                <ArrowRight className="h-4 w-4 text-urbana-light/60" />
              </div>
            </div>
            <h3 className="font-bold text-urbana-light text-base sm:text-lg mb-2">
              {item.title}
            </h3>
            <p className="text-urbana-light/60 text-xs sm:text-sm leading-relaxed">{item.description}</p>
          </StandardCard>
        ))}
      </div>
    </div>
  );
};

export default BarberDashboard;
