
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Scissors, Calendar, Clock, CheckCircle, XCircle, Edit, Trash2, ArrowLeft } from 'lucide-react';
import { usePainelClienteAuth } from '@/contexts/PainelClienteAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import EditAgendamentoModal from '@/components/painel-cliente/EditAgendamentoModal';
import { useToast } from '@/hooks/use-toast';

export default function PainelClienteDashboard() {
  const navigate = useNavigate();
  const { cliente } = usePainelClienteAuth();
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedAgendamento, setSelectedAgendamento] = useState<Agendamento | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (cliente) {
      fetchAgendamentos();
    }
  }, [cliente]);

  const fetchAgendamentos = async () => {
    if (!cliente) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('painel_agendamentos')
        .select(`
          *,
          painel_barbeiros!inner(nome),
          painel_servicos!inner(nome, preco, duracao)
        `)
        .eq('cliente_id', cliente.id)
        .order('data', { ascending: false })
        .order('hora', { ascending: false });

      if (error) throw error;
      setAgendamentos(data || []);
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os agendamentos.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditAgendamento = (agendamento: Agendamento) => {
    setSelectedAgendamento(agendamento);
    setEditModalOpen(true);
  };

  const handleDeleteAgendamento = async (agendamento: Agendamento) => {
    if (agendamento.status === 'concluido') {
      toast({
        variant: "destructive",
        title: "Não é possível cancelar",
        description: "Agendamentos concluídos não podem ser cancelados.",
      });
      return;
    }

    if (window.confirm('Tem certeza que deseja cancelar este agendamento?')) {
      try {
        const { error } = await supabase
          .from('painel_agendamentos')
          .update({ status: 'cancelado' })
          .eq('id', agendamento.id);

        if (error) throw error;

        toast({
          title: "Agendamento cancelado!",
          description: "Seu agendamento foi cancelado com sucesso.",
        });

        fetchAgendamentos();
      } catch (error) {
        console.error('Erro ao cancelar agendamento:', error);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível cancelar o agendamento.",
        });
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      agendado: { label: 'Agendado', color: 'bg-blue-900 text-blue-300 border-blue-800' },
      confirmado: { label: 'Confirmado', color: 'bg-green-900 text-green-300 border-green-800' },
      concluido: { label: 'Concluído', color: 'bg-purple-900 text-purple-300 border-purple-800' },
      cancelado: { label: 'Cancelado', color: 'bg-red-900 text-red-300 border-red-800' },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, color: 'bg-gray-900 text-gray-300 border-gray-800' };
    return (
      <span className={`px-3 py-1.5 rounded-full text-xs font-medium border ${config.color}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen w-screen bg-gray-950 overflow-x-hidden">
      <div className="relative w-full px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full space-y-8"
        >
          {/* Header */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              size="sm"
              className="border-gray-800 text-gray-400 hover:bg-gray-900 hover:text-gray-200 hover:border-gray-700 rounded-lg px-4 py-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            
            <div className="flex-1">
              <div className="inline-flex items-center gap-3 mb-4">
                <div className="p-3 bg-gray-800 rounded-full border border-gray-700">
                  <Scissors className="h-6 w-6 text-amber-500" />
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
                    Olá, {cliente?.nome.split(' ')[0]}!
                  </h1>
                  <p className="text-gray-400 text-lg mt-2">Bem-vindo ao seu painel</p>
                </div>
              </div>
              
              <div className="mt-6">
                <Button 
                  onClick={() => navigate('/painel-cliente/agendar')}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-8 py-4 rounded-lg"
                  size="lg"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Novo Agendamento
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Cards - Simplificado */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: 'Total', value: agendamentos.length, icon: Calendar, color: 'bg-blue-900' },
              { title: 'Confirmados', value: agendamentos.filter(a => a.status === 'confirmado').length, icon: CheckCircle, color: 'bg-green-900' },
              { title: 'Concluídos', value: agendamentos.filter(a => a.status === 'concluido').length, icon: CheckCircle, color: 'bg-purple-900' },
              { title: 'Cancelados', value: agendamentos.filter(a => a.status === 'cancelado').length, icon: XCircle, color: 'bg-red-900' }
            ].map((stat, index) => (
              <Card key={index} className={`border-0 ${stat.color} border border-gray-800`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <stat.icon className="h-5 w-5 text-gray-300" />
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">{stat.value}</div>
                      <p className="text-xs text-gray-300">{stat.title}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Agendamentos Recentes */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-500" />
                Agendamentos Recentes
              </h2>
              <Button
                variant="outline"
                onClick={() => navigate('/painel-cliente/agendamentos')}
                className="border-gray-800 text-gray-400 hover:bg-gray-900 hover:text-gray-200"
              >
                Ver Todos
              </Button>
            </div>
            
            {agendamentos.length === 0 ? (
              <Card className="border-0 bg-gray-900 border border-gray-800">
                <CardContent className="p-8 text-center">
                  <Calendar className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Nenhum agendamento
                  </h3>
                  <Button 
                    onClick={() => navigate('/painel-cliente/agendar')}
                    className="bg-amber-600 hover:bg-amber-700 text-white mt-4"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agendar Serviço
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {agendamentos.slice(0, 6).map((agendamento) => (
                  <Card key={agendamento.id} className="border-0 bg-gray-900 border border-gray-800">
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
                          <Calendar className="w-4 h-4 mr-2 text-amber-500" />
                          {format(new Date(agendamento.data), 'dd/MM', { locale: ptBR })}
                        </div>
                        <div className="flex items-center text-gray-300 text-sm">
                          <Clock className="w-4 h-4 mr-2 text-amber-500" />
                          {agendamento.hora}
                        </div>
                      </div>
                      <div className="flex items-center text-gray-300 text-sm">
                        <Scissors className="w-4 h-4 mr-2 text-amber-500" />
                        {agendamento.painel_barbeiros.nome}
                      </div>
                      
                      <div className="pt-2 border-t border-gray-800">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-400">Valor</span>
                          <span className="text-sm font-semibold text-amber-500">
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
                            className="flex-1 text-xs border-gray-800 text-gray-300 hover:bg-gray-800"
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteAgendamento(agendamento)}
                            className="flex-1 text-xs border-gray-800 text-gray-300 hover:bg-gray-800"
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
        </motion.div>
      </div>
    </div>
  );
}

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
