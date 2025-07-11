import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, User, AlertCircle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import DashboardContainer from '@/components/ui/containers/DashboardContainer';
import { useClientDashboardRealtime } from '@/hooks/useClientDashboardRealtime';
import { usePainelClienteAuth } from '@/contexts/PainelClienteAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PainelAgendamento {
  id: string;
  data: string;
  hora: string;
  status: string;
  painel_barbeiros: {
    nome: string;
  };
  painel_servicos: {
    nome: string;
    preco: number;
  };
}

export default function PainelClienteAgendamentos() {
  const { cliente } = usePainelClienteAuth();
  const { toast } = useToast();
  const [agendamentos, setAgendamentos] = useState<PainelAgendamento[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAgendamentos = useCallback(async () => {
    if (!cliente?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('painel_agendamentos')
        .select(`
          *,
          painel_barbeiros!inner(nome),
          painel_servicos!inner(nome, preco)
        `)
        .eq('cliente_id', cliente.id)
        .order('data', { ascending: false })
        .order('hora', { ascending: false });

      if (error) {
        console.error('Erro ao buscar agendamentos:', error);
        return;
      }

      if (data) {
        setAgendamentos(data);
      }
    } catch (error) {
      console.error('Erro ao carregar agendamentos:', error);
    } finally {
      setLoading(false);
    }
  }, [cliente?.id]);

  useEffect(() => {
    fetchAgendamentos();
  }, [fetchAgendamentos]);

  useClientDashboardRealtime(fetchAgendamentos);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmado': return 'text-blue-400 bg-blue-400/10';
      case 'agendado': return 'text-amber-400 bg-amber-400/10';
      case 'concluido': return 'text-green-400 bg-green-400/10';
      case 'cancelado': return 'text-red-400 bg-red-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'concluido': return CheckCircle;
      case 'cancelado': return AlertCircle;
      default: return Calendar;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmado': return 'Confirmado';
      case 'agendado': return 'Agendado';
      case 'concluido': return 'Concluído';
      case 'cancelado': return 'Cancelado';
      default: return status;
    }
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
      >
        <div className="flex items-center gap-3 mb-6">
          <Calendar className="h-8 w-8 text-urbana-gold" />
          <div>
            <h1 className="text-3xl font-bold text-urbana-gold font-playfair">Meus Agendamentos</h1>
            <p className="text-gray-400">Visualize e acompanhe seus horários marcados</p>
          </div>
        </div>

        {agendamentos.length === 0 ? (
          <Card className="bg-gray-900 border border-gray-700">
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Nenhum agendamento encontrado
              </h3>
              <p className="text-gray-400">
                Você ainda não possui agendamentos. Que tal marcar um horário?
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {agendamentos.map((agendamento, index) => {
              const StatusIcon = getStatusIcon(agendamento.status);

              return (
                <motion.div
                  key={agendamento.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card className="bg-gray-900 border border-gray-700 hover:border-gray-500 transition-colors">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-white text-lg flex items-center gap-2">
                          <StatusIcon className="h-5 w-5 text-urbana-gold" />
                          {agendamento.painel_servicos.nome}
                        </CardTitle>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(agendamento.status)}`}>
                          {getStatusLabel(agendamento.status)}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center text-gray-300">
                          <Calendar className="h-4 w-4 mr-2 text-urbana-gold" />
                          <span className="text-sm">{new Date(agendamento.data).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <div className="flex items-center text-gray-300">
                          <Clock className="h-4 w-4 mr-2 text-urbana-gold" />
                          <span className="text-sm">{agendamento.hora}</span>
                        </div>
                      </div>
                      <div className="flex items-center text-gray-300">
                        <User className="h-4 w-4 mr-2 text-urbana-gold" />
                        <span className="text-sm">{agendamento.painel_barbeiros.nome}</span>
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-urbana-gold font-semibold">
                          R$ {agendamento.painel_servicos.preco.toFixed(2)}
                        </span>
                        {agendamento.status === 'concluido' && (
                          <span className="text-green-400 text-sm font-medium">
                            ✨ Atendimento finalizado!
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </DashboardContainer>
  );
}
