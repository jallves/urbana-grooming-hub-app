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
      {/* Marca d'água sutil */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "url('https://cdn-icons-png.flaticon.com/512/1185/1185416.png')",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          backgroundSize: "400px",
          opacity: 0.03,
          pointerEvents: "none",
        }}
      />
      
      <div className="relative space-y-8 animate-fade-in">
        {/* Cabeçalho Elegante */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/20 p-8">
          <div className="flex items-center gap-6">
            <div className="p-3 rounded-full bg-primary/20 backdrop-blur-sm">
              <TrendingUp className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-foreground font-playfair bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Olá, {cliente?.nome}!
              </h1>
              <p className="text-muted-foreground text-lg mt-1">
                Bem-vindo ao seu espaço personalizado
              </p>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/20 to-transparent rounded-full -translate-y-8 translate-x-8" />
        </div>

        {/* Estatísticas Modernas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              label: "Total de Agendamentos",
              value: stats.total,
              icon: <Calendar className="h-6 w-6" />,
              gradient: "from-primary/20 to-primary/5",
              iconBg: "bg-primary/20",
              iconColor: "text-primary",
            },
            {
              label: "Próximos 30 Dias",
              value: stats.proximos,
              icon: <Clock className="h-6 w-6" />,
              gradient: "from-blue-500/20 to-blue-500/5",
              iconBg: "bg-blue-500/20",
              iconColor: "text-blue-500",
            },
            {
              label: "Atendimentos Concluídos",
              value: stats.concluidos,
              icon: <CheckCircle className="h-6 w-6" />,
              gradient: "from-green-500/20 to-green-500/5",
              iconBg: "bg-green-500/20",
              iconColor: "text-green-500",
            },
          ].map((stat, i) => (
            <Card
              key={i}
              className={`bg-gradient-to-br ${stat.gradient} border border-border/50 rounded-xl backdrop-blur-sm transition-all duration-300 shadow-lg`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg ${stat.iconBg}`}>
                    <div className={stat.iconColor}>
                      {stat.icon}
                    </div>
                  </div>
                </div>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-3xl font-bold text-foreground">
                  {stat.value}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Próximos Agendamentos Elegantes */}
        {stats.agendamentosFuturos &&
          stats.agendamentosFuturos.length > 0 && (
            <Card className="bg-card/50 border border-border/50 rounded-xl backdrop-blur-sm shadow-lg">
              <CardHeader className="border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-primary text-xl font-semibold">
                    Próximos Agendamentos
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {stats.agendamentosFuturos.map((ag, index) => (
                    <div
                      key={index}
                      className="relative p-4 rounded-lg bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 transition-all duration-300"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-4 w-4 text-primary flex-shrink-0" />
                          <span className="text-foreground font-medium">
                            {new Date(ag.data).toLocaleDateString("pt-BR", {
                              weekday: "long",
                              day: "numeric",
                              month: "long"
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Clock className="h-4 w-4 text-primary flex-shrink-0" />
                          <span className="text-foreground font-medium">{ag.hora}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <User className="h-4 w-4 text-primary flex-shrink-0" />
                          <span className="text-muted-foreground">{ag.barbeiro}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Scissors className="h-4 w-4 text-primary flex-shrink-0" />
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
              icon: <Calendar className="h-7 w-7" />,
              action: () => navigate("/painel-cliente/agendar"),
              gradient: "from-primary/20 to-primary/5",
              iconColor: "text-primary",
              border: "border-primary/30",
            },
            {
              label: "Meus Agendamentos",
              icon: <Clock className="h-7 w-7" />,
              action: () => navigate("/painel-cliente/agendamentos"),
              gradient: "from-blue-500/20 to-blue-500/5",
              iconColor: "text-blue-500",
              border: "border-blue-500/30",
            },
            {
              label: "Meu Perfil",
              icon: <Settings className="h-7 w-7" />,
              action: () => navigate("/painel-cliente/perfil"),
              gradient: "from-gray-500/20 to-gray-500/5",
              iconColor: "text-gray-400",
              border: "border-gray-500/30",
            },
            {
              label: "Sair",
              icon: <LogOut className="h-7 w-7" />,
              action: handleLogout,
              gradient: "from-red-500/20 to-red-500/5",
              iconColor: "text-red-500",
              border: "border-red-500/30",
            },
          ].map((item, index) => (
            <button
              key={index}
              onClick={item.action}
              className={`bg-gradient-to-br ${item.gradient} border ${item.border} rounded-xl p-6 flex flex-col items-center justify-center transition-all duration-300 space-y-3 group backdrop-blur-sm shadow-lg`}
            >
              <div className={`${item.iconColor} transition-transform duration-300 group-active:scale-95`}>
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
