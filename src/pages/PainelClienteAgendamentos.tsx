import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import {
  Calendar,
  Clock,
  User,
  AlertCircle,
  CheckCircle,
  Filter,
  Plus,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClientPageContainer } from '@/components/painel-cliente/ClientPageContainer';
import { usePainelClienteAuth } from '@/contexts/PainelClienteAuthContext';
import { useClientDashboardRealtime } from '@/hooks/useClientDashboardRealtime';
import { supabase } from '@/integrations/supabase/client';

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

const statusLabels = {
  todos: 'Todos',
  confirmado: 'Confirmado',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
};

const statusClasses = {
  todos: 'bg-gray-800 text-gray-300 hover:bg-gray-700',
  confirmado: 'bg-blue-400/10 text-blue-400 hover:bg-blue-400/20',
  concluido: 'bg-green-400/10 text-green-400 hover:bg-green-400/20',
  cancelado: 'bg-red-400/10 text-red-400 hover:bg-red-400/20',
};

export default function PainelClienteAgendamentos() {
  const { cliente } = usePainelClienteAuth();
  const navigate = useNavigate();
  const [agendamentos, setAgendamentos] = useState<PainelAgendamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<keyof typeof statusLabels>('todos');

  const fetchAgendamentos = useCallback(async () => {
    if (!cliente?.id) return;

    setLoading(true);

    const { data, error } = await supabase
      .from('painel_agendamentos')
      .select(`*, painel_barbeiros!inner(nome), painel_servicos!inner(nome, preco)`)
      .eq('cliente_id', cliente.id)
      .order('data', { ascending: false })
      .order('hora', { ascending: false });

    if (data) setAgendamentos(data);
    if (error) console.error('Erro ao buscar agendamentos:', error);

    setLoading(false);
  }, [cliente?.id]);

  useEffect(() => {
    fetchAgendamentos();
  }, [fetchAgendamentos]);

  useClientDashboardRealtime(fetchAgendamentos);

  const handleConcluirAgendamento = async (id: string) => {
    const { error } = await supabase
      .from('painel_agendamentos')
      .update({ status: 'concluido' })
      .eq('id', id);

    if (error) {
      console.error('Erro ao concluir agendamento:', error);
      toast.error('Erro ao concluir o agendamento.');
      return;
    }

    toast.success('Agendamento marcado como concluído!');
    fetchAgendamentos();
  };

  const filteredAgendamentos =
    filtro === 'todos'
      ? agendamentos
      : agendamentos.filter((a) => a.status === filtro);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'concluido':
        return CheckCircle;
      case 'cancelado':
        return AlertCircle;
      default:
        return Calendar;
    }
  };

  if (loading) {
    return (
      <ClientPageContainer>
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 border-2 border-urbana-gold border-t-transparent rounded-full animate-spin" />
        </div>
      </ClientPageContainer>
    );
  }

  return (
    <ClientPageContainer>
      {/* Subtítulo da página */}
      <p className="text-urbana-light/70 text-sm sm:text-base mb-4 drop-shadow-md">
        Acompanhe todos os seus agendamentos
      </p>

      {/* Botão Novo Agendamento */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/painel-cliente/agendar')}
          className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-violet-500 text-white font-medium px-4 py-2 rounded-md hover:brightness-110 transition"
        >
          <Plus className="w-4 h-4" />
          Novo Agendamento
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-6">
          {Object.entries(statusLabels).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFiltro(key as keyof typeof statusLabels)}
              className={`px-4 py-2 text-sm font-medium rounded-md border border-gray-700 transition ${
                statusClasses[key as keyof typeof statusClasses]
              } ${filtro === key ? 'ring-1 ring-urbana-gold' : ''}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Lista de agendamentos */}
        {filteredAgendamentos.length === 0 ? (
          <Card className="bg-gray-900 border border-gray-700">
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Nenhum agendamento encontrado
              </h3>
              <p className="text-gray-400">
                Você ainda não possui agendamentos neste status.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredAgendamentos.map((agendamento, index) => {
              const StatusIcon = getStatusIcon(agendamento.status);

              return (
                <div
                  key={agendamento.id}
                >
                  <Card className="bg-gray-900 border border-gray-700 hover:border-gray-500 transition-colors">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-white text-lg flex items-center gap-2">
                          <StatusIcon className="h-5 w-5 text-urbana-gold" />
                          {agendamento.painel_servicos.nome}
                        </CardTitle>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            statusClasses[agendamento.status as keyof typeof statusClasses]
                          }`}
                        >
                          {statusLabels[agendamento.status as keyof typeof statusLabels]}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center text-gray-300">
                          <Calendar className="h-4 w-4 mr-2 text-urbana-gold" />
                          <span className="text-sm">
                            {format(parseISO(agendamento.data), 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
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
                        {agendamento.status === 'concluido' ? (
                          <span className="text-green-400 text-sm font-medium">
                            ✨ Atendimento finalizado!
                          </span>
                         ) : agendamento.status === 'confirmado' ? (
                          <button
                            onClick={() => handleConcluirAgendamento(agendamento.id)}
                            className="text-sm text-green-400 border border-green-400 px-3 py-1 rounded-md hover:bg-green-400/10 transition font-medium"
                          >
                            Marcar como Concluído
                          </button>
                         ) : null}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        )}
    </ClientPageContainer>
  );
}
