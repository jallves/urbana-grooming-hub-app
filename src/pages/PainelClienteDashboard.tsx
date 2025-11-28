import React, { useState, useCallback, useEffect } from "react";
import {
  Calendar,
  Clock,
  CheckCircle,
  TrendingUp,
  Settings,
  LogOut,
  User,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  PainelClienteCard, 
  PainelClienteCardTitle, 
  PainelClienteCardDescription,
  PainelClienteCardHeader,
  PainelClienteCardContent 
} from "@/components/painel-cliente/PainelClienteCard";
import { ClientPageContainer } from "@/components/painel-cliente/ClientPageContainer";
import { usePainelClienteAuth } from "@/contexts/PainelClienteAuthContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useClientDashboardRealtime } from "@/hooks/useClientDashboardRealtime";
import { cn } from "@/lib/utils";

interface AgendamentoStats {
  total: number;
  proximos: number;
  concluidos: number;
  agendamentosFuturos?: {
    data: string;
    hora: string;
    barbeiro: string;
    servico: string;
  }[];
}

// ============================================================
// ⚠️ PAINEL CLIENTE DASHBOARD - IMPORTANTE ⚠️
// Este componente DEVE usar o layout com background da barbearia
// O background é gerenciado pelo PainelClienteLayout
// NUNCA adicione bg-white ou qualquer background aqui
// ============================================================

