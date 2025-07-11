import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Calendar, Clock, User, Scissors, Plus, Filter, Search, Edit, Trash2 } from 'lucide-react';
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
      concluido: { label: 'Concluído', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
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
      <div className="w-full px-4 py-6 sm:px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full space-y-6"
        >
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                Meus Agendamentos
              </h1>
              <p className="text-gray-400 text-base sm:text-lg mt-2">Acompanhe todos os seus agendamentos</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => navigate('/painel-cliente/agendar')}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-6 py-3 rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Agendamento
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/painel-cliente/dashboard')}
                className="text-gray-300 border border-gray-600 bg-transparent rounded-xl px-6 py-3 text-sm font-medium transition-none shadow-none hover:bg-transparent hover:text-gray-300 hover:border-gray-600"
              >
                Voltar
              </Button>
            </div>
          </motion.div>
        </motion.div>
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
  );
}
