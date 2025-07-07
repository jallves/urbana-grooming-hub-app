import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Scissors, Calendar, Clock, CheckCircle, XCircle, Edit, Trash2, ArrowLeft, BarChart3, Award } from 'lucide-react';
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

  const fetchAgendamentos = async () => {
    if (!cliente?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('painel_agendamentos')
        .select(`
          *,
          painel_barbeiros (nome),
          painel_servicos (nome, preco, duracao)
        `)
        .eq('cliente_id', cliente.id)
        .order('data', { ascending: false });

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
    if (!confirm('Tem certeza que deseja cancelar este agendamento?')) return;

    try {
      const { error } = await supabase
        .from('painel_agendamentos')
        .update({ status: 'cancelado' })
        .eq('id', agendamento.id);

      if (error) throw error;

      toast({
        title: "Agendamento cancelado!",
        description: "O agendamento foi cancelado com sucesso.",
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

  useEffect(() => {
    fetchAgendamentos();
  }, [cliente?.id]);

  const ParticleBackground = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-cyan-500/20"
          initial={{
            x: Math.random() * 100,
            y: Math.random() * 100,
            width: Math.random() * 3 + 1,
            height: Math.random() * 3 + 1,
            opacity: Math.random() * 0.5 + 0.1
          }}
          animate={{
            y: [null, (Math.random() - 0.5) * 50],
            x: [null, (Math.random() - 0.5) * 50],
            transition: {
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              repeatType: "reverse"
            }
          }}
        />
      ))}
    </div>
  );

  const GlowCard = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
    <div className={`relative group ${className}`}>
      <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl blur opacity-20 group-hover:opacity-30 transition duration-300" />
      <div className="relative bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        {children}
      </div>
    </div>
  );

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      agendado: { label: 'Agendado', color: 'bg-blue-900/50 text-blue-400 border-blue-800' },
      confirmado: { label: 'Confirmado', color: 'bg-green-900/50 text-green-400 border-green-800' },
      concluido: { label: 'Concluído', color: 'bg-purple-900/50 text-purple-400 border-purple-800' },
      cancelado: { label: 'Cancelado', color: 'bg-red-900/50 text-red-400 border-red-800' },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, color: 'bg-gray-900/50 text-gray-400 border-gray-800' };
    return (
      <motion.span 
        whileHover={{ scale: 1.05 }}
        className={`px-3 py-1.5 rounded-full text-xs font-medium border backdrop-blur-md ${config.color}`}
      >
        {config.label}
      </motion.span>
    );
  };

  return (
    <div className="min-h-screen w-screen bg-gray-950 overflow-x-hidden relative">
      <ParticleBackground />
      
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20 pointer-events-none" />

      <div className="relative w-full px-4 py-6 sm:px-6 lg:px-8 lg:py-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full space-y-8"
        >
          <motion.div 
            className="flex flex-col lg:flex-row items-start lg:items-center gap-4"
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              size="sm"
              className="border-gray-800 text-gray-300 hover:bg-gray-800/50 hover:text-white rounded-lg px-4 py-2 backdrop-blur-md flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Voltar</span>
            </Button>
            
            <div className="flex-1">
              <div className="inline-flex items-center gap-4 mb-6">
                <motion.div
                  whileHover={{ rotate: 15 }}
                  className="p-3 bg-gray-900 rounded-xl border border-gray-800 shadow-lg"
                >
                  <Scissors className="h-6 w-6 text-cyan-400" />
                </motion.div>
                <div>
                  <motion.h1 
                    className="text-3xl sm:text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    Olá, {cliente?.nome.split(' ')[0]}!
                  </motion.h1>
                  <motion.p 
                    className="text-gray-400 text-lg mt-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    Painel de agendamentos
                  </motion.p>
                </div>
              </div>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <Button 
                  onClick={() => navigate('/painel-cliente/agendar')}
                  className="relative overflow-hidden bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-medium px-8 py-4 rounded-lg shadow-xl"
                  size="lg"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    <span>Novo Agendamento</span>
                  </span>
                  <motion.span
                    className="absolute inset-0 bg-gradient-to-r from-cyan-400/30 to-purple-400/30 opacity-0 hover:opacity-100 transition-opacity duration-300"
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  />
                </Button>
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
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
                <GlowCard key={index}>
                  <Card className="border-0 bg-gradient-to-br from-gray-900 to-gray-950 backdrop-blur-sm">
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
                </GlowCard>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-300 flex items-center gap-2">
                <Clock className="h-5 w-5 text-cyan-400" />
                <span>Agendamentos Recentes</span>
              </h2>
              <Button
                variant="outline"
                onClick={() => navigate('/painel-cliente/agendamentos')}
                className="border-gray-800 text-gray-300 hover:bg-gray-800/50 hover:text-white rounded-lg backdrop-blur-md"
              >
                Ver Todos
              </Button>
            </div>
            
            {agendamentos.length === 0 ? (
              <GlowCard>
                <Card className="border-0 bg-gradient-to-br from-gray-900 to-gray-950">
                  <CardContent className="p-8 text-center">
                    <Calendar className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">
                      Nenhum agendamento
                    </h3>
                    <Button 
                      onClick={() => navigate('/painel-cliente/agendar')}
                      className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white mt-4"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Agendar Serviço
                    </Button>
                  </CardContent>
                </Card>
              </GlowCard>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {agendamentos.slice(0, 6).map((agendamento) => (
                  <GlowCard key={agendamento.id}>
                    <motion.div
                      whileHover={{ y: -5 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      <Card className="border-0 bg-gradient-to-br from-gray-900 to-gray-950">
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
                                className="flex-1 text-xs border-gray-800 text-gray-300 hover:bg-gray-800/50 hover:text-white backdrop-blur-sm"
                              >
                                <Edit className="w-3 h-3 mr-1" />
                                Editar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteAgendamento(agendamento)}
                                className="flex-1 text-xs border-gray-800 text-gray-300 hover:bg-gray-800/50 hover:text-white backdrop-blur-sm"
                              >
                                <Trash2 className="w-3 h-3 mr-1" />
                                Cancelar
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  </GlowCard>
                ))}
              </div>
            )}
          </motion.div>

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
