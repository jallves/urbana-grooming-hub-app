
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

export default function PainelClienteMeusAgendamentos() {
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
      
      // Configurar real-time para agendamentos
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
            console.log('Agendamento atualizado em tempo real:', payload);
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

    try {
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

      if (error) {
        console.error('Erro ao buscar agendamentos:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os agendamentos.",
          variant: "destructive",
        });
        return;
      }

      setAgendamentos(data || []);
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
    }
  };

  const fetchBarbeiros = async () => {
    try {
      const { data, error } = await supabase
        .from('painel_barbeiros')
        .select('id, nome')
        .order('nome');

      if (error) throw error;
      setBarbeiros(data || []);
    } catch (error) {
      console.error('Erro ao buscar barbeiros:', error);
    }
  };

  const fetchServicos = async () => {
    try {
      const { data, error } = await supabase
        .from('painel_servicos')
        .select('id, nome, preco, duracao')
        .order('nome');

      if (error) throw error;
      setServicos(data || []);
    } catch (error) {
      console.error('Erro ao buscar serviços:', error);
    }
  };

  const handleEditClick = (agendamento: Agendamento) => {
    setEditingAgendamento(agendamento);
    setEditForm({
      data: agendamento.data,
      hora: agendamento.hora,
      barbeiro_id: '', // Será preenchido com o ID do barbeiro atual
      servico_id: '', // Será preenchido com o ID do serviço atual
      observacoes: agendamento.observacoes || ''
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingAgendamento) return;

    try {
      const { error } = await supabase
        .from('painel_agendamentos')
        .update({
          data: editForm.data,
          hora: editForm.hora,
          barbeiro_id: editForm.barbeiro_id || editingAgendamento.painel_barbeiros ? undefined : editForm.barbeiro_id,
          servico_id: editForm.servico_id || editingAgendamento.painel_servicos ? undefined : editForm.servico_id,
          observacoes: editForm.observacoes
        })
        .eq('id', editingAgendamento.id)
        .eq('cliente_id', cliente?.id);

      if (error) {
        console.error('Erro ao atualizar agendamento:', error);
        toast({
          title: "Erro",
          description: "Não foi possível atualizar o agendamento.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Agendamento atualizado",
        description: "Seu agendamento foi atualizado com sucesso.",
      });

      setEditDialogOpen(false);
      setEditingAgendamento(null);
      fetchAgendamentos();
    } catch (error) {
      console.error('Erro ao atualizar agendamento:', error);
    }
  };

  const handleCancelarAgendamento = async (agendamentoId: string) => {
    if (!confirm('Tem certeza que deseja cancelar este agendamento?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('painel_agendamentos')
        .update({ status: 'cancelado' })
        .eq('id', agendamentoId)
        .eq('cliente_id', cliente?.id);

      if (error) {
        console.error('Erro ao cancelar agendamento:', error);
        toast({
          title: "Erro",
          description: "Não foi possível cancelar o agendamento.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Agendamento cancelado",
        description: "Seu agendamento foi cancelado com sucesso.",
      });

      fetchAgendamentos();
    } catch (error) {
      console.error('Erro ao cancelar agendamento:', error);
    }
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

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-zinc-950 to-zinc-900 p-4">
      <div className="w-full max-w-none mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button
              onClick={() => navigate('/painel-cliente/dashboard')}
              variant="outline"
              size="sm"
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">Meus Agendamentos</h1>
              <p className="text-gray-400">Gerencie seus agendamentos na barbearia</p>
            </div>
          </div>

          {/* Botão Novo Agendamento */}
          <div className="flex justify-end mb-6">
            <Button 
              onClick={() => navigate('/painel-cliente/agendar')}
              className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Agendamento
            </Button>
          </div>

          {/* Lista de Agendamentos */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-amber-500 border-t-transparent mx-auto"></div>
              <p className="text-gray-400 mt-4">Carregando agendamentos...</p>
            </div>
          ) : agendamentos.length === 0 ? (
            <Card className="bg-zinc-900 border-zinc-700 text-center py-12">
              <CardContent>
                <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Nenhum agendamento encontrado</h3>
                <p className="text-gray-400 mb-4">Você ainda não possui nenhum agendamento.</p>
                <Button 
                  onClick={() => navigate('/painel-cliente/agendar')}
                  className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Fazer Primeiro Agendamento
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {agendamentos.map((agendamento) => (
                <Card key={agendamento.id} className="bg-zinc-900 border-zinc-700 hover:border-amber-500/50 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500/10 rounded-lg">
                          <Scissors className="h-5 w-5 text-amber-500" />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-semibold text-white">
                            {agendamento.painel_servicos?.nome || 'Serviço não encontrado'}
                          </CardTitle>
                          {getStatusBadge(agendamento.status)}
                        </div>
                      </div>
                      
                      {agendamento.status === 'agendado' && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditClick(agendamento)}
                            className="text-blue-400 hover:text-blue-300 border-blue-400 hover:border-blue-300"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelarAgendamento(agendamento.id)}
                            className="text-red-400 hover:text-red-300 border-red-400 hover:border-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="font-medium text-white">
                          {format(new Date(agendamento.data), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="font-medium text-white">
                          {agendamento.hora}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="font-medium text-white">
                          {agendamento.painel_barbeiros?.nome || 'Barbeiro não definido'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">Preço:</span>
                        <span className="font-semibold text-amber-500">
                          R$ {agendamento.painel_servicos?.preco?.toFixed(2) || '0,00'}
                        </span>
                      </div>
                    </div>

                    {agendamento.observacoes && (
                      <div className="mt-3 p-3 bg-zinc-800 rounded-lg">
                        <p className="text-sm text-gray-300">
                          <strong>Observações:</strong> {agendamento.observacoes}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Dialog de Edição */}
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent className="bg-zinc-900 border-zinc-700 text-white">
              <DialogHeader>
                <DialogTitle className="text-white">Editar Agendamento</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-data" className="text-white">Data</Label>
                    <Input
                      id="edit-data"
                      type="date"
                      value={editForm.data}
                      onChange={(e) => setEditForm(prev => ({ ...prev, data: e.target.value }))}
                      className="bg-zinc-800 border-zinc-600 text-white"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-hora" className="text-white">Hora</Label>
                    <Input
                      id="edit-hora"
                      type="time"
                      value={editForm.hora}
                      onChange={(e) => setEditForm(prev => ({ ...prev, hora: e.target.value }))}
                      className="bg-zinc-800 border-zinc-600 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-barbeiro" className="text-white">Barbeiro</Label>
                  <Select value={editForm.barbeiro_id} onValueChange={(value) => setEditForm(prev => ({ ...prev, barbeiro_id: value }))}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-600 text-white">
                      <SelectValue placeholder="Selecione um barbeiro" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-600">
                      {barbeiros.map((barbeiro) => (
                        <SelectItem key={barbeiro.id} value={barbeiro.id} className="text-white">
                          {barbeiro.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-servico" className="text-white">Serviço</Label>
                  <Select value={editForm.servico_id} onValueChange={(value) => setEditForm(prev => ({ ...prev, servico_id: value }))}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-600 text-white">
                      <SelectValue placeholder="Selecione um serviço" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-600">
                      {servicos.map((servico) => (
                        <SelectItem key={servico.id} value={servico.id} className="text-white">
                          {servico.nome} - R$ {servico.preco.toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-observacoes" className="text-white">Observações</Label>
                  <Textarea
                    id="edit-observacoes"
                    value={editForm.observacoes}
                    onChange={(e) => setEditForm(prev => ({ ...prev, observacoes: e.target.value }))}
                    className="bg-zinc-800 border-zinc-600 text-white"
                    placeholder="Observações sobre o agendamento..."
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setEditDialogOpen(false)}
                    className="border-gray-600 text-gray-300 hover:bg-gray-800"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSaveEdit}
                    className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Salvar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </motion.div>
      </div>
    </div>
  );
}
