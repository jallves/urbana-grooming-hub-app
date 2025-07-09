
import React, { useState, useCallback, useEffect } from 'react';
import { Calendar, Clock, CheckCircle, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import DashboardContainer from '@/components/ui/containers/DashboardContainer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePainelClienteAuth } from '@/contexts/PainelClienteAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useClientDashboardRealtime } from '@/hooks/useClientDashboardRealtime';

interface AgendamentoStats {
  total: number;
  proximos: number;
  concluidos: number;
  proximoAgendamento?: {
    data: string;
    hora: string;
    barbeiro: string;
    servico: string;
  };
}

export default function PainelClienteDashboard() {
  const { cliente } = usePainelClienteAuth();
  const [stats, setStats] = useState<AgendamentoStats>({
    total: 0,
    proximos: 0,
    concluidos: 0
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

        const proximos = agendamentos.filter(a => 
          a.status !== 'cancelado' && 
          a.status !== 'concluido' &&
          (a.data > hoje || (a.data === hoje && a.hora > horaAtual))
        );

        const concluidos = agendamentos.filter(a => a.status === 'concluido');

        // Próximo agendamento
        const proximoAgendamento = proximos
          .sort((a, b) => {
            const dataA = new Date(`${a.data}T${a.hora}`);
            const dataB = new Date(`${b.data}T${b.hora}`);
            return dataA.getTime() - dataB.getTime();
          })[0];

        setStats({
          total: agendamentos.length,
          proximos: proximos.length,
          concluidos: concluidos.length,
          proximoAgendamento: proximoAgendamento ? {
            data: proximoAgendamento.data,
            hora: proximoAgendamento.hora,
            barbeiro: proximoAgendamento.painel_barbeiros.nome,
            servico: proximoAgendamento.painel_servicos.nome
          } : undefined
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

  // Configurar atualizações em tempo real
  useClientDashboardRealtime(fetchStats);

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
      >
        <div className="flex items-center gap-3 mb-8">
          <TrendingUp className="h-8 w-8 text-urbana-gold" />
          <div>
            <h1 className="text-3xl font-bold text-urbana-gold font-playfair">
              Olá, {cliente?.nome}!
            </h1>
            <p className="text-gray-400">Bem-vindo ao seu painel de controle</p>
          </div>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gray-900 border border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">
                Total de Agendamentos
              </CardTitle>
              <Calendar className="h-4 w-4 text-urbana-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.total}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">
                Próximos Agendamentos
              </CardTitle>
              <Clock className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.proximos}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">
                Atendimentos Concluídos
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.concluidos}</div>
            </CardContent>
          </Card>
        </div>

        {/* Próximo Agendamento */}
        {stats.proximoAgendamento && (
          <Card className="bg-gradient-to-r from-urbana-gold/10 to-transparent border border-urbana-gold/20">
            <CardHeader>
              <CardTitle className="text-urbana-gold">Próximo Agendamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-urbana-gold" />
                <span className="text-white">
                  {new Date(stats.proximoAgendamento.data).toLocaleDateString('pt-BR')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-urbana-gold" />
                <span className="text-white">{stats.proximoAgendamento.hora}</span>
              </div>
              <div className="text-gray-300">
                <strong>Barbeiro:</strong> {stats.proximoAgendamento.barbeiro}
              </div>
              <div className="text-gray-300">
                <strong>Serviço:</strong> {stats.proximoAgendamento.servico}
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </DashboardContainer>
  );
}
