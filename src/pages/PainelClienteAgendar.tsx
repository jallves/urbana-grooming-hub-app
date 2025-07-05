
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, ArrowLeft, Clock, Scissors } from 'lucide-react';
import { usePainelClienteAuth } from '@/contexts/PainelClienteAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

interface AgendamentoResponse {
  id: string;
  hora: string;
  status: string;
}

export default function PainelClienteAgendar() {
  const navigate = useNavigate();
  const { cliente } = usePainelClienteAuth();
  const { toast } = useToast();

  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [formData, setFormData] = useState({
    servicoId: '',
    barbeiroId: '',
    data: '',
    hora: ''
  });
  const [loading, setLoading] = useState(false);
  const [horariosDisponiveis, setHorariosDisponiveis] = useState<string[]>([]);

  useEffect(() => {
    if (!cliente) {
      navigate('/painel-cliente/login');
      return;
    }

    carregarDados();
  }, [cliente, navigate]);

  const carregarDados = async () => {
    try {
      const { data: barbeirosData } = await supabase.rpc('get_painel_barbeiros' as any);
      const { data: servicosData } = await supabase.rpc('get_painel_servicos' as any);

      setBarbeiros((barbeirosData as Barbeiro[]) || []);
      setServicos((servicosData as Servico[]) || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const gerarHorarios = () => {
    const horarios = [];
    const agora = new Date();
    const dataAtual = new Date().toISOString().split('T')[0];
    const ehHoje = formData.data === dataAtual;
    const horaAtual = agora.getHours();

    for (let hora = 9; hora <= 19; hora++) {
      const horarioFormatado = `${hora.toString().padStart(2, '0')}:00`;
      if (ehHoje && hora <= horaAtual) continue;
      horarios.push(horarioFormatado);
    }

    return horarios;
  };

  const verificarDisponibilidade = async () => {
    if (!formData.barbeiroId || !formData.data) {
      setHorariosDisponiveis([]);
      return;
    }

    try {
      const { data: agendamentos } = await supabase.rpc('get_agendamentos_barbeiro_data' as any, {
        barbeiro_id: formData.barbeiroId,
        data_agendamento: formData.data
      });

      const ocupados = (agendamentos as AgendamentoResponse[])?.map(ag => ag.hora) || [];
      const livres = gerarHorarios().filter(h => !ocupados.includes(h));
      setHorariosDisponiveis(livres);
    } catch (error) {
      console.error('Erro ao verificar disponibilidade:', error);
    }
  };

  useEffect(() => {
    verificarDisponibilidade();
  }, [formData.barbeiroId, formData.data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.servicoId || !formData.barbeiroId || !formData.data || !formData.hora) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    if (!cliente?.id) {
      toast({
        title: "Erro",
        description: "Cliente não encontrado. Faça login novamente.",
        variant: "destructive"
      });
      navigate('/painel-cliente/login');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.rpc('create_painel_agendamento' as any, {
        cliente_id: cliente.id,
        barbeiro_id: formData.barbeiroId,
        servico_id: formData.servicoId,
        data: formData.data,
        hora: formData.hora
      });

      if (error) {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
        return;
      }

      toast({ title: "Sucesso", description: "Agendamento criado com sucesso." });
      navigate('/painel-cliente/dashboard');
    } catch (err) {
      toast({ title: "Erro", description: "Erro inesperado.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (!cliente) return null;

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-zinc-950 to-zinc-900 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Button
            onClick={() => navigate('/painel-cliente/dashboard')}
            variant="outline"
            size="sm"
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold text-white">Agendar Corte</h1>
        </div>

        <div className="w-full max-w-2xl mx-auto">
          <Card className="bg-zinc-900 border border-zinc-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Scissors className="h-5 w-5 text-amber-500" />
                Novo Agendamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Serviço */}
                <div className="space-y-2">
                  <Label htmlFor="servico" className="text-white">Serviço</Label>
                  <Select value={formData.servicoId} onValueChange={(value) => setFormData(prev => ({ ...prev, servicoId: value }))}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-600 text-white">
                      <SelectValue placeholder="Selecione um serviço" />
                    </SelectTrigger>
                    <SelectContent>
                      {servicos.map(servico => (
                        <SelectItem key={servico.id} value={servico.id}>
                          {servico.nome} - R$ {servico.preco.toFixed(2)} ({servico.duracao}min)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Barbeiro */}
                <div className="space-y-2">
                  <Label htmlFor="barbeiro" className="text-white">Barbeiro</Label>
                  <Select value={formData.barbeiroId} onValueChange={(value) => setFormData(prev => ({ ...prev, barbeiroId: value }))}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-600 text-white">
                      <SelectValue placeholder="Selecione um barbeiro" />
                    </SelectTrigger>
                    <SelectContent>
                      {barbeiros.map(barbeiro => (
                        <SelectItem key={barbeiro.id} value={barbeiro.id}>
                          {barbeiro.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Data */}
                <div className="space-y-2">
                  <Label htmlFor="data" className="text-white">Data</Label>
                  <Input
                    type="date"
                    value={formData.data}
                    onChange={(e) => setFormData(prev => ({ ...prev, data: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    className="bg-zinc-800 border-zinc-600 text-white"
                    required
                  />
                </div>

                {/* Hora */}
                <div className="space-y-2">
                  <Label htmlFor="hora" className="text-white">Horário</Label>
                  <Select value={formData.hora} onValueChange={(value) => setFormData(prev => ({ ...prev, hora: value }))}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-600 text-white">
                      <SelectValue placeholder="Selecione um horário" />
                    </SelectTrigger>
                    <SelectContent>
                      {horariosDisponiveis.map(horario => (
                        <SelectItem key={horario} value={horario}>
                          {horario}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.barbeiroId && formData.data && horariosDisponiveis.length === 0 && (
                    <p className="text-red-400 text-sm">Nenhum horário disponível para esta data.</p>
                  )}
                </div>

                {/* Botão */}
                <Button
                  type="submit"
                  className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold"
                  disabled={loading}
                >
                  {loading ? 'Agendando...' : (
                    <>
                      <Calendar className="h-4 w-4 mr-2" />
                      Confirmar Agendamento
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
