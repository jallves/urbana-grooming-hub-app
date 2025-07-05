import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Scissors, Calendar, Clock, TrendingUp, Star, Users, Award, BarChart3, Timer, CheckCircle, XCircle, Edit, Trash2 } from 'lucide-react';
import { usePainelClienteAuth } from '@/contexts/PainelClienteAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
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
          () => {
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
      agendado: { label: 'Agendado', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
      confirmado: { label: 'Confirmado', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
      concluido: { label: 'Concluído', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
      cancelado: { label: 'Cancelado', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' };
    return (
      <span className={`px-3 py-1.5 rounded-full text-xs font-medium border ${config.color} backdrop-blur-sm`}>
        {config.label}
      </span>
    );
  };

  const handleEditAgendamento = (agendamento: Agendamento) => {
    // Só permite editar agendamentos com status 'agendado' ou 'confirmado'
    if (!['agendado', 'confirmado'].includes(agendamento.status)) {
      toast({
        variant: "destructive",
        title: "Não é possível editar",
        description: "Apenas agendamentos com status 'Agendado' ou 'Confirmado' podem ser editados.",
      });
      return;
    }
    
    setSelectedAgendamento(agendamento);
    setEditModalOpen(true);
  };

  const handleDeleteAgendamento = async (agendamento: Agendamento) => {
    // Só permite excluir agendamentos com status 'agendado' ou 'confirmado'
    if (!['agendado', 'confirmado'].includes(agendamento.status)) {
      toast({
        variant: "destructive",
        title: "Não é possível cancelar",
        description: "Apenas agendamentos com status 'Agendado' ou 'Confirmado' podem ser cancelados.",
      });
      return;
    }

    if (!confirm('Tem certeza que deseja cancelar este agendamento?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('painel_agendamentos')
        .update({ status: 'cancelado' })
        .eq('id', agendamento.id)
        .eq('cliente_id', cliente?.id);

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
  };

  // Calculate stats
  const totalAgendamentos = agendamentos.length;
  const agendamentosConfirmados = agendamentos.filter(a => a.status === 'confirmado').length;
  const agendamentosConcluidos = agendamentos.filter(a => a.status === 'concluido').length;
  const agendamentosCancelados = agendamentos.filter(a => a.status === 'cancelado').length;

  if (!cliente) {
    navigate('/painel-cliente/login');
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen w-screen bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  const statsCards = [
    {
      title: 'Total de Agendamentos',
      value: totalAgendamentos,
      icon: Calendar,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-500/10'
    },
    {
      title: 'Confirmados',
      value: agendamentosConfirmados,
      icon: CheckCircle,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-500/10'
    },
    {
      title: 'Concluídos',
      value: agendamentosConcluidos,
      icon: Award,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-500/10'
    },
    {
      title: 'Cancelados',
      value: agendamentosCancelados,
      icon: XCircle,
      color: 'from-red-500 to-orange-500',
      bgColor: 'bg-red-500/10'
    }
  ];

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950 overflow-x-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-cyan-600/5 pointer-events-none" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      
      <div className="relative w-full px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full space-y-8"
        >
          {/* Welcome Header */}
          <motion.div variants={itemVariants} className="text-center lg:text-left">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full blur-md opacity-75" />
                <div className="relative p-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full">
                  <Scissors className="h-6 w-6 text-black" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-white via-gray-200 to-gray-300 bg-clip-text text-transparent">
                  Olá, {cliente.nome.split(' ')[0]}!
                </h1>
                <p className="text-gray-400 text-lg mt-2">Bem-vindo de volta ao seu painel pessoal</p>
              </div>
            </div>
            
            <motion.div
              variants={itemVariants}
              className="mt-6"
            >
              <Button 
                onClick={() => navigate('/painel-cliente/agendar')}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-semibold px-8 py-4 rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                size="lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                Novo Agendamento
              </Button>
            </motion.div>
          </motion.div>

          {/* Stats Cards */}
          <motion.div variants={itemVariants}>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <BarChart3 className="h-6 w-6 text-amber-500" />
              Suas Estatísticas
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {statsCards.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={stat.title}
                    variants={itemVariants}
                    whileHover={{ scale: 1.05, y: -5 }}
                    className="group"
                  >
                    <Card className={`border-0 ${stat.bgColor} backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-white/10`}>
                      <CardContent className="p-4 lg:p-6">
                        <div className="flex items-center justify-between mb-3">
                          <div className={`p-2 lg:p-3 rounded-xl bg-gradient-to-r ${stat.color} shadow-lg`}>
                            <Icon className="h-4 w-4 lg:h-5 lg:w-5 text-white" />
                          </div>
                          <div className="text-right">
                            <div className="text-2xl lg:text-3xl font-bold text-white">
                              {stat.value}
                            </div>
                          </div>
                        </div>
                        <p className="text-xs lg:text-sm text-gray-300 font-medium">{stat.title}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Recent Appointments */}
          <motion.div variants={itemVariants}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <Timer className="h-6 w-6 text-amber-500" />
                Agendamentos Recentes
              </h2>
              <Button
                variant="outline"
                onClick={() => navigate('/painel-cliente/agendamentos')}
                className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10 hover:border-amber-500 rounded-xl"
              >
                Ver Todos
              </Button>
            </div>
            
            {agendamentos.length === 0 ? (
              <Card className="border-0 bg-gray-900/50 backdrop-blur-xl border border-gray-700/50">
                <CardContent className="p-8 text-center">
                  <Calendar className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Nenhum agendamento ainda
                  </h3>
                  <p className="text-gray-400 mb-6">
                    Comece agendando seu primeiro serviço conosco!
                  </p>
                  <Button 
                    onClick={() => navigate('/painel-cliente/agendar')}
                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-semibold rounded-xl"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agendar Agora
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
                {agendamentos.slice(0, 6).map((agendamento, index) => (
                  <motion.div
                    key={agendamento.id}
                    variants={itemVariants}
                    whileHover={{ scale: 1.02, y: -5 }}
                    className="group"
                  >
                    <Card className="border-0 bg-gray-900/50 backdrop-blur-xl border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300 shadow-xl hover:shadow-2xl">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-white text-lg font-semibold truncate pr-2 flex-1">
                            {agendamento.painel_servicos.nome}
                          </CardTitle>
                          {getStatusBadge(agendamento.status)}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex items-center text-gray-300 text-sm">
                            <Calendar className="w-4 h-4 mr-2 text-amber-500 flex-shrink-0" />
                            <span className="truncate">
                              {format(new Date(agendamento.data), 'dd/MM', { locale: ptBR })}
                            </span>
                          </div>
                          <div className="flex items-center text-gray-300 text-sm">
                            <Clock className="w-4 h-4 mr-2 text-amber-500 flex-shrink-0" />
                            <span>{agendamento.hora}</span>
                          </div>
                        </div>
                        <div className="flex items-center text-gray-300 text-sm">
                          <Scissors className="w-4 h-4 mr-2 text-amber-500 flex-shrink-0" />
                          <span className="truncate">{agendamento.painel_barbeiros.nome}</span>
                        </div>
                        
                        <div className="pt-2 border-t border-gray-700/50">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-gray-400">Valor</span>
                            <span className="text-sm font-semibold text-amber-400">
                              R$ {agendamento.painel_servicos.preco.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        {['agendado', 'confirmado'].includes(agendamento.status) && (
                          <div className="flex gap-2 pt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditAgendamento(agendamento)}
                              className="flex-1 text-xs border-blue-500/50 text-blue-400 hover:bg-blue-500/10 hover:border-blue-500"
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              Editar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteAgendamento(agendamento)}
                              className="flex-1 text-xs border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-500"
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Cancelar
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Edit Modal */}
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
