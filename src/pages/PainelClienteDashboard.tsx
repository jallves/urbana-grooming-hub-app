import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, CheckCircle, XCircle, Edit, Trash2, ArrowLeft, Plus, Scissors, Award, BarChart3 } from 'lucide-react';
import { usePainelClienteAuth } from '@/contexts/PainelClienteAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import EditAgendamentoModal from '@/components/painel-cliente/EditAgendamentoModal';
import { useToast } from '@/hooks/use-toast';

interface PainelServico {
  nome: string;
  preco: number;
  duracao: number;
}

interface PainelBarbeiro {
  nome: string;
}

interface Agendamento {
  id: string;
  data: string;
  hora: string;
  status: string;
  observacoes?: string;
  painel_servicos: PainelServico;
  painel_barbeiros: PainelBarbeiro;
}

export default function PainelClienteDashboard() {
  const navigate = useNavigate();
  const { cliente } = usePainelClienteAuth();
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedAgendamento, setSelectedAgendamento] = useState<Agendamento | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchAgendamentos();
  }, []);

  async function fetchAgendamentos() {
    setLoading(true);
    const { data, error } = await supabase
      .from('painel_agendamentos')
      .select(`id, data, hora, status, painel_servicos ( nome, preco, duracao ), painel_barbeiros ( nome )`)
      .eq('cliente_id', cliente?.id)
      .order('data', { ascending: false });

    if (error) {
      console.error('Error fetching agendamentos:', error);
      toast({ title: 'Erro ao carregar agendamentos', description: error.message });
    } else {
      setAgendamentos(data || []);
    }
    setLoading(false);
  }

  function handleEditAgendamento(agendamento: Agendamento) {
    setSelectedAgendamento(agendamento);
    setEditModalOpen(true);
  }

  async function handleDeleteAgendamento(agendamento: Agendamento) {
    const confirm = window.confirm("Deseja cancelar este agendamento?");
    if (!confirm) return;

    const { error } = await supabase
      .from('painel_agendamentos')
      .update({ status: 'cancelado' })
      .eq('id', agendamento.id);

    if (error) {
      toast({ title: 'Erro ao cancelar agendamento', description: error.message });
    } else {
      toast({ title: 'Agendamento cancelado com sucesso' });
      fetchAgendamentos();
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      agendado: { label: 'Agendado', color: 'bg-blue-900/50 text-blue-400 border-blue-800' },
      confirmado: { label: 'Confirmado', color: 'bg-green-900/50 text-green-400 border-green-800' },
      concluido: { label: 'Concluído', color: 'bg-purple-900/50 text-purple-400 border-purple-800' },
      cancelado: { label: 'Cancelado', color: 'bg-red-900/50 text-red-400 border-red-800' },
    };
    const config = statusConfig[status] || { label: status, color: 'bg-gray-900/50 text-gray-400 border-gray-800' };
    return (
      <span className={`px-3 py-1.5 rounded-full text-xs font-medium border backdrop-blur-md ${config.color}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen w-screen bg-gray-950 overflow-x-hidden relative">
      <div className="relative w-full px-4 py-6 sm:px-6 lg:px-8 lg:py-8 max-w-7xl mx-auto">
        <div className="w-full space-y-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              size="sm"
              className="border-gray-800 text-gray-300 rounded-lg px-4 py-2 backdrop-blur-md flex items-center gap-2 hover:bg-transparent hover:text-gray-300"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Voltar</span>
            </Button>

            <div className="flex-1">
              <div className="inline-flex items-center gap-4 mb-6">
                <div className="p-3 bg-gray-900 rounded-xl border border-gray-800 shadow-lg">
                  <Scissors className="h-6 w-6 text-cyan-400" />
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                    Olá, {cliente?.nome.split(' ')[0]}!
                  </h1>
                  <p className="text-gray-400 text-lg mt-2">Painel de agendamentos</p>
                </div>
              </div>
              <Button
                onClick={() => navigate('/painel-cliente/agendar')}
                className="relative overflow-hidden bg-gradient-to-r from-cyan-600 to-purple-600 text-white font-medium px-8 py-4 rounded-lg shadow-xl"
                size="lg"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  <span>Novo Agendamento</span>
                </span>
              </Button>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-300 mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-cyan-400" />
              <span>Estatísticas</span>
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { title: 'Total', value: agendamentos.length, icon: Calendar, color: 'from-blue-600 to-blue-800' },
                { title: 'Confirmados', value: agendamentos.filter(a => a.status === 'confirmado').length, icon: CheckCircle, color: 'from-green-600 to-green-800' },
                { title: 'Concluídos', value: agendamentos.filter(a => a.status === 'concluido').length, icon: Award, color: 'from-purple-600 to-purple-800' },
                { title: 'Cancelados', value: agendamentos.filter(a => a.status === 'cancelado').length, icon: XCircle, color: 'from-red-600 to-red-800' }
              ].map((stat, index) => (
                <Card key={index} className="border-0 bg-gradient-to-br from-gray-900 to-gray-950 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className={`p-2 rounded-lg bg-gradient-to-r ${stat.color}`}>
                        <stat.icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-white">{stat.value}</div>
                        <p className="text-xs text-gray-400">{stat.title}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-300 flex items-center gap-2">
                <Clock className="h-5 w-5 text-cyan-400" />
                <span>Agendamentos Recentes</span>
              </h2>
              <Button
                variant="outline"
                onClick={() => navigate('/painel-cliente/agendamentos')}
                className="border-gray-800 text-gray-300 rounded-lg backdrop-blur-md hover:bg-transparent hover:text-gray-300"
              >
                Ver Todos
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {agendamentos.slice(0, 6).map((agendamento) => (
                <Card key={agendamento.id} className="border-0 bg-gradient-to-br from-gray-900 to-gray-950">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-white text-lg font-semibold">
                        {agendamento.painel_servicos.nome}
                      </CardTitle>
                      {getStatusBadge(agendamento.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center text-gray-300 text-sm">
                        <Calendar className="w-4 h-4 mr-2 text-cyan-400" />
                        {format(new Date(agendamento.data), 'dd/MM', { locale: ptBR })}
                      </div>
                      <div className="flex items-center text-gray-300 text-sm">
                        <Clock className="w-4 h-4 mr-2 text-cyan-400" />
                        {agendamento.hora}
                      </div>
                    </div>
                    <div className="flex items-center text-gray-300 text-sm">
                      <Scissors className="w-4 h-4 mr-2 text-cyan-400" />
                      {agendamento.painel_barbeiros.nome}
                    </div>
                    <div className="pt-2 border-t border-gray-800">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-400">Valor</span>
                        <span className="text-sm font-semibold text-cyan-400">
                          R$ {agendamento.painel_servicos.preco.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    {agendamento.status !== 'concluido' && (
                      <div className="flex gap-2 pt-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditAgendamento(agendamento)}
                          className="flex-1 text-xs border-gray-800 text-gray-300 backdrop-blur-sm hover:bg-transparent hover:text-gray-300"
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteAgendamento(agendamento)}
                          className="flex-1 text-xs border-gray-800 text-gray-300 backdrop-blur-sm hover:bg-transparent hover:text-gray-300"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Cancelar
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <EditAgendamentoModal
            isOpen={editModalOpen}
            onClose={() => {
              setEditModalOpen(false);
              setSelectedAgendamento(null);
            }}
            agendamento={selectedAgendamento}
            onUpdate={fetchAgendamentos}
          />
        </div>
      </div>
    </div>
  );
}
