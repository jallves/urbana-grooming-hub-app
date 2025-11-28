import React from 'react';
import { Calendar, DollarSign, Clock, CheckCircle, TrendingUp, ArrowRight, LogOut, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBarberDashboardMetrics } from '@/hooks/useBarberDashboardMetrics';
import { useBarberAuth } from '@/hooks/useBarberAuth';
import { useAuth } from '@/contexts/AuthContext';
import { BarberPageContainer } from '@/components/barber/BarberPageContainer';
import { 
  PainelBarbeiroCard, 
  PainelBarbeiroCardTitle,
  PainelBarbeiroCardHeader,
  PainelBarbeiroCardContent 
} from '@/components/barber/PainelBarbeiroCard';
import { cn } from '@/lib/utils';

const BarberDashboard: React.FC = () => {
  const { displayName } = useBarberAuth();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { metrics, loading } = useBarberDashboardMetrics();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const handleLogout = () => {
    setIsLoggingOut(true);
    console.log('[BarberDashboard] 🚪 Iniciando logout...');
    signOut();
    navigate('/barbeiro/login', { replace: true });
  };

  if (loading || isLoggingOut) {
    return (
      <BarberPageContainer>
        <div className="flex flex-col justify-center items-center h-64 gap-4">
          <div className="w-8 h-8 border-2 border-urbana-gold border-t-transparent rounded-full animate-spin" />
          {isLoggingOut && (
            <p className="text-urbana-light/70 text-sm">Encerrando sessão...</p>
          )}
        </div>
      </BarberPageContainer>
    );
  }

  return (
    <BarberPageContainer>
      {/* Estatísticas em Cards - Mobile First Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
        {[
          {
            label: "Agendamentos",
            value: metrics.totalAppointments,
            subtitle: "Este mês",
            IconComponent: Calendar,
            variant: 'default' as const,
          },
          {
            label: "Próximos",
            value: metrics.upcomingAppointments,
            subtitle: "Agendados",
            IconComponent: Clock,
            variant: 'info' as const,
          },
          {
            label: "Concluídos",
            value: metrics.completedAppointments,
            subtitle: "Atendimentos",
            IconComponent: CheckCircle,
            variant: 'success' as const,
          },
          {
            label: "Comissões",
            value: `R$ ${metrics.totalCommissions.toFixed(0)}`,
            subtitle: `Pendente: R$ ${metrics.pendingCommissions.toFixed(0)}`,
            IconComponent: DollarSign,
            variant: 'highlight' as const,
          },
        ].map((stat, i) => {
          const IconComp = stat.IconComponent;
          return (
            <PainelBarbeiroCard key={i} variant={stat.variant}>
              <PainelBarbeiroCardHeader className="pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
                <div className="flex justify-end">
                  <span
                    className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${
                      stat.variant === 'success' 
                        ? 'bg-green-400/10 text-green-400'
                        : stat.variant === 'info'
                        ? 'bg-blue-400/10 text-blue-400'
                        : stat.variant === 'highlight'
                        ? 'bg-urbana-gold/10 text-urbana-gold'
                        : 'bg-urbana-gold/10 text-urbana-gold'
                    }`}
                  >
                    {stat.variant === 'success' 
                      ? 'Concluído'
                      : stat.variant === 'info'
                      ? 'Agendado'
                      : stat.variant === 'highlight'
                      ? 'Ganhos'
                      : 'Total'
                    }
                  </span>
                </div>
              </PainelBarbeiroCardHeader>
              <PainelBarbeiroCardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
                <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
                  <div className={cn(
                    'p-2 sm:p-2.5 lg:p-3 rounded-lg sm:rounded-xl shrink-0',
                    stat.variant === 'success' && 'bg-green-500/20',
                    stat.variant === 'info' && 'bg-blue-500/20',
                    stat.variant === 'highlight' && 'bg-urbana-gold/20',
                    stat.variant === 'default' && 'bg-urbana-gold/20'
                    )}>
                    <IconComp className={cn(
                      'h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8',
                      stat.variant === 'success' && 'text-green-400',
                      stat.variant === 'info' && 'text-blue-400',
                      stat.variant === 'highlight' && 'text-urbana-gold',
                      stat.variant === 'default' && 'text-urbana-gold'
                    )} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-urbana-light font-playfair">
                      {stat.value}
                    </div>
                    <PainelBarbeiroCardTitle className="text-xs sm:text-sm font-medium text-urbana-light/70 mt-0.5 sm:mt-1 truncate">
                      {stat.label}
                    </PainelBarbeiroCardTitle>
                    <p className="text-[10px] sm:text-xs text-urbana-light/50 truncate leading-tight">
                      {stat.subtitle}
                    </p>
                  </div>
                </div>
              </PainelBarbeiroCardContent>
            </PainelBarbeiroCard>
          );
        })}
      </div>

      {/* Receita Total */}
      <div className="mb-4 sm:mb-6 lg:mb-8">
        <PainelBarbeiroCard variant="highlight">
          <PainelBarbeiroCardContent className="px-4 sm:px-6 py-4 sm:py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-3 sm:p-4 rounded-xl bg-urbana-gold/20">
                  <TrendingUp className="h-8 w-8 sm:h-10 sm:w-10 text-urbana-gold" />
                </div>
                <div>
                  <span className="text-sm sm:text-base text-urbana-light/70 block">Receita Total do Mês</span>
                  <span className="text-3xl sm:text-4xl lg:text-5xl font-bold text-urbana-gold font-playfair block">
                    R$ {metrics.totalRevenue.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </PainelBarbeiroCardContent>
        </PainelBarbeiroCard>
      </div>

      {/* Ações Rápidas - Mobile First */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {[
          {
            label: "Meus Agendamentos",
            IconComponent: Calendar,
            action: () => navigate("/barbeiro/agendamentos"),
            variant: "info" as const,
          },
          {
            label: "Meus Horários",
            IconComponent: Clock,
            action: () => navigate("/barbeiro/horarios"),
            variant: "default" as const,
          },
          {
            label: "Minhas Comissões",
            IconComponent: DollarSign,
            action: () => navigate("/barbeiro/comissoes"),
            variant: "highlight" as const,
          },
          {
            label: isLoggingOut ? "Saindo..." : "Sair", 
            IconComponent: LogOut,
            action: handleLogout,
            variant: "warning" as const,
          },
        ].map((item, index) => (
          <PainelBarbeiroCard
            key={index}
            onClick={isLoggingOut && item.label.includes("Sai") ? undefined : item.action}
            variant={item.variant}
            icon={item.IconComponent}
            className={cn(
              "p-4 sm:p-5 lg:p-8 flex flex-col items-center justify-center space-y-2 sm:space-y-3 lg:space-y-4 min-h-[100px] sm:min-h-[120px] lg:min-h-[140px] touch-manipulation",
              isLoggingOut && item.label.includes("Sai") && "opacity-50 cursor-not-allowed"
            )}
          >
            <item.IconComponent className="h-7 w-7 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-urbana-light flex-shrink-0" />
            <span className="text-xs sm:text-sm lg:text-base font-medium text-center text-urbana-light leading-tight">
              {item.label}
            </span>
          </PainelBarbeiroCard>
        ))}
      </div>
    </BarberPageContainer>
  );
};

export default BarberDashboard;
