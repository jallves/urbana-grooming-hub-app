
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Clock, User, Scissors, Plus } from 'lucide-react';
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

export default function PainelClienteMeusAgendamentos() {
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Button
              onClick={() => navigate('/painel-cliente/dashboard')}
              variant="outline"
              size="sm"
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">Meus Agendamentos</h1>
              <p className="text-gray-400 text-sm sm:text-base">Visualize e gerencie seus horários marcados</p>
            </div>
            <Button
              onClick={() => navigate('/painel-cliente/agendar')}
              className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Agendamento
            </Button>
          </div>

          {/* Lista de Agendamentos */}
          <div className="flex-1">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-white">Carregando...</div>
              </div>
            ) : agendamentos.length === 0 ? (
              <Card className="bg-gray-900 border border-gray-700 h-full flex items-center justify-center">
                <CardContent className="p-8 sm:p-12 text-center">
                  <Scissors className="h-16 w-16 sm:h-20 sm:w-20 text-gray-500 mx-auto mb-6" />
                  <h3 className="text-xl sm:text-2xl font-semibold text-white mb-3">
                    Nenhum agendamento encontrado
                  </h3>
                  <p className="text-gray-400 mb-6 text-sm sm:text-base">
                    Você ainda não possui agendamentos. Que tal marcar um horário?
                  </p>
                  <Button
                    onClick={() => navigate('/painel-cliente/agendar')}
                    className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Fazer Primeiro Agendamento
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {agendamentos.map((agendamento, index) => (
                  <motion.div
                    key={agendamento.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Card className="bg-gray-900 border border-gray-700 hover:border-gray-600 transition-colors h-full">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start gap-2">
                          <CardTitle className="text-white text-base sm:text-lg">
                            {agendamento.painel_servicos.nome}
                          </CardTitle>
                          {getStatusBadge(agendamento.status)}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-2">
                          <div className="flex items-center text-gray-300">
                            <Calendar className="h-4 w-4 mr-2 text-amber-500 flex-shrink-0" />
                            <span className="text-sm">{format(new Date(agendamento.data), 'dd/MM/yyyy', { locale: ptBR })}</span>
                          </div>
                          <div className="flex items-center text-gray-300">
                            <Clock className="h-4 w-4 mr-2 text-amber-500 flex-shrink-0" />
                            <span className="text-sm">{agendamento.hora}</span>
                          </div>
                          <div className="flex items-center text-gray-300">
                            <User className="h-4 w-4 mr-2 text-amber-500 flex-shrink-0" />
                            <span className="text-sm">{agendamento.painel_barbeiros.nome}</span>
                          </div>
                        </div>
                        <div className="pt-2 border-t border-gray-700">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-sm">Preço:</span>
                            <span className="text-amber-500 font-semibold">
                              R$ {agendamento.painel_servicos.preco.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-sm">Duração:</span>
                            <span className="text-gray-300 text-sm">
                              {agendamento.painel_servicos.duracao} min
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
