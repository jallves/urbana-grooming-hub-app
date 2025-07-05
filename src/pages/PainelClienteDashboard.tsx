
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Scissors } from 'lucide-react';
import { usePainelClienteAuth } from '@/contexts/PainelClienteAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Agendamento {
  id: string;
  data: string;
  hora: string;
  status: string;
  observacoes?: string;
  created_at: string;
  painel_barbeiros: {
    nome: string;
  };
  painel_servicos: {
    nome: string;
    preco: number;
    duracao: number;
  };
}

export default function PainelClienteDashboard() {
  const navigate = useNavigate();
  const { cliente } = usePainelClienteAuth();
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (cliente) {
      fetchData();

      const channel = supabase
        .channel('painel_agendamentos_realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'painel_agendamentos',
            filter: `cliente_id=eq.${cliente.id}`
          },
          (payload) => {
            fetchAgendamentos();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [cliente]);

  const fetchData = async () => {
    await fetchAgendamentos();
    setLoading(false);
  };

  const fetchAgendamentos = async () => {
    if (!cliente) return;

    const { data, error } = await supabase
      .from('painel_agendamentos')
      .select(`*, painel_barbeiros!inner(nome), painel_servicos!inner(nome, preco, duracao)`)  
      .eq('cliente_id', cliente.id)
      .order('data', { ascending: false })
      .order('hora', { ascending: false });

    if (!error) setAgendamentos(data || []);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      agendado: { label: 'Agendado', variant: 'default' as const },
      confirmado: { label: 'Confirmado', variant: 'secondary' as const },
      concluido: { label: 'Concluído', variant: 'default' as const },
      cancelado: { label: 'Cancelado', variant: 'destructive' as const },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: 'default' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (!cliente) {
    navigate('/painel-cliente/login');
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-gradient-to-br from-zinc-950 to-zinc-900 p-3 sm:p-4 lg:p-6 xl:p-8 overflow-auto">
      <div className="h-full max-w-none mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-4 sm:space-y-6 lg:space-y-8 h-full"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">Dashboard</h1>
                <p className="text-gray-400 text-sm sm:text-base">Bem-vindo ao painel do cliente</p>
              </div>
            </div>
            <Button
              onClick={() => navigate('/painel-cliente/agendar')}
              className="bg-amber-500 hover:bg-amber-600 text-black font-semibold h-10 sm:h-12 px-4 sm:px-6"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Agendamento
            </Button>
          </div>

          {/* Cards de métricas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <Card className="bg-zinc-900 border-zinc-700">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-white text-sm sm:text-base">Próximos Agendamentos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold text-amber-500">
                  {agendamentos.filter(a => a.status === 'agendado' || a.status === 'confirmado').length}
                </div>
                <p className="text-gray-400 text-xs sm:text-sm">agendamentos confirmados</p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-700">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-white text-sm sm:text-base">Total de Serviços</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold text-green-500">
                  {agendamentos.filter(a => a.status === 'concluido').length}
                </div>
                <p className="text-gray-400 text-xs sm:text-sm">serviços concluídos</p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-700 sm:col-span-2 lg:col-span-1">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-white text-sm sm:text-base">Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg sm:text-xl font-semibold text-blue-500">Ativo</div>
                <p className="text-gray-400 text-xs sm:text-sm">conta verificada</p>
              </CardContent>
            </Card>
          </div>

          {/* Agendamentos Recentes */}
          <Card className="bg-zinc-900 border-zinc-700 flex-1">
            <CardHeader>
              <CardTitle className="text-white text-lg sm:text-xl">Agendamentos Recentes</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              {agendamentos.length === 0 ? (
                <div className="text-center py-8 sm:py-12 h-full flex flex-col justify-center">
                  <Scissors className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg sm:text-xl font-medium text-gray-300 mb-2">Nenhum agendamento encontrado</h3>
                  <p className="text-gray-400 mb-4 text-sm sm:text-base">Você ainda não possui agendamentos.</p>
                  <Button
                    onClick={() => navigate('/painel-cliente/agendar')}
                    className="bg-amber-500 hover:bg-amber-600 text-black mx-auto"
                  >
                    Fazer Primeiro Agendamento
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {agendamentos.slice(0, 5).map((agendamento) => (
                    <div key={agendamento.id} className="flex items-center justify-between p-3 sm:p-4 bg-zinc-800 rounded-lg">
                      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                        <div className="p-2 bg-amber-500 rounded-lg flex-shrink-0">
                          <Scissors className="h-4 w-4 text-black" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-white font-medium text-sm sm:text-base truncate">{agendamento.painel_servicos.nome}</h4>
                          <p className="text-gray-400 text-xs sm:text-sm truncate">
                            {agendamento.painel_barbeiros.nome} • {format(new Date(agendamento.data), 'dd/MM/yyyy', { locale: ptBR })} às {agendamento.hora}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {getStatusBadge(agendamento.status)}
                        <span className="text-amber-500 font-medium text-xs sm:text-sm">
                          R$ {agendamento.painel_servicos.preco.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  {agendamentos.length > 5 && (
                    <div className="text-center pt-4">
                      <Button
                        variant="outline"
                        onClick={() => navigate('/painel-cliente/agendamentos')}
                        className="border-gray-600 text-gray-300 hover:bg-gray-800"
                      >
                        Ver Todos os Agendamentos
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
