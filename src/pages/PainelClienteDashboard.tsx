import React, { useState, useCallback, useEffect } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle,
  TrendingUp,
  Settings,
  LogOut,
  User,
  Scissors,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import DashboardContainer from '@/components/ui/containers/DashboardContainer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePainelClienteAuth } from '@/contexts/PainelClienteAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useClientDashboardRealtime } from '@/hooks/useClientDashboardRealtime';

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
        .from('painel_agendamentos')
        .select(`
          *,
          painel_barbeiros!inner(nome),
          painel_servicos!inner(nome)
        `)
        .eq('cliente_id', cliente.id);

      if (error) {
        console.error('Erro ao buscar estatísticas:', error);
        return;
      }

      if (agendamentos) {
        const agora = new Date();
        const hoje = agora.toISOString().split('T')[0];
        const horaAtual = agora.toTimeString().split(' ')[0].substring(0, 5);

        const hojeDate = new Date(hoje);
        const dataLimite = new Date(hojeDate);
        dataLimite.setDate(dataLimite.getDate() + 30);

        const proximos = agendamentos.filter((a) => {
          const agendamentoDate = new Date(`${a.data}T${a.hora}`);
          return (
            a.status !== 'cancelado' &&
            a.status !== 'concluido' &&
            agendamentoDate >= agora &&
            agendamentoDate <= dataLimite
          );
        });

        const concluidos = agendamentos.filter((a) => a.status === 'concluido');

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
      console.error('Erro ao carregar estatísticas:', error);
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
    navigate('/painel-cliente/login');
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-10"
      >
        <div className="flex items-center gap-4 mb-2">
          <TrendingUp className="h-9 w-9 text-urbana-gold" />
          <div>
            <h1 className="text-4xl font-extrabold text-urbana-gold font-playfair">
              Olá, {cliente?.nome}!
            </h1>
            <p className="text-gray-400 text-sm">
              Bem-vindo ao seu painel personalizado
            </p>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                label: 'Total de Agendamentos',
                value: stats.total,
                icon: <Calendar className="h-5 w-5 text-urbana-gold" />,
                bgColor: 'bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border-amber-500/20',
              },
              {
                label: 'Próximos 30 Dias',
                value: stats.proximos,
                icon: <Clock className="h-5 w-5 text-blue-400" />,
                bgColor: 'bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500/20',
              },
              {
                label: 'Atendimentos Concluídos',
                value: stats.concluidos,
                icon: <CheckCircle className="h-5 w-5 text-green-400" />,
                bgColor: 'bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20',
              },
            ].map((stat, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.02 }}
                className={`${stat.bgColor} rounded-xl shadow-sm border`}
              >
                <CardHeader className="flex flex-row items-center justify-between pb-1 px-5 pt-5">
                  <CardTitle className="text-sm font-medium text-gray-300">
                    {stat.label}
                  </CardTitle>
                  {stat.icon}
                </CardHeader>
                <CardContent className="px-5 pb-5">
                  <div className="text-3xl font-bold text-white">{stat.value}</div>
                </CardContent>
              </motion.div>
            ))}
        </div>

        {/* Lista dos próximos agendamentos */}
        {stats.agendamentosFuturos && stats.agendamentosFuturos.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="bg-gray-900 border border-gray-700 rounded-xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-urbana-gold text-lg">
                  Próximos Agendamentos (30 dias)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-gray-300">
                {stats.agendamentosFuturos.map((ag, index) => (
                  <div
                    key={index}
                    className="border-b border-gray-700 pb-3 last:border-b-0 last:pb-0"
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-urbana-gold" />
                      <span className="text-white">
                        {new Date(ag.data).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-urbana-gold" />
                      <span className="text-white">{ag.hora}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-urbana-gold" />
                      <span>{ag.barbeiro}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Scissors className="h-4 w-4 text-urbana-gold" />
                      <span>{ag.servico}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Ações */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
          {[
            {
              label: 'Novo Agendamento',
              icon: <Calendar className="h-6 w-6 text-urbana-gold" />,
              action: () => navigate('/painel-cliente/agendar'),
            },
            {
              label: 'Meus Agendamentos',
              icon: <Clock className="h-6 w-6 text-blue-400" />,
              action: () => navigate('/painel-cliente/agendamentos'),
            },
            {
              label: 'Meu Perfil',
              icon: <Settings className="h-6 w-6 text-gray-300" />,
              action: () => navigate('/painel-cliente/perfil'),
            },
            {
              label: 'Sair',
              icon: <LogOut className="h-6 w-6 text-red-500" />,
              action: handleLogout,
            },
          ].map((item, index) => (
            <motion.button
              key={index}
              onClick={item.action}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="bg-gray-800 hover:bg-urbana-gold/10 transition-all border border-gray-700 rounded-xl p-5 flex flex-col items-center justify-center text-gray-200 space-y-2"
            >
              {item.icon}
              <span className="text-sm font-medium">{item.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </DashboardContainer>
  );
}
