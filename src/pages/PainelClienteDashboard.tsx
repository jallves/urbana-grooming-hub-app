import React, { useState, useCallback, useEffect } from "react";
import {
  Calendar,
  Clock,
  CheckCircle,
  TrendingUp,
  Settings,
  LogOut,
  User,
  Scissors,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardContainer from "@/components/ui/containers/DashboardContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      <DashboardContainer>
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 border-2 border-urbana-gold border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer>
      <div className="space-y-8">
        {/* Cabeçalho Profissional */}
        <div className="flex items-center gap-4 py-6 border-b border-border">
          <div className="p-3 rounded-lg bg-amber-100 dark:bg-amber-900/20">
            <TrendingUp className="h-8 w-8 text-amber-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Olá, {cliente?.nome}!
            </h1>
            <p className="text-muted-foreground">
              Bem-vindo à Urbana Barbearia
            </p>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              label: "Total de Agendamentos",
              value: stats.total,
              icon: <Calendar className="h-6 w-6" />,
              color: "text-amber-600",
              bgColor: "bg-amber-50 dark:bg-amber-900/10",
            },
            {
              label: "Próximos 30 Dias", 
              value: stats.proximos,
              icon: <Clock className="h-6 w-6" />,
              color: "text-blue-600",
              bgColor: "bg-blue-50 dark:bg-blue-900/10",
            },
            {
              label: "Atendimentos Concluídos",
              value: stats.concluidos,
              icon: <CheckCircle className="h-6 w-6" />,
              color: "text-green-600", 
              bgColor: "bg-green-50 dark:bg-green-900/10",
            },
          ].map((stat, i) => (
            <Card key={i} className="border border-border bg-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.label}
                    </p>
                    <p className="text-3xl font-bold text-foreground mt-2">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <div className={stat.color}>
                      {stat.icon}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Próximos Agendamentos */}
        {stats.agendamentosFuturos && stats.agendamentosFuturos.length > 0 && (
          <Card className="border border-border bg-card">
            <CardHeader className="pb-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/20">
                  <Calendar className="h-5 w-5 text-amber-600" />
                </div>
                <CardTitle className="text-xl text-foreground">
                  Próximos Agendamentos
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {stats.agendamentosFuturos.map((ag, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg border border-border bg-muted/30"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-amber-600" />
                        <span className="font-medium text-foreground">
                          {new Date(ag.data).toLocaleDateString("pt-BR", {
                            weekday: "long",
                            day: "numeric", 
                            month: "long"
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-amber-600" />
                        <span className="font-medium text-foreground">{ag.hora}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-amber-600" />
                        <span className="text-muted-foreground">{ag.barbeiro}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Scissors className="h-4 w-4 text-amber-600" />
                        <span className="text-muted-foreground">{ag.servico}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Ações Rápidas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Novo Agendamento",
              icon: <Calendar className="h-6 w-6" />,
              action: () => navigate("/painel-cliente/agendar"),
              color: "text-amber-600",
              bgColor: "bg-amber-50 dark:bg-amber-900/10",
              borderColor: "border-amber-200 dark:border-amber-800",
            },
            {
              label: "Meus Agendamentos",
              icon: <Clock className="h-6 w-6" />,
              action: () => navigate("/painel-cliente/agendamentos"),
              color: "text-blue-600",
              bgColor: "bg-blue-50 dark:bg-blue-900/10", 
              borderColor: "border-blue-200 dark:border-blue-800",
            },
            {
              label: "Meu Perfil",
              icon: <Settings className="h-6 w-6" />,
              action: () => navigate("/painel-cliente/perfil"),
              color: "text-gray-600",
              bgColor: "bg-gray-50 dark:bg-gray-900/10",
              borderColor: "border-gray-200 dark:border-gray-800",
            },
            {
              label: "Sair", 
              icon: <LogOut className="h-6 w-6" />,
              action: handleLogout,
              color: "text-red-600",
              bgColor: "bg-red-50 dark:bg-red-900/10",
              borderColor: "border-red-200 dark:border-red-800",
            },
          ].map((item, index) => (
            <button
              key={index}
              onClick={item.action}
              className={`${item.bgColor} border ${item.borderColor} rounded-lg p-6 flex flex-col items-center justify-center space-y-3`}
            >
              <div className={item.color}>
                {item.icon}
              </div>
              <span className="text-sm font-medium text-foreground text-center">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </DashboardContainer>
  );
}