export default function PainelClienteDashboard() {
  const { cliente } = usePainelClienteAuth();
  const { signOut } = useAuth(); // Usar signOut do AuthContext unificado
  const navigate = useNavigate();
  const [stats, setStats] = useState<AgendamentoStats>({
    total: 0,
    proximos: 0,
    concluidos: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Log para debug
  React.useEffect(() => {
    console.log('📊 PainelClienteDashboard carregado - background vem do Layout');
  }, []);

  const fetchStats = useCallback(async () => {
    if (!cliente?.id) return;

    try {
      console.log('📊 [PainelCliente] Buscando agendamentos para cliente:', cliente.id);
      
      const { data: agendamentos, error } = await supabase
        .from("painel_agendamentos")
        .select(
          `
          *,
          painel_barbeiros!inner(nome),
          painel_servicos!inner(nome)
        `
        )
        .eq("cliente_id", cliente.id);

      if (error) {
        console.error("Erro ao buscar estatísticas:", error);
        return;
      }

      console.log('✅ [PainelCliente] Agendamentos encontrados:', agendamentos?.length || 0);

      if (agendamentos) {
        const agora = new Date();
        const hojeDate = new Date(agora.toISOString().split("T")[0]);
        const dataLimite = new Date(hojeDate);
        dataLimite.setDate(dataLimite.getDate() + 30);

        const proximos = agendamentos.filter((a) => {
          const agendamentoDate = new Date(`${a.data}T${a.hora}`);
          return (
            a.status !== "cancelado" &&
            a.status !== "concluido" &&
            agendamentoDate >= agora &&
            agendamentoDate <= dataLimite
          );
        });

        const concluidos = agendamentos.filter(
          (a) => a.status === "concluido"
        );

        setStats({
          total: agendamentos.length,
          proximos: proximos.length,
          concluidos: concluidos.length,
          agendamentosFuturos: proximos.map((a) => ({
            data: a.data,
            hora: a.hora,
            barbeiro: a.painel_barbeiros.nome,
            servico: a.painel_servicos.nome,
          })),
        });
      }
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
    } finally {
      setLoading(false);
    }
  }, [cliente?.id]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useClientDashboardRealtime(fetchStats);

  const handleLogout = () => {
    setIsLoggingOut(true);
    console.log('[Dashboard] 🚪 Iniciando logout...');
    signOut();
    navigate('/painel-cliente/login', { replace: true });
  };

  if (loading || isLoggingOut) {
    return (
      <ClientPageContainer>
        <div className="flex flex-col justify-center items-center h-64 gap-4">
          <div className="w-8 h-8 border-2 border-urbana-gold border-t-transparent rounded-full animate-spin" />
          {isLoggingOut && (
            <p className="text-urbana-light/70 text-sm">Encerrando sessão...</p>
          )}
        </div>
      </ClientPageContainer>
    );
  }

  return (
    <ClientPageContainer>
      {/* Estatísticas em Cards - Mobile First Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
        {[
          {
            label: "Total de Agendamentos",
            value: stats.total,
            IconComponent: Calendar,
            status: "todos",
            variant: 'default' as const,
          },
          {
            label: "Próximos 30 Dias", 
            value: stats.proximos,
            IconComponent: Clock,
            status: "confirmado",
            variant: 'info' as const,
          },
          {
            label: "Concluídos",
            value: stats.concluidos,
            IconComponent: CheckCircle,
            status: "concluido",
            variant: 'success' as const,
          },
        ].map((stat, i) => {
          const IconComp = stat.IconComponent;
          return (
            <PainelClienteCard key={i} variant={stat.variant}>
              <PainelClienteCardHeader className="pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
                <div className="flex justify-end">
                  <span
                    className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${
                      stat.status === 'concluido' 
                        ? 'bg-green-400/10 text-green-400'
                        : stat.status === 'confirmado'
                        ? 'bg-blue-400/10 text-blue-400'
                        : 'bg-urbana-gold/10 text-urbana-gold'
                    }`}
                  >
                    {stat.status === 'concluido' 
                      ? 'Concluído'
                      : stat.status === 'confirmado'
                      ? 'Agendado'
                      : 'Total'
                    }
                  </span>
                </div>
              </PainelClienteCardHeader>
              <PainelClienteCardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
                <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
                  <div className={cn(
                    'p-2 sm:p-2.5 lg:p-3 rounded-lg sm:rounded-xl shrink-0',
                    stat.variant === 'success' && 'bg-green-500/20',
                    stat.variant === 'info' && 'bg-blue-500/20',
                    stat.variant === 'default' && 'bg-urbana-gold/20'
                    )}>
                    <IconComp className={cn(
                      'h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8',
                      stat.variant === 'success' && 'text-green-400',
                      stat.variant === 'info' && 'text-blue-400',
                      stat.variant === 'default' && 'text-urbana-gold'
                    )} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-urbana-light font-playfair">
                      {stat.value}
                    </div>
                    <PainelClienteCardTitle className="text-xs sm:text-sm font-medium text-urbana-light/70 mt-0.5 sm:mt-1 truncate">
                      {stat.label}
                    </PainelClienteCardTitle>
                  </div>
                </div>
              </PainelClienteCardContent>
            </PainelClienteCard>
          );
        })}
      </div>

      {/* Próximos Agendamentos */}
      {stats.agendamentosFuturos && stats.agendamentosFuturos.length > 0 && (
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-urbana-gold mb-3 sm:mb-4 lg:mb-6 drop-shadow-lg px-1">
            Próximos Agendamentos
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
            {stats.agendamentosFuturos.map((ag, index) => (
              <PainelClienteCard key={index} variant="info">
                <PainelClienteCardHeader className="pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
                  <div className="flex justify-end">
                    <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium bg-blue-400/10 text-blue-400">
                      Agendado
                    </span>
                  </div>
                </PainelClienteCardHeader>
                <PainelClienteCardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
                  <div className="flex items-start gap-2 sm:gap-3 lg:gap-4">
                    <div className="p-2 sm:p-2.5 lg:p-3 rounded-lg sm:rounded-xl shrink-0 bg-blue-500/20">
                      <Calendar className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-blue-400" />
                    </div>
                    <div className="flex-1 space-y-2 sm:space-y-3 min-w-0">
                      <PainelClienteCardTitle className="text-base sm:text-lg text-urbana-light truncate">
                        {ag.servico}
                      </PainelClienteCardTitle>
                      <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 flex-wrap">
                        <div className="flex items-center text-urbana-light/70 min-w-0">
                          <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-urbana-gold flex-shrink-0" />
                          <span className="text-xs sm:text-sm truncate">
                            {format(parseISO(ag.data), "EEEE, dd 'de' MMMM", {
                              locale: ptBR
                            })}
                          </span>
                        </div>
                        <div className="flex items-center text-urbana-light/70">
                          <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-urbana-gold flex-shrink-0" />
                          <span className="text-xs sm:text-sm">{ag.hora}</span>
                        </div>
                      </div>
                      <div className="flex items-center text-urbana-light/70 min-w-0">
                        <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-urbana-gold flex-shrink-0" />
                        <span className="text-xs sm:text-sm truncate">{ag.barbeiro}</span>
                      </div>
                    </div>
                  </div>
                </PainelClienteCardContent>
              </PainelClienteCard>
            ))}
          </div>
        </div>
      )}

      {/* Ações Rápidas - Mobile First */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
        {[
          {
            label: "Novo Agendamento",
            IconComponent: Calendar,
            action: () => navigate("/painel-cliente/agendar"),
            variant: "highlight" as const,
          },
          {
            label: "Meus Agendamentos",
            IconComponent: Clock,
            action: () => navigate("/painel-cliente/agendamentos"),
            variant: "info" as const,
          },
          {
            label: "Meu Perfil",
            IconComponent: Settings,
            action: () => navigate("/painel-cliente/perfil"),
            variant: "default" as const,
          },
          {
            label: isLoggingOut ? "Saindo..." : "Sair", 
            IconComponent: LogOut,
            action: handleLogout,
            variant: "warning" as const,
          },
        ].map((item, index) => (
          <PainelClienteCard
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
          </PainelClienteCard>
        ))}
      </div>
    </ClientPageContainer>
  );
}
