
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Calendar, Clock, User, Scissors, Plus, Filter, Search } from 'lucide-react';
import { usePainelClienteAuth } from '@/contexts/PainelClienteAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
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

export default function PainelClienteMeusAgendamentos() {
  const navigate = useNavigate();
  const { cliente } = usePainelClienteAuth();
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('todos');

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
      agendado: { label: 'Agendado', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
      confirmado: { label: 'Confirmado', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
      concluido: { label: 'Concluído', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
      cancelado: { label: 'Cancelado', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' };
    return <span className={`px-3 py-1.5 rounded-full text-xs font-medium border ${config.color} backdrop-blur-sm`}>{config.label}</span>;
  };

  const agendamentosFiltrados = filtroStatus === 'todos' 
    ? agendamentos 
    : agendamentos.filter(a => a.status === filtroStatus);

  if (!cliente) {
    navigate('/painel-cliente/login');
    return null;
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
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 via-pink-600/5 to-purple-600/5" />
      
      <div className="relative z-10 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto min-h-screen">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Button
              onClick={() => navigate('/painel-cliente/dashboard')}
              variant="outline"
              size="sm"
              className="border-slate-600 text-gray-300 hover:bg-slate-800/50 hover:text-white hover:border-slate-500 rounded-xl px-4 py-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                Meus Agendamentos
              </h1>
              <p className="text-gray-400 text-base sm:text-lg mt-2">Acompanhe todos os seus agendamentos</p>
            </div>
            <Button
              onClick={() => navigate('/painel-cliente/agendar')}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-6 py-3 rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Agendamento
            </Button>
          </motion.div>

          {/* Filters */}
          <motion.div variants={itemVariants} className="overflow-x-auto">
            <div className="flex gap-3 pb-2">
              {[
                { key: 'todos', label: 'Todos', color: 'from-gray-500 to-gray-600' },
                { key: 'agendado', label: 'Agendados', color: 'from-blue-500 to-blue-600' },
                { key: 'confirmado', label: 'Confirmados', color: 'from-green-500 to-green-600' },
                { key: 'concluido', label: 'Concluídos', color: 'from-purple-500 to-purple-600' },
                { key: 'cancelado', label: 'Cancelados', color: 'from-red-500 to-red-600' }
              ].map((filtro) => (
                <Button
                  key={filtro.key}
                  onClick={() => setFiltroStatus(filtro.key)}
                  variant={filtroStatus === filtro.key ? "default" : "outline"}
                  size="sm"
                  className={`flex-shrink-0 rounded-xl px-4 py-2 transition-all duration-300 ${
                    filtroStatus === filtro.key 
                      ? `bg-gradient-to-r ${filtro.color} text-white shadow-lg` 
                      : 'border-slate-600 text-gray-300 hover:bg-slate-800/50 hover:text-white hover:border-slate-500'
                  }`}
                >
                  {filtro.label}
                </Button>
              ))}
            </div>
          </motion.div>

          {/* Content */}
          <motion.div variants={itemVariants} className="pb-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full"
                />
              </div>
            ) : agendamentosFiltrados.length === 0 ? (
              <Card className="bg-slate-900/50 border border-slate-700/50 backdrop-blur-xl">
                <CardContent className="p-8 sm:p-12 text-center">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="mb-6"
                  >
                    <Scissors className="h-16 sm:h-20 w-16 sm:w-20 text-gray-500 mx-auto" />
                  </motion.div>
                  <h3 className="text-xl sm:text-2xl font-semibold text-white mb-4">
                    {filtroStatus === 'todos' ? 'Nenhum agendamento encontrado' : `Nenhum agendamento ${filtroStatus}`}
                  </h3>
                  <p className="text-gray-400 mb-8 text-base sm:text-lg">
                    {filtroStatus === 'todos' 
                      ? 'Você ainda não possui agendamentos. Que tal marcar um horário?' 
                      : `Você não possui agendamentos com status "${filtroStatus}".`
                    }
                  </p>
                  <Button
                    onClick={() => navigate('/painel-cliente/agendar')}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-8 py-4 rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    {filtroStatus === 'todos' ? 'Fazer Primeiro Agendamento' : 'Novo Agendamento'}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                <AnimatePresence>
                  {agendamentosFiltrados.map((agendamento, index) => (
                    <motion.div
                      key={agendamento.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      whileHover={{ scale: 1.02, y: -5 }}
                      className="group"
                    >
                      <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border border-slate-700/50 backdrop-blur-xl hover:border-slate-600/70 transition-all duration-300 shadow-xl hover:shadow-2xl">
                        <CardHeader className="pb-4">
                          <div className="flex justify-between items-start gap-3">
                            <CardTitle className="text-white text-lg font-semibold group-hover:text-purple-300 transition-colors">
                              {agendamento.painel_servicos.nome}
                            </CardTitle>
                            {getStatusBadge(agendamento.status)}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-3">
                            <div className="flex items-center text-gray-300 group-hover:text-white transition-colors">
                              <Calendar className="h-4 w-4 mr-3 text-purple-400 flex-shrink-0" />
                              <span className="text-sm font-medium">
                                {format(new Date(agendamento.data), 'EEEE, dd \'de\' MMMM', { locale: ptBR })}
                              </span>
                            </div>
                            <div className="flex items-center text-gray-300 group-hover:text-white transition-colors">
                              <Clock className="h-4 w-4 mr-3 text-purple-400 flex-shrink-0" />
                              <span className="text-sm font-medium">{agendamento.hora}</span>
                            </div>
                            <div className="flex items-center text-gray-300 group-hover:text-white transition-colors">
                              <User className="h-4 w-4 mr-3 text-purple-400 flex-shrink-0" />
                              <span className="text-sm font-medium">{agendamento.painel_barbeiros.nome}</span>
                            </div>
                          </div>
                          
                          <div className="pt-4 border-t border-slate-700/50">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-gray-400 text-sm">Preço:</span>
                              <span className="text-purple-400 font-bold text-lg">
                                R$ {agendamento.painel_servicos.preco.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-400 text-sm">Duração:</span>
                              <span className="text-gray-300 text-sm font-medium">
                                {agendamento.painel_servicos.duracao} min
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
