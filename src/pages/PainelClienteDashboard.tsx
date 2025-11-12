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
import { 
  PainelClienteCard, 
  PainelClienteCardTitle, 
  PainelClienteCardDescription,
  PainelClienteCardHeader,
  PainelClienteCardContent 
} from "@/components/painel-cliente/PainelClienteCard";
import { PainelClienteContentContainer } from "@/components/painel-cliente/PainelClienteContentContainer";
import { usePainelClienteAuth } from "@/contexts/PainelClienteAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useClientDashboardRealtime } from "@/hooks/useClientDashboardRealtime";

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

export default function PainelClienteDashboard() {
  const { cliente, logout } = usePainelClienteAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<AgendamentoStats>({
    total: 0,
    proximos: 0,
    concluidos: 0,
  });
  const [loading, setLoading] = useState(true);

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

  const handleLogout = async () => {
    await logout();
    navigate("/painel-cliente/login");
  };

  if (loading) {
    return (
      <PainelClienteContentContainer>
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 border-2 border-urbana-gold border-t-transparent rounded-full animate-spin" />
        </div>
      </PainelClienteContentContainer>
    );
  }

  return (
    <PainelClienteContentContainer>
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-urbana-gold font-playfair drop-shadow-lg">
            Olá, {cliente?.nome}!
          </h1>
          <p className="text-urbana-light/70 drop-shadow-md">Bem-vindo à Urbana Barbearia</p>
        </div>
      </div>

      {/* Estatísticas em Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
            label: "Atendimentos Concluídos",
            value: stats.concluidos,
            IconComponent: CheckCircle,
            status: "concluido",
            variant: 'success' as const,
          },
        ].map((stat, i) => (
          <PainelClienteCard key={i} variant={stat.variant} icon={stat.IconComponent}>
            <PainelClienteCardHeader>
              <div className="flex justify-between items-start">
                <PainelClienteCardTitle className="text-sm font-medium">
                  {stat.label}
                </PainelClienteCardTitle>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
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
            <PainelClienteCardContent>
              <div className="text-3xl font-bold text-urbana-light">
                {stat.value}
              </div>
            </PainelClienteCardContent>
          </PainelClienteCard>
        ))}
      </div>

      {/* Próximos Agendamentos */}
      {stats.agendamentosFuturos && stats.agendamentosFuturos.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-urbana-gold mb-4 drop-shadow-lg">
            Próximos Agendamentos
          </h2>
          <div className="space-y-4">
            {stats.agendamentosFuturos.map((ag, index) => (
              <PainelClienteCard key={index} variant="info" icon={Calendar}>
                <PainelClienteCardHeader>
                  <div className="flex justify-between items-start">
                    <PainelClienteCardTitle className="text-lg">
                      {ag.servico}
                    </PainelClienteCardTitle>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-400/10 text-blue-400">
                      Agendado
                    </span>
                  </div>
                </PainelClienteCardHeader>
                <PainelClienteCardContent className="space-y-3">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center text-urbana-light/70">
                      <Calendar className="h-4 w-4 mr-2 text-urbana-gold" />
                      <span className="text-sm">
                        {new Date(ag.data).toLocaleDateString("pt-BR", {
                          weekday: "long",
                          day: "numeric", 
                          month: "long"
                        })}
                      </span>
                    </div>
                    <div className="flex items-center text-urbana-light/70">
                      <Clock className="h-4 w-4 mr-2 text-urbana-gold" />
                      <span className="text-sm">{ag.hora}</span>
                    </div>
                  </div>
                  <div className="flex items-center text-urbana-light/70">
                    <User className="h-4 w-4 mr-2 text-urbana-gold" />
                    <span className="text-sm">{ag.barbeiro}</span>
                  </div>
                </PainelClienteCardContent>
              </PainelClienteCard>
            ))}
          </div>
        </div>
      )}

      {/* Ações Rápidas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
            label: "Sair", 
            IconComponent: LogOut,
            action: handleLogout,
            variant: "warning" as const,
          },
        ].map((item, index) => (
          <PainelClienteCard
            key={index}
            onClick={item.action}
            variant={item.variant}
            icon={item.IconComponent}
            className="p-6 flex flex-col items-center justify-center space-y-3 min-h-[120px]"
          >
            <item.IconComponent className="h-8 w-8 text-urbana-light" />
            <span className="text-sm font-medium text-center text-urbana-light">
              {item.label}
            </span>
          </PainelClienteCard>
        ))}
      </div>
    </PainelClienteContentContainer>
  );
}
