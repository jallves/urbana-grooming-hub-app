
import React from 'react';
import StandardCard from '../components/barber/layouts/StandardCard';
import { Calendar, DollarSign, Clock, CheckCircle, TrendingUp, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBarberDashboardMetrics } from '@/hooks/useBarberDashboardMetrics';
import { useBarberAuth } from '@/hooks/useBarberAuth';
import { BarberPageContainer } from '@/components/barber/BarberPageContainer';

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
    <BarberPageContainer>
      {/* Welcome Section - Fully Responsive */}
      <div className="w-full">
        <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-urbana-light mb-1 sm:mb-2 leading-tight">
          Bem-vindo, {displayName}
        </h2>
        <p className="text-xs sm:text-sm md:text-base text-urbana-light/70 mb-2 sm:mb-3">
          Gerencie seu trabalho com excelência profissional
        </p>
        <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg backdrop-blur-sm">
          <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400 flex-shrink-0" />
          <span className="text-[10px] sm:text-xs md:text-sm text-blue-300 whitespace-nowrap">
            {new Date().toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Stats Cards - Mobile First Grid */}
      <div className="w-full grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
        {statsCards.map((stat, index) => (
          <StandardCard key={index} className="min-h-[100px] sm:min-h-[120px]">
            <div className="flex flex-col h-full justify-between">
              <div className="flex items-start justify-between mb-2">
                <div className="text-[10px] sm:text-xs md:text-sm font-medium text-urbana-light/70 leading-tight">
                  {stat.title}
                </div>
                <div className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg bg-gradient-to-br ${stat.bgGradient} flex items-center justify-center flex-shrink-0`}>
                  <stat.icon className={`h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 ${stat.color}`} />
                </div>
              </div>
              <div>
                <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-urbana-light mb-0.5 sm:mb-1 leading-tight">
                  {stat.value}
                </div>
                <p className="text-[9px] sm:text-[10px] md:text-xs text-urbana-light/60 leading-tight">{stat.subtitle}</p>
              </div>
            </div>
          </StandardCard>
        ))}
      </div>

      {/* Quick Access Cards - Responsive Grid */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {quickAccessItems.map((item, index) => (
          <StandardCard 
            key={index}
            className="cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-transform touch-manipulation"
            onClick={() => navigate(item.path)}
          >
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br ${item.bgColor} flex items-center justify-center flex-shrink-0`}>
                <item.icon className={`h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 ${item.color}`} />
              </div>
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <span className={`text-sm sm:text-base md:text-lg font-bold ${item.color}`}>
                  {item.stats}
                </span>
                <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 text-urbana-light/60 flex-shrink-0" />
              </div>
            </div>
            <h3 className="font-bold text-urbana-light text-sm sm:text-base md:text-lg mb-1 sm:mb-2 leading-tight">
              {item.title}
            </h3>
            <p className="text-urbana-light/60 text-[11px] sm:text-xs md:text-sm leading-relaxed">{item.description}</p>
          </StandardCard>
        ))}
      </div>
    </BarberPageContainer>
  );
};

export default BarberDashboard;
