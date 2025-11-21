
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Calendar, Clock, User, Scissors, Plus, Edit, Trash2 } from 'lucide-react';
import { usePainelClienteAuth } from '@/contexts/PainelClienteAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import EditAgendamentoModal from '@/components/painel-cliente/EditAgendamentoModal';
import { useToast } from '@/hooks/use-toast';

interface Agendamento {
  id: string;
  data: string;
  hora: string;
  status: string;
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
      .select('*, painel_barbeiros!inner(nome), painel_servicos!inner(nome, preco, duracao)')  
      .eq('cliente_id', cliente.id)
      .order('data', { ascending: false })
      .order('hora', { ascending: false });

    if (!error) setAgendamentos(data || []);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      agendado: { label: 'Agendado', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
      confirmado: { label: 'Confirmado', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
      concluido: { label: 'Concluído', color: 'bg-urbana-gold/20 text-urbana-gold border-urbana-gold/30' },
      cancelado: { label: 'Cancelado', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' };
    return <span className={`px-3 py-1.5 rounded-full text-xs font-medium border ${config.color} backdrop-blur-sm`}>{config.label}</span>;
  };

  const handleEditAgendamento = (agendamento: Agendamento) => {
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
    <div className="w-full h-full bg-transparent">
      <div className="mx-auto w-full max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full space-y-4 sm:space-y-6"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-urbana-gold drop-shadow-lg">
                Meus Agendamentos
              </h1>
              <p className="text-urbana-light/70 text-sm sm:text-base mt-1 sm:mt-2 drop-shadow-md">Acompanhe todos os seus agendamentos</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button
                onClick={() => navigate('/painel-cliente/agendar')}
                className="bg-gradient-to-r from-urbana-gold to-urbana-gold-vibrant hover:from-urbana-gold-vibrant hover:to-urbana-gold text-urbana-black font-semibold px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
              >
                <Plus className="h-4 w-4 mr-1 sm:mr-2" />
                Novo Agendamento
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/painel-cliente/dashboard')}
                className="text-urbana-light border border-urbana-gold/30 bg-transparent rounded-xl px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-medium hover:bg-urbana-gold/10 hover:border-urbana-gold/50 transition-all duration-300"
              >
                <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
                Voltar
              </Button>
            </div>
          </motion.div>

          {/* Filters */}
          <motion.div variants={itemVariants}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
              {[
                { key: 'todos', label: 'Todos', color: 'from-gray-500 to-gray-600' },
                { key: 'agendado', label: 'Agendados', color: 'from-blue-500 to-blue-600' },
                { key: 'confirmado', label: 'Confirmados', color: 'from-green-500 to-green-600' },
                { key: 'concluido', label: 'Concluídos', color: 'from-urbana-gold to-urbana-gold-vibrant' },
                { key: 'cancelado', label: 'Cancelados', color: 'from-red-500 to-red-600' }
              ].map((filtro) => (
                <Button
                  key={filtro.key}
                  onClick={() => setFiltroStatus(filtro.key)}
                  className={`
                    w-full rounded-xl 
                    px-3 sm:px-4 py-2 
                    text-xs sm:text-sm 
                    font-medium
                    bg-gradient-to-r ${filtro.color} 
                    ${filtro.key === 'concluido' ? 'text-urbana-black' : 'text-white'} 
                    ${filtroStatus === filtro.key ? 'ring-2 ring-white/50 shadow-xl' : 'shadow-lg hover:scale-[1.02]'} 
                    transition-all duration-300
                    whitespace-nowrap
                  `}
                >
                  {filtro.label}
                </Button>
              ))}
            </div>
          </motion.div>

          {/* Content */}
          <motion.div variants={itemVariants} className="pb-6 w-full">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-8 h-8 border-2 border-urbana-gold border-t-transparent rounded-full"
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
                    className="bg-gradient-to-r from-urbana-gold to-urbana-gold-vibrant hover:from-urbana-gold-vibrant hover:to-urbana-gold text-urbana-black font-semibold px-8 py-4 rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    {filtroStatus === 'todos' ? 'Fazer Primeiro Agendamento' : 'Novo Agendamento'}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="w-full grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6">
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
                            <CardTitle className="text-white text-lg font-semibold group-hover:text-urbana-gold transition-colors truncate pr-2 flex-1">
                              {agendamento.painel_servicos.nome}
                            </CardTitle>
                            {getStatusBadge(agendamento.status)}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-3">
                            <div className="flex items-center text-gray-300 group-hover:text-white transition-colors">
                              <Calendar className="h-4 w-4 mr-3 text-urbana-gold flex-shrink-0" />
                              <span className="text-sm font-medium">
                                {format(parseISO(agendamento.data), 'EEEE, dd \'de\' MMMM', { locale: ptBR })}
                              </span>
                            </div>
                            <div className="flex items-center text-gray-300 group-hover:text-white transition-colors">
                              <Clock className="h-4 w-4 mr-3 text-urbana-gold flex-shrink-0" />
                              <span className="text-sm font-medium">{agendamento.hora}</span>
                            </div>
                            <div className="flex items-center text-gray-300 group-hover:text-white transition-colors">
                              <User className="h-4 w-4 mr-3 text-urbana-gold flex-shrink-0" />
                              <span className="text-sm font-medium">{agendamento.painel_barbeiros.nome}</span>
                            </div>
                          </div>
                          
                          <div className="pt-4 border-t border-slate-700/50">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-xs text-gray-400">Valor</span>
                              <span className="text-urbana-gold font-bold text-lg">
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

                          {/* Action Buttons */}
                          {['agendado', 'confirmado'].includes(agendamento.status) && (
                            <div className="flex gap-2 pt-2">
                              <Button
                                size="sm"
                                onClick={() => handleEditAgendamento(agendamento)}
                                className="flex-1 rounded-xl px-4 py-2 text-sm bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transition-all duration-300"
                              >
                                <Edit className="w-4 h-4 mr-1" />
                                Editar
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleDeleteAgendamento(agendamento)}
                                className="flex-1 rounded-xl px-4 py-2 text-sm bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg transition-all duration-300"
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Cancelar
                              </Button>
                            </div>
                          )}
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
    </div>
  );
}
