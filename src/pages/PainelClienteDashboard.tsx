
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Calendar, Clock, User, Scissors, Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { usePainelClienteAuth } from '@/contexts/PainelClienteAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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

interface Barbeiro {
  id: string;
  nome: string;
}

interface Servico {
  id: string;
  nome: string;
  preco: number;
  duracao: number;
}

export default function PainelClienteDashboard() {
  const navigate = useNavigate();
  const { cliente } = usePainelClienteAuth();
  const { toast } = useToast();
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingAgendamento, setEditingAgendamento] = useState<Agendamento | null>(null);
  const [editForm, setEditForm] = useState({
    data: '',
    hora: '',
    barbeiro_id: '',
    servico_id: '',
    observacoes: ''
  });

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
    await Promise.all([
      fetchAgendamentos(),
      fetchBarbeiros(),
      fetchServicos()
    ]);
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

  const fetchBarbeiros = async () => {
    const { data, error } = await supabase.from('painel_barbeiros').select('id, nome').order('nome');
    if (!error) setBarbeiros(data || []);
  };

  const fetchServicos = async () => {
    const { data, error } = await supabase.from('painel_servicos').select('id, nome, preco, duracao').order('nome');
    if (!error) setServicos(data || []);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      agendado: { label: 'Agendado', variant: 'default' as const },
      confirmado: { label: 'Confirmado', variant: 'secondary' as const },
      concluido: { label: 'Concluído', variant: 'default' as const },
      cancelado: { label: 'Cancelado', variant: 'destructive' as const },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: 'default' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (!cliente) {
    navigate('/painel-cliente/login');
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-zinc-950 to-zinc-900 px-4 sm:px-6 lg:px-8 py-6">
      <div className="w-full max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-white">Dashboard</h1>
                <p className="text-gray-400">Bem-vindo ao painel do cliente</p>
              </div>
            </div>
            <Button
              onClick={() => navigate('/painel-cliente/agendar')}
              className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Agendamento
            </Button>
          </div>

          {/* Conteúdo Responsivo */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="bg-zinc-900 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-white">Próximos Agendamentos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-500">
                  {agendamentos.filter(a => a.status === 'agendado' || a.status === 'confirmado').length}
                </div>
                <p className="text-gray-400">agendamentos confirmados</p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-white">Total de Serviços</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">
                  {agendamentos.filter(a => a.status === 'concluido').length}
                </div>
                <p className="text-gray-400">serviços concluídos</p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-white">Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold text-blue-500">Ativo</div>
                <p className="text-gray-400">conta verificada</p>
              </CardContent>
            </Card>
          </div>

          {/* Agendamentos Recentes */}
          <Card className="bg-zinc-900 border-zinc-700">
            <CardHeader>
              <CardTitle className="text-white">Agendamentos Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              {agendamentos.length === 0 ? (
                <div className="text-center py-8">
                  <Scissors className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-300 mb-2">Nenhum agendamento encontrado</h3>
                  <p className="text-gray-400 mb-4">Você ainda não possui agendamentos.</p>
                  <Button
                    onClick={() => navigate('/painel-cliente/agendar')}
                    className="bg-amber-500 hover:bg-amber-600 text-black"
                  >
                    Fazer Primeiro Agendamento
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {agendamentos.slice(0, 3).map((agendamento) => (
                    <div key={agendamento.id} className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-amber-500 rounded-lg">
                          <Scissors className="h-4 w-4 text-black" />
                        </div>
                        <div>
                          <h4 className="text-white font-medium">{agendamento.painel_servicos.nome}</h4>
                          <p className="text-gray-400 text-sm">
                            {agendamento.painel_barbeiros.nome} • {format(new Date(agendamento.data), 'dd/MM/yyyy', { locale: ptBR })} às {agendamento.hora}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(agendamento.status)}
                        <span className="text-amber-500 font-medium">
                          R$ {agendamento.painel_servicos.preco.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  {agendamentos.length > 3 && (
                    <div className="text-center pt-4">
                      <Button
                        variant="outline"
                        onClick={() => navigate('/painel-cliente/agendamentos')}
                        className="border-gray-600 text-gray-300 hover:bg-gray-800"
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
      </div>
    </div>
  );
}
