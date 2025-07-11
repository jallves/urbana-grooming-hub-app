// Arquivo refatorado com botões sem efeito branco
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Calendar, Clock, User, Scissors, Plus, Edit, Trash2 } from 'lucide-react';
import { usePainelClienteAuth } from '@/contexts/PainelClienteAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import EditAgendamentoModal from '@/components/painel-cliente/EditAgendamentoModal';
import { useToast } from '@/hooks/use-toast';

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
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedAgendamento, setSelectedAgendamento] = useState<Agendamento | null>(null);
  const { toast } = useToast();

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
          () => fetchAgendamentos()
        )
        .subscribe();
      return () => { supabase.removeChannel(channel); };
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
      agendado: { label: 'Agendado', color: 'bg-blue-900 text-blue-400 border-blue-600' },
      confirmado: { label: 'Confirmado', color: 'bg-green-900 text-green-400 border-green-600' },
      concluido: { label: 'Concluído', color: 'bg-purple-900 text-purple-400 border-purple-600' },
      cancelado: { label: 'Cancelado', color: 'bg-red-900 text-red-400 border-red-600' },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, color: 'bg-gray-900 text-gray-400 border-gray-600' };
    return <span className={`px-3 py-1.5 rounded-full text-xs font-medium border ${config.color}`}>{config.label}</span>;
  };

  const handleEditAgendamento = (agendamento: Agendamento) => {
    if (!['agendado', 'confirmado'].includes(agendamento.status)) {
      toast({ variant: "destructive", title: "Não é possível editar", description: "Apenas agendamentos com status 'Agendado' ou 'Confirmado' podem ser editados." });
      return;
    }
    setSelectedAgendamento(agendamento);
    setEditModalOpen(true);
  };

  const handleDeleteAgendamento = async (agendamento: Agendamento) => {
    if (!['agendado', 'confirmado'].includes(agendamento.status)) {
      toast({ variant: "destructive", title: "Não é possível cancelar", description: "Apenas agendamentos com status 'Agendado' ou 'Confirmado' podem ser cancelados." });
      return;
    }
    if (!confirm('Tem certeza que deseja cancelar este agendamento?')) return;

    try {
      const { error } = await supabase
        .from('painel_agendamentos')
        .update({ status: 'cancelado' })
        .eq('id', agendamento.id)
        .eq('cliente_id', cliente?.id);

      if (error) throw error;

      toast({ title: "Agendamento cancelado!", description: "Seu agendamento foi cancelado com sucesso." });
      fetchAgendamentos();
    } catch (error) {
      console.error('Erro ao cancelar agendamento:', error);
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível cancelar o agendamento." });
    }
  };

  const agendamentosFiltrados = filtroStatus === 'todos' ? agendamentos : agendamentos.filter(a => a.status === filtroStatus);
  if (!cliente) { navigate('/painel-cliente/login'); return null; }

  return (
    <div className="w-full h-full bg-transparent px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-purple-400">Meus Agendamentos</h1>
        <Button
          onClick={() => navigate('/painel-cliente/agendar')}
          className="bg-purple-700 hover:bg-purple-800 text-white px-5 py-2 rounded-xl shadow-md hover:shadow-lg transition"
        >
          <Plus className="w-4 h-4 mr-2" /> Novo Agendamento
        </Button>
      </div>

      <div className="flex gap-3 mb-4 overflow-x-auto">
        {[ 'todos', 'agendado', 'confirmado', 'concluido', 'cancelado' ].map((key) => (
          <Button
            key={key}
            onClick={() => setFiltroStatus(key)}
            variant="outline"
            className={`rounded-lg px-4 py-2 text-sm ${
              filtroStatus === key 
                ? 'bg-purple-700 text-white border-purple-800' 
                : 'border-slate-600 text-gray-300 hover:bg-slate-900 hover:text-white hover:border-slate-500'
            }`}
          >
            {key.charAt(0).toUpperCase() + key.slice(1)}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agendamentosFiltrados.map((agendamento) => (
            <Card key={agendamento.id} className="bg-slate-900 border border-slate-700 hover:border-slate-600 transition">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-white truncate">{agendamento.painel_servicos.nome}</CardTitle>
                  {getStatusBadge(agendamento.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-gray-300 flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-purple-400" />
                  {format(new Date(agendamento.data), 'dd/MM/yyyy')}
                </div>
                <div className="text-gray-300 flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-purple-400" />
                  {agendamento.hora}
                </div>
                <div className="text-gray-300 flex items-center">
                  <User className="w-4 h-4 mr-2 text-purple-400" />
                  {agendamento.painel_barbeiros.nome}
                </div>
                <div className="flex justify-between items-center border-t border-slate-700 pt-3">
                  <span className="text-purple-400 font-bold">R$ {agendamento.painel_servicos.preco.toFixed(2)}</span>
                  <span className="text-gray-400 text-sm">{agendamento.painel_servicos.duracao} min</span>
                </div>

                {['agendado', 'confirmado'].includes(agendamento.status) && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditAgendamento(agendamento)}
                      className="flex-1 text-xs border-blue-500 text-blue-400 hover:bg-blue-900 hover:border-blue-600"
                    >
                      <Edit className="w-3 h-3 mr-1" /> Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteAgendamento(agendamento)}
                      className="flex-1 text-xs border-red-500 text-red-400 hover:bg-red-900 hover:border-red-600"
                    >
                      <Trash2 className="w-3 h-3 mr-1" /> Cancelar
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <EditAgendamentoModal
        isOpen={editModalOpen}
        onClose={() => { setEditModalOpen(false); setSelectedAgendamento(null); }}
        agendamento={selectedAgendamento}
        onUpdate={fetchAgendamentos}
      />
    </div>
  );
}
