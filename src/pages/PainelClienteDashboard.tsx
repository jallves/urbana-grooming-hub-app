
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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950 relative">
      {/* Background Effects - Same as homepage */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-cyan-600/5" />
      
      <div className="relative z-10 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6 lg:space-y-8"
        >
          {/* Welcome Header */}
          <motion.div variants={itemVariants} className="text-center lg:text-left">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent mb-2">
              Bem-vindo de volta!
            </h1>
            <p className="text-gray-400 text-lg">Gerencie seus agendamentos de forma inteligente</p>
          </motion.div>

          {/* Quick Action Button */}
          <motion.div variants={itemVariants} className="flex justify-center lg:justify-start">
            <Button
              onClick={() => navigate('/painel-cliente/agendar')}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-semibold px-8 py-4 rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
            >
              <Plus className="h-5 w-5 mr-2" />
              Novo Agendamento
            </Button>
          </motion.div>

          {/* Stats Cards */}
          <motion.div 
            variants={itemVariants}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6"
          >
            <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border border-blue-700/50 backdrop-blur-xl">
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-400 text-sm font-medium">Próximos</p>
                    <p className="text-2xl lg:text-3xl font-bold text-white">
                      {agendamentos.filter(a => a.status === 'agendado' || a.status === 'confirmado').length}
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-900/50 to-green-800/30 border border-green-700/50 backdrop-blur-xl">
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-400 text-sm font-medium">Concluídos</p>
                    <p className="text-2xl lg:text-3xl font-bold text-white">
                      {agendamentos.filter(a => a.status === 'concluido').length}
                    </p>
                  </div>
                  <Star className="h-8 w-8 text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 border border-purple-700/50 backdrop-blur-xl">
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-400 text-sm font-medium">Este Mês</p>
                    <p className="text-2xl lg:text-3xl font-bold text-white">
                      {agendamentos.filter(a => new Date(a.data).getMonth() === new Date().getMonth()).length}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-900/50 to-orange-800/30 border border-orange-700/50 backdrop-blur-xl">
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-400 text-sm font-medium">Fidelidade</p>
                    <p className="text-2xl lg:text-3xl font-bold text-white">Premium</p>
                  </div>
                  <Award className="h-8 w-8 text-orange-400" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Appointments */}
          <motion.div variants={itemVariants}>
            <Card className="bg-slate-900/50 border border-slate-700/50 backdrop-blur-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl lg:text-2xl text-white flex items-center gap-3">
                  <Scissors className="h-6 w-6 text-amber-500" />
                  Agendamentos Recentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {agendamentos.length === 0 ? (
                  <div className="text-center py-12">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="mb-6"
                    >
                      <Scissors className="h-16 w-16 mx-auto text-gray-500" />
                    </motion.div>
                    <h3 className="text-xl font-semibold text-gray-300 mb-3">Nenhum agendamento encontrado</h3>
                    <p className="text-gray-400 mb-6">Você ainda não possui agendamentos.</p>
                    <Button
                      onClick={() => navigate('/painel-cliente/agendar')}
                      className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-semibold px-6 py-3 rounded-xl"
                    >
                      Fazer Primeiro Agendamento
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {agendamentos.slice(0, 5).map((agendamento, index) => (
                      <motion.div
                        key={agendamento.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                        className="flex items-center justify-between p-4 lg:p-5 bg-gradient-to-r from-slate-800/50 to-slate-700/30 rounded-xl border border-slate-600/30 backdrop-blur-sm hover:border-slate-500/50 transition-all duration-300"
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="p-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl shadow-lg">
                            <Scissors className="h-5 w-5 text-black" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-white font-semibold text-base lg:text-lg truncate">
                              {agendamento.painel_servicos.nome}
                            </h4>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-sm text-gray-400 mt-1">
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                <span className="truncate">{agendamento.painel_barbeiros.nome}</span>
                              </div>
                              <span className="hidden sm:inline">•</span>
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>{format(new Date(agendamento.data), 'dd/MM', { locale: ptBR })} às {agendamento.hora}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-3 flex-shrink-0">
                          {getStatusBadge(agendamento.status)}
                          <span className="text-amber-400 font-bold text-sm lg:text-base">
                            R$ {agendamento.painel_servicos.preco.toFixed(2)}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                    
                    {agendamentos.length > 5 && (
                      <div className="text-center pt-4">
                        <Button
                          variant="outline"
                          onClick={() => navigate('/painel-cliente/agendamentos')}
                          className="border-slate-600 text-gray-300 hover:bg-slate-800/50 hover:text-white hover:border-slate-500 rounded-xl px-6 py-3"
                        >
                          Ver Todos os Agendamentos
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
