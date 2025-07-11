import React, { useState, useCallback, useEffect } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle,
  TrendingUp,
  Settings,
  LogOut,
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
  proximosAgendamentos?: {
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

        const trintaDiasDepois = new Date();
        trintaDiasDepois.setDate(agora.getDate() + 30);
        const dataLimite = trintaDiasDepois.toISOString().split('T')[0];

        const proximos = agendamentos.filter((a) => {
          const agendamentoData = a.data;
          const agendamentoHora = a.hora;

          const ehFuturo =
            agendamentoData > hoje ||
            (agendamentoData === hoje && agendamentoHora > horaAtual);

          const estaNoIntervalo =
            agendamentoData <= dataLimite &&
            a.status !== 'cancelado' &&
            a.status !== 'concluido';

          return ehFuturo && estaNoIntervalo;
        });

        const concluidos = agendamentos.filter((a) => a.status === 'concluido');

        setStats({
          total: agendamentos.length,
          proximos: proximos.length,
          concluidos: concluidos.length,
          proximosAgendamentos: proximos
            .sort((a, b) => {
              const dataA = new Date(`${a.data}T${a.hora}`);
              const dataB = new Date(`${b.data}T${b.hora}`);
              return dataA.getTime() - dataB.getTime();
            })
            .map((ag) => ({
              data: ag.data,
              hora: ag.hora,
              barbeiro: ag.painel_barbeiros.nome,
              servico: ag.painel_servicos.nome,
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              label: 'Total de Agendamentos',
              value: stats.total,
              icon: <Calendar className="h-5 w-5 text-urbana-gold" />,
            },
            {
              label: 'Próximos 30 dias',
              value: stats.proximos,
              icon: <Clock className="h-5 w-5 text-blue-400" />,
            },
            {
              label: 'Concluídos',
              value: stats.concluidos,
              icon: <CheckCircle className="h-5 w-5 text-green-500" />,
            },
          ].map((stat, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.02 }}
              className="bg-gray-900 border border-gray-700 rounded-xl shadow-sm"
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

        {stats.proximosAgendamentos?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="space-y-4"
          >
            {stats.proximosAgendamentos.map((agendamento, idx) => (
              <Card
                key={idx}
                className="bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700 rounded-xl shadow-md hover:shadow-lg transition-shadow"
              >
                <CardHeader className="flex items-center gap-3">
                  <Scissors className="text-urbana-gold w-5 h-5" />
                  <CardTitle className="text-urbana-gold text-base">
                    Agendamento #{idx + 1}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm text-gray-300">
                  <div className="flex gap-2 items-center">
                    <Calendar className="h-4 w-4 text-yellow-400" />
                    <span className="text-white">
                      {new Date(agendamento.data).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex gap-2 items-center">
                    <Clock className="h-4 w-4 text-blue-400" />
                    <span className="text-white">{agendamento.hora}</span>
                  </div>
                  <p>
                    <strong className="text-white">Barbeiro:</strong> {agendamento.barbeiro}
                  </p>
                  <p>
                    <strong className="text-white">Serviço:</strong> {agendamento.servico}
                  </p>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
          {[
            {
              label: 'Novo Agendamento',
              icon: <Calendar className="h-6 w-6 text-urbana-gold" />,
              action:
