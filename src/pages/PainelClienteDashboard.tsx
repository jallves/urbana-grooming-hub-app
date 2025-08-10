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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-urbana-gold font-playfair">
              Olá, {cliente?.nome}!
            </h1>
            <p className="text-gray-400">Bem-vindo à Urbana Barbearia</p>
          </div>
        </div>

        {/* Estatísticas em Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[
            {
              label: "Total de Agendamentos",
              value: stats.total,
              icon: <Calendar className="h-5 w-5 text-urbana-gold" />,
              status: "todos",
            },
            {
              label: "Próximos 30 Dias", 
              value: stats.proximos,
              icon: <Clock className="h-5 w-5 text-urbana-gold" />,
              status: "confirmado",
            },
            {
              label: "Atendimentos Concluídos",
              value: stats.concluidos,
              icon: <CheckCircle className="h-5 w-5 text-urbana-gold" />,
              status: "concluido",
            },
          ].map((stat, i) => (
            <Card key={i} className="bg-gray-900 border border-gray-700">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-white text-sm font-medium flex items-center gap-2">
                    {stat.icon}
                    {stat.label}
                  </CardTitle>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      stat.status === 'concluido' 
                        ? 'bg-green-400/10 text-green-400'
                        : stat.status === 'confirmado'
                        ? 'bg-blue-400/10 text-blue-400'
                        : 'bg-gray-800 text-gray-300'
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
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">
                  {stat.value}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Próximos Agendamentos */}
        {stats.agendamentosFuturos && stats.agendamentosFuturos.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-urbana-gold mb-4">
              Próximos Agendamentos
            </h2>
            <div className="space-y-4">
              {stats.agendamentosFuturos.map((ag, index) => (
                <Card key={index} className="bg-gray-900 border border-gray-700">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-white text-lg flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-urbana-gold" />
                        {ag.servico}
                      </CardTitle>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-400/10 text-blue-400">
                        Agendado
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center text-gray-300">
                        <Calendar className="h-4 w-4 mr-2 text-urbana-gold" />
                        <span className="text-sm">
                          {new Date(ag.data).toLocaleDateString("pt-BR", {
                            weekday: "long",
                            day: "numeric", 
                            month: "long"
                          })}
                        </span>
                      </div>
                      <div className="flex items-center text-gray-300">
                        <Clock className="h-4 w-4 mr-2 text-urbana-gold" />
                        <span className="text-sm">{ag.hora}</span>
                      </div>
                    </div>
                    <div className="flex items-center text-gray-300">
                      <User className="h-4 w-4 mr-2 text-urbana-gold" />
                      <span className="text-sm">{ag.barbeiro}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Ações Rápidas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Novo Agendamento",
              icon: <Calendar className="h-6 w-6" />,
              action: () => navigate("/painel-cliente/agendar"),
              color: "bg-gradient-to-r from-pink-500 to-violet-500",
            },
            {
              label: "Meus Agendamentos",
              icon: <Clock className="h-6 w-6" />,
              action: () => navigate("/painel-cliente/agendamentos"),
              color: "bg-blue-600",
            },
            {
              label: "Meu Perfil",
              icon: <Settings className="h-6 w-6" />,
              action: () => navigate("/painel-cliente/perfil"),
              color: "bg-gray-600",
            },
            {
              label: "Sair", 
              icon: <LogOut className="h-6 w-6" />,
              action: handleLogout,
              color: "bg-red-600",
            },
          ].map((item, index) => (
            <button
              key={index}
              onClick={item.action}
              className={`${item.color} text-white rounded-lg p-4 flex flex-col items-center justify-center space-y-2 transition-all duration-200 hover:brightness-110`}
            >
              {item.icon}
              <span className="text-sm font-medium text-center">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </DashboardContainer>
  );
}
