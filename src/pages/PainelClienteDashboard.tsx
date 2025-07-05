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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950">
      {/* Overlay de gradiente */}
      <div className="fixed inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-cyan-600/5 pointer-events-none" />
      
      {/* Container principal */}
      <div className="relative w-full px-4 py-6 mx-auto sm:px-6 lg:px-8 lg:py-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full space-y-6 lg:space-y-8"
        >
          {/* Header */}
          <div className="flex flex-col justify-between w-full gap-4 md:flex-row md:items-center">
            <div>
              <h1 className="text-2xl font-bold text-white sm:text-3xl">Bem-vindo, {cliente.nome}</h1>
              <p className="text-sm text-gray-400">Acompanhe seus agendamentos e estatísticas</p>
            </div>
            <Button className="w-full md:w-auto" onClick={() => navigate('/painel-cliente/agendar')}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Agendamento
            </Button>
          </div>

          {/* Grid de estatísticas */}
          <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Cards de estatísticas aqui */}
          </div>

          {/* Seção de agendamentos */}
          <div className="w-full space-y-4">
            <h2 className="text-xl font-semibold text-white">Seus Agendamentos</h2>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {agendamentos.map((agendamento) => (
                <motion.div key={agendamento.id} variants={itemVariants}>
                  <Card className="border-gray-800 bg-gray-900/50 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                      <CardTitle className="text-sm font-medium text-white">
                        {agendamento.painel_servicos.nome}
                      </CardTitle>
                      {getStatusBadge(agendamento.status)}
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center space-x-2 text-sm text-gray-400">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {format(new Date(agendamento.data), 'PPP', { locale: ptBR })}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-400">
                          <Clock className="w-4 h-4" />
                          <span>{agendamento.hora}</span>
                        </div>
                      </div>
                      <div className="flex items-center mt-4 space-x-2 text-sm text-gray-400">
                        <Scissors className="w-4 h-4" />
                        <span>Barbeiro: {agendamento.painel_barbeiros.nome}</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}