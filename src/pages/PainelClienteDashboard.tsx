
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, CheckCircle, XCircle, Edit, Trash2, ArrowLeft, Plus, Scissors, Award, BarChart3 } from 'lucide-react';
import { usePainelClienteAuth } from '@/contexts/PainelClienteAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import EditAgendamentoModal from '@/components/painel-cliente/EditAgendamentoModal';
import { useToast } from '@/hooks/use-toast';

interface Agendamento {
  id: string;
  data: string;
  hora: string;
  status: string;
  painel_servicos: {
    nome: string;
    preco: number;
    duracao: number;
  };
  painel_barbeiros: {
    nome: string;
  };
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

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      agendado: { label: 'Agendado', color: 'bg-blue-900/70 text-blue-300 border-blue-700' },
      confirmado: { label: 'Confirmado', color: 'bg-green-900/70 text-green-300 border-green-700' },
      concluido: { label: 'Concluído', color: 'bg-purple-900/70 text-purple-300 border-purple-700' },
      cancelado: { label: 'Cancelado', color: 'bg-red-900/70 text-red-300 border-red-700' },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, color: 'bg-gray-900/70 text-gray-300 border-gray-700' };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border backdrop-blur-md ${config.color}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen w-screen bg-gray-950 overflow-x-hidden relative">
      {/* Container responsivo com padding adequado para mobile */}
      <div className="relative w-full px-4 py-6 sm:px-6 lg:px-12 lg:py-10 max-w-7xl mx-auto">
        <div className="w-full space-y-6 lg:space-y-8">

          {/* HEADER OTIMIZADO PARA MOBILE */}
          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <div className="flex items-center justify-between w-full">
              <Button
                onClick={() => navigate('/')}
                variant="outline"
                size="sm"
                className="border-gray-800 text-gray-300 bg-transparent hover:bg-gray-800/50 rounded-lg px-3 py-2 flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Voltar</span>
              </Button>

              <Button
                onClick={() => navigate('/painel-cliente/agendar')}
                className="bg-gradient-to-r from-cyan-600 to-purple-600 text-white font-medium px-4 py-2 rounded-lg shadow-xl flex items-center gap-2 hover:from-cyan-500 hover:to-purple-500"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm">Novo</span>
              </Button>
            </div>
          </div>

          {/* SAUDAÇÃO OTIMIZADA PARA MOBILE */}
          <div className="flex items-start gap-3 mb-6">
            <div className="p-2.5 bg-gray-900/70 rounded-xl border border-gray-800 shadow-lg flex-shrink-0">
              <Scissors className="h-5 w-5 text-cyan-400" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 leading-tight break-words">
                Olá, {cliente?.nome.split(' ')[0]}!
              </h1>
              <p className="text-gray-400 text-sm sm:text-base mt-1">
                Painel de agendamentos
              </p>
            </div>
          </div>

          {/* ESTATÍSTICAS OTIMIZADAS PARA MOBILE */}
          <div>
            <h2 className="text-lg font-semibold text-gray-300 mb-4 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-cyan-400" />
              <span>Estatísticas</span>
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { title: 'Total', value: agendamentos.length, icon: Calendar, color: 'from-blue-600 to-blue-800' },
                { title: 'Confirmados', value: agendamentos.filter(a => a.status === 'confirmado').length, icon: CheckCircle, color: 'from-green-600 to-green-800' },
                { title: 'Concluídos', value: agendamentos.filter(a => a.status === 'concluido').length, icon: Award, color: 'from-purple-600 to-purple-800' },
                { title: 'Cancelados', value: agendamentos.filter(a => a.status === 'cancelado').length, icon: XCircle, color: 'from-red-600 to-red-800' }
              ].map((stat, index) => (
                <Card key={index} className="border-0 bg-gradient-to-br from-gray-900/80 to-gray-950/80 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex flex-col items-center text-center space-y-2">
                      <div className={`p-2 rounded-lg bg-gradient-to-r ${stat.color} flex-shrink-0`}>
                        <stat.icon className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <div className="text-xl sm:text-2xl font-bold text-white">{stat.value}</div>
                        <p className="text-xs text-gray-400">{stat.title}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* AGENDAMENTOS RECENTES OTIMIZADOS PARA MOBILE */}
          <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
              <h2 className="text-lg font-semibold text-gray-300 flex items-center gap-2">
                <Clock className="h-4 w-4 text-cyan-400" />
                <span>Agendamentos Recentes</span>
              </h2>
              <Button
                variant="outline"
                onClick={() => navigate('/painel-cliente/agendamentos')}
                className="border-gray-800 text-gray-300 bg-transparent hover:bg-gray-800/50 rounded-lg px-4 py-2 text-sm w-full sm:w-auto"
              >
                Ver Todos
              </Button>
            </div>

            {/* CARDS DE AGENDAMENTO OTIMIZADOS PARA MOBILE */}
            <div className="space-y-4">
              {agendamentos.slice(0, 6).map((agendamento) => (
                <Card key={agendamento.id} className="border-0 bg-gradient-to-br from-gray-900/80 to-gray-950/80">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start gap-3">
                      <CardTitle className="text-white text-base sm:text-lg font-semibold leading-tight flex-1 min-w-0">
                        {agendamento.painel_servicos.nome}
                      </CardTitle>
                      <div className="flex-shrink-0">
                        {getStatusBadge(agendamento.status)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Grid de informações otimizado para mobile */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center text-gray-300">
                        <Calendar className="w-4 h-4 mr-2 text-cyan-400 flex-shrink-0" />
                        <span>{format(new Date(agendamento.data), 'dd/MM/yyyy', { locale: ptBR })}</span>
                      </div>
                      <div className="flex items-center text-gray-300">
                        <Clock className="w-4 h-4 mr-2 text-cyan-400 flex-shrink-0" />
                        <span>{agendamento.hora}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center text-gray-300 text-sm">
                      <Scissors className="w-4 h-4 mr-2 text-cyan-400 flex-shrink-0" />
                      <span className="truncate">{agendamento.painel_barbeiros.nome}</span>
                    </div>
                    
                    <div className="pt-3 border-t border-gray-800">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs text-gray-400">Valor</span>
                        <span className="text-sm font-semibold text-cyan-400">
                          R$ {agendamento.painel_servicos.preco.toFixed(2)}
                        </span>
                      </div>
                      
                      {/* Botões de ação otimizados para mobile */}
                      {agendamento.status !== 'concluido' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditAgendamento(agendamento)}
                            className="flex-1 text-xs border-gray-700 text-gray-300 bg-transparent hover:bg-gray-700/50 py-2"
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteAgendamento(agendamento)}
                            className="flex-1 text-xs border-gray-700 text-gray-300 bg-transparent hover:bg-gray-700/50 py-2"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Cancelar
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {agendamentos.length === 0 && !loading && (
              <div className="text-center py-8">
                <Scissors className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-sm">Nenhum agendamento encontrado</p>
                <Button 
                  onClick={() => navigate('/painel-cliente/agendar')}
                  className="mt-4 bg-gradient-to-r from-cyan-600 to-purple-600 text-white"
                >
                  Fazer primeiro agendamento
                </Button>
              </div>
            )}
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
