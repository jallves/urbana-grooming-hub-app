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
  Pencil,
  Ticket,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClientPageContainer } from '@/components/painel-cliente/ClientPageContainer';
import { usePainelClienteAuth } from '@/contexts/PainelClienteAuthContext';
import { useClientDashboardRealtime } from '@/hooks/useClientDashboardRealtime';
import { supabase } from '@/integrations/supabase/client';
import EditAgendamentoDialog from '@/components/painel-cliente/EditAgendamentoDialog';

interface PainelAgendamento {
  id: string;
  data: string;
  hora: string;
  status: string;
  servico_id: string | null;
  barbeiro_id: string | null;
  notas: string | null;
  servicos_extras: Array<{ id?: string; nome: string; preco: number; duracao?: number }> | null;
  cupom_codigo?: string | null;
  desconto_valor?: number | null;
  valor_final?: number | null;
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
  const [editing, setEditing] = useState<PainelAgendamento | null>(null);

  const fetchAgendamentos = useCallback(async () => {
    if (!cliente?.id) return;

    setLoading(true);

    const { data, error } = await supabase
      .from('painel_agendamentos')
      .select(
        `id, data, hora, status, servico_id, barbeiro_id, notas, servicos_extras, cupom_codigo, desconto_valor, valor_final, painel_barbeiros!inner(nome), painel_servicos!inner(nome, preco)`
      )
      .eq('cliente_id', cliente.id)
      .order('data', { ascending: false })
      .order('hora', { ascending: false });

    if (data) setAgendamentos(data as any);
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

  // Pode editar se agendado/confirmado e faltam ≥ 1h
  const canEdit = (a: PainelAgendamento): boolean => {
    if (!['agendado', 'confirmado'].includes(a.status)) return false;
    try {
      const [hh, mm] = a.hora.split(':').map(Number);
      const [y, mo, d] = a.data.split('-').map(Number);
      const dt = new Date(y, mo - 1, d, hh, mm, 0, 0);
      return dt.getTime() - Date.now() >= 60 * 60 * 1000;
    } catch {
      return false;
    }
  };

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

  // Debug: verificar se o header está sendo renderizado
  console.log('✅ PainelClienteAgendamentos - ClientPageContainer com header automático');

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
    <ClientPageContainer key="agendamentos-2024-v2">
      {/* Filtros e Conteúdo */}
      <div className="space-y-6">
        {/* Botão Novo Agendamento */}
        <div>
          <button
            onClick={() => navigate('/painel-cliente/agendar')}
            className="flex items-center gap-2 bg-urbana-gold hover:bg-urbana-gold/90 text-black font-semibold px-4 py-2.5 rounded-lg transition-all shadow-lg"
          >
            <Plus className="w-4 h-4" />
            Novo Agendamento
          </button>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-3">
          {Object.entries(statusLabels).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFiltro(key as keyof typeof statusLabels)}
              className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all ${
                statusClasses[key as keyof typeof statusClasses]
              } ${filtro === key ? 'ring-2 ring-urbana-gold border-urbana-gold' : 'border-urbana-gold/20'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Lista de agendamentos */}
        {filteredAgendamentos.length === 0 ? (
          <Card className="bg-urbana-black/40 border-2 border-urbana-gold/20">
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-urbana-gold/50 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Nenhum agendamento encontrado
              </h3>
              <p className="text-urbana-light/70">
                Você ainda não possui agendamentos neste status.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredAgendamentos.map((agendamento) => {
              const StatusIcon = getStatusIcon(agendamento.status);

              return (
                <Card 
                  key={agendamento.id}
                  className="bg-urbana-black/40 border-2 border-urbana-gold/20 hover:border-urbana-gold/50 transition-all"
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start gap-3">
                      <CardTitle className="text-white text-base sm:text-lg flex items-center gap-2">
                        <StatusIcon className="h-5 w-5 text-urbana-gold shrink-0" />
                        <span className="break-words">{agendamento.painel_servicos.nome}</span>
                      </CardTitle>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 ${
                          statusClasses[agendamento.status as keyof typeof statusClasses]
                        }`}
                      >
                        {statusLabels[agendamento.status as keyof typeof statusLabels]}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center text-urbana-light/80">
                        <Calendar className="h-4 w-4 mr-2 text-urbana-gold" />
                        <span className="text-sm">
                          {format(parseISO(agendamento.data), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </div>
                      <div className="flex items-center text-urbana-light/80">
                        <Clock className="h-4 w-4 mr-2 text-urbana-gold" />
                        <span className="text-sm">{agendamento.hora}</span>
                      </div>
                    </div>
                    <div className="flex items-center text-urbana-light/80">
                      <User className="h-4 w-4 mr-2 text-urbana-gold" />
                      <span className="text-sm break-words">{agendamento.painel_barbeiros.nome}</span>
                    </div>
                    {Array.isArray(agendamento.servicos_extras) && agendamento.servicos_extras.length > 0 && (() => {
                      const grouped = agendamento.servicos_extras.reduce<Record<string, { nome: string; preco: number; qty: number }>>((acc, e) => {
                        const key = (e as any).id || e.nome;
                        if (!acc[key]) acc[key] = { nome: e.nome, preco: Number(e.preco) || 0, qty: 0 };
                        acc[key].qty += 1;
                        return acc;
                      }, {});
                      const items = Object.values(grouped);
                      return (
                        <div className="bg-urbana-black/30 p-3 rounded-lg border border-urbana-gold/20">
                          <p className="text-xs text-white/60 mb-2">Serviços Extras</p>
                          <div className="space-y-1">
                            {items.map((it, idx) => (
                              <div key={idx} className="flex justify-between text-sm text-white">
                                <span className="truncate mr-2">{it.nome}{it.qty > 1 ? ` x${it.qty}` : ''}</span>
                                <span className="text-urbana-gold shrink-0">R$ {(it.preco * it.qty).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <span className="text-urbana-gold font-semibold text-lg">
                        R$ {(
                          Number(agendamento.painel_servicos.preco || 0) +
                          (Array.isArray(agendamento.servicos_extras)
                            ? agendamento.servicos_extras.reduce((s, e: any) => s + (Number(e?.preco) || 0), 0)
                            : 0)
                        ).toFixed(2)}
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        {canEdit(agendamento) && (
                          <button
                            onClick={() => setEditing(agendamento)}
                            className="text-sm text-urbana-gold border border-urbana-gold/60 px-3 py-1.5 rounded-lg hover:bg-urbana-gold/10 transition font-medium inline-flex items-center gap-1.5"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Editar
                          </button>
                        )}
                        {agendamento.status === 'concluido' ? (
                          <span className="text-green-400 text-sm font-medium">
                            ✨ Atendimento finalizado!
                          </span>
                        ) : agendamento.status === 'confirmado' ? (
                          <button
                            onClick={() => handleConcluirAgendamento(agendamento.id)}
                            className="text-sm text-green-400 border border-green-400 px-3 py-1.5 rounded-lg hover:bg-green-400/10 transition font-medium"
                          >
                            Marcar como Concluído
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <EditAgendamentoDialog
        isOpen={!!editing}
        onClose={() => setEditing(null)}
        onSaved={fetchAgendamentos}
        agendamento={editing}
      />
    </ClientPageContainer>
  );
}
