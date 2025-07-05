
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Scissors, Calendar, Clock, TrendingUp, Star, Users, Award } from 'lucide-react';
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
      agendado: { label: 'Agendado', variant: 'default' as const, color: 'bg-blue-500/20 text-blue-400' },
      confirmado: { label: 'Confirmado', variant: 'secondary' as const, color: 'bg-green-500/20 text-green-400' },
      concluido: { label: 'Concluído', variant: 'default' as const, color: 'bg-purple-500/20 text-purple-400' },
      cancelado: { label: 'Cancelado', variant: 'destructive' as const, color: 'bg-red-500/20 text-red-400' },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: 'default' as const, color: 'bg-gray-500/20 text-gray-400' };
    return <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>{config.label}</span>;
  };

  if (!cliente) {
    navigate('/painel-cliente/login');
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950 flex items-center justify-center">
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-cyan-600/5" />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent mb-4">
              Dashboard
            </h1>
            <p className="text-gray-400 text-lg sm:text-xl">Bem-vindo de volta, {cliente.nome?.split(' ')[0]}!</p>
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border border-slate-700/50 backdrop-blur-xl hover:border-slate-600/70 transition-all duration-300 shadow-xl hover:shadow-2xl cursor-pointer group"
                  onClick={() => navigate('/painel-cliente/agendar')}>
              <CardContent className="p-6 text-center">
                <div className="mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
                    <Plus className="h-6 w-6 text-white" />
                  </div>
                </div>
                <h3 className="text-white font-semibold mb-2 group-hover:text-green-300 transition-colors">Novo Agendamento</h3>
                <p className="text-gray-400 text-sm">Agende seu próximo corte</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border border-slate-700/50 backdrop-blur-xl hover:border-slate-600/70 transition-all duration-300 shadow-xl hover:shadow-2xl cursor-pointer group"
                  onClick={() => navigate('/painel-cliente/agendamentos')}>
              <CardContent className="p-6 text-center">
                <div className="mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                </div>
                <h3 className="text-white font-semibold mb-2 group-hover:text-purple-300 transition-colors">Meus Agendamentos</h3>
                <p className="text-gray-400 text-sm">Visualize seus horários</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border border-slate-700/50 backdrop-blur-xl hover:border-slate-600/70 transition-all duration-300 shadow-xl hover:shadow-2xl cursor-pointer group"
                  onClick={() => navigate('/painel-cliente/perfil')}>
              <CardContent className="p-6 text-center">
                <div className="mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                </div>
                <h3 className="text-white font-semibold mb-2 group-hover:text-orange-300 transition-colors">Meu Perfil</h3>
                <p className="text-gray-400 text-sm">Gerencie seus dados</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border border-slate-700/50 backdrop-blur-xl hover:border-slate-600/70 transition-all duration-300 shadow-xl hover:shadow-2xl">
              <CardContent className="p-6 text-center">
                <div className="mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-xl flex items-center justify-center mx-auto">
                    <Award className="h-6 w-6 text-white" />
                  </div>
                </div>
                <h3 className="text-white font-semibold mb-2">Pontos</h3>
                <p className="text-amber-400 text-lg font-bold">150 pts</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Appointments */}
          <motion.div variants={itemVariants}>
            <Card className="bg-slate-900/50 border border-slate-700/50 backdrop-blur-xl shadow-2xl">
              <CardHeader>
                <CardTitle className="text-xl lg:text-2xl text-white flex items-center gap-3">
                  <Clock className="h-6 w-6 text-blue-400" />
                  Agendamentos Recentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {agendamentos.length === 0 ? (
                  <div className="text-center py-8">
                    <Scissors className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">Nenhum agendamento encontrado</h3>
                    <p className="text-gray-400 mb-6">Você ainda não possui agendamentos. Que tal marcar um horário?</p>
                    <Button
                      onClick={() => navigate('/painel-cliente/agendar')}
                      className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold px-6 py-3 rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Fazer Primeiro Agendamento
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {agendamentos.slice(0, 3).map((agendamento, index) => (
                      <motion.div
                        key={agendamento.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-800/50 to-slate-700/30 rounded-xl border border-slate-600/30 hover:border-slate-500/50 transition-all duration-300"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                            <Scissors className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h4 className="text-white font-semibold">{agendamento.painel_servicos.nome}</h4>
                            <p className="text-gray-400 text-sm">
                              {format(new Date(agendamento.data), 'dd/MM/yyyy', { locale: ptBR })} às {agendamento.hora}
                            </p>
                            <p className="text-gray-400 text-sm">Com {agendamento.painel_barbeiros.nome}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          {getStatusBadge(agendamento.status)}
                          <p className="text-blue-400 font-bold text-lg mt-1">
                            R$ {agendamento.painel_servicos.preco.toFixed(2)}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                    <div className="text-center pt-4">
                      <Button
                        onClick={() => navigate('/painel-cliente/agendamentos')}
                        variant="outline"
                        className="border-slate-600 text-gray-300 hover:bg-slate-800/50 hover:text-white hover:border-slate-500 rounded-xl"
                      >
                        Ver Todos os Agendamentos
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Stats Cards */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <Card className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 border border-blue-700/50 backdrop-blur-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-300 text-sm font-medium">Total de Agendamentos</p>
                    <p className="text-2xl font-bold text-white">{agendamentos.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-900/30 to-green-800/20 border border-green-700/50 backdrop-blur-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-300 text-sm font-medium">Próximo Agendamento</p>
                    <p className="text-white text-sm">
                      {agendamentos.length > 0 ? format(new Date(agendamentos[0].data), 'dd/MM', { locale: ptBR }) : 'Nenhum'}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                    <Clock className="h-6 w-6 text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-900/30 to-purple-800/20 border border-purple-700/50 backdrop-blur-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-300 text-sm font-medium">Fidelidade</p>
                    <p className="text-2xl font-bold text-white">★★★★☆</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                    <Star className="h-6 w-6 text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
