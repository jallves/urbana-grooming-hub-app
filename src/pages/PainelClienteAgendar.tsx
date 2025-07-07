
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Calendar, Clock, User, Scissors, Plus } from 'lucide-react';
import { usePainelClienteAuth } from '@/contexts/PainelClienteAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ConfirmacaoAgendamento from '@/components/painel-cliente/ConfirmacaoAgendamento';
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

export default function PainelClienteAgendar() {
  const navigate = useNavigate();
  const { cliente } = usePainelClienteAuth();
  const { toast } = useToast();
  
  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const [formData, setFormData] = useState({
    barbeiro_id: '',
    servico_id: '',
    data: '',
    hora: '',
    observacoes: ''
  });

  const [confirmacao, setConfirmacao] = useState({
    isOpen: false,
    tipo: 'sucesso' as 'sucesso' | 'erro',
    titulo: '',
    mensagem: '',
    detalhes: undefined as any
  });

  useEffect(() => {
    if (cliente) {
      fetchData();
    }
  }, [cliente]);

  const fetchData = async () => {
    try {
      setLoadingData(true);
      
      const [barbeirosResponse, servicosResponse] = await Promise.all([
        supabase.from('painel_barbeiros').select('*').order('nome'),
        supabase.from('painel_servicos').select('*').order('nome')
      ]);

      if (barbeirosResponse.data) setBarbeiros(barbeirosResponse.data);
      if (servicosResponse.data) setServicos(servicosResponse.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os dados. Tente novamente.",
      });
    } finally {
      setLoadingData(false);
    }
  };

  const gerarHorariosDisponiveis = () => {
    const horarios = [];
    for (let hora = 8; hora <= 18; hora++) {
      for (let minuto = 0; minuto < 60; minuto += 30) {
        const horaFormatada = `${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}`;
        horarios.push(horaFormatada);
      }
    }
    return horarios;
  };

  const gerarDatasDisponiveis = () => {
    const datas = [];
    for (let i = 1; i <= 30; i++) {
      const data = addDays(new Date(), i);
      // Pular domingos (0)
      if (data.getDay() !== 0) {
        datas.push({
          value: format(data, 'yyyy-MM-dd'),
          label: format(data, "EEEE, dd 'de' MMMM", { locale: ptBR })
        });
      }
    }
    return datas;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.barbeiro_id || !formData.servico_id || !formData.data || !formData.hora) {
      setConfirmacao({
        isOpen: true,
        tipo: 'erro',
        titulo: 'Dados Incompletos',
        mensagem: 'Por favor, preencha todos os campos obrigatórios para realizar o agendamento.',
        detalhes: undefined
      });
      return;
    }

    setLoading(true);

    try {
      const { data: novoAgendamento, error } = await supabase
        .rpc('create_painel_agendamento', {
          cliente_id: cliente?.id,
          barbeiro_id: formData.barbeiro_id,
          servico_id: formData.servico_id,
          data: formData.data,
          hora: formData.hora
        });

      if (error) {
        console.error('Erro ao criar agendamento:', error);
        
        let mensagemErro = 'Não foi possível realizar o agendamento. Tente novamente.';
        if (error.message?.includes('já está ocupado')) {
          mensagemErro = 'Este horário já está ocupado. Por favor, escolha outro horário.';
        }

        setConfirmacao({
          isOpen: true,
          tipo: 'erro',
          titulo: 'Erro no Agendamento',
          mensagem: mensagemErro,
          detalhes: undefined
        });
        return;
      }

      // Buscar detalhes para a confirmação
      const barbeiro = barbeiros.find(b => b.id === formData.barbeiro_id);
      const servico = servicos.find(s => s.id === formData.servico_id);
      
      setConfirmacao({
        isOpen: true,
        tipo: 'sucesso',
        titulo: '🎉 Agendamento Confirmado!',
        mensagem: 'Seu agendamento foi realizado com sucesso! Você receberá uma confirmação em breve.',
        detalhes: {
          servico: servico?.nome || '',
          barbeiro: barbeiro?.nome || '',
          data: format(new Date(formData.data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }),
          hora: formData.hora,
          preco: servico?.preco || 0
        }
      });

      // Limpar formulário
      setFormData({
        barbeiro_id: '',
        servico_id: '',
        data: '',
        hora: '',
        observacoes: ''
      });

    } catch (error) {
      console.error('Erro inesperado:', error);
      setConfirmacao({
        isOpen: true,
        tipo: 'erro',
        titulo: 'Erro Inesperado',
        mensagem: 'Ocorreu um erro inesperado. Por favor, tente novamente mais tarde.',
        detalhes: undefined
      });
    } finally {
      setLoading(false);
    }
  };

  const fecharConfirmacao = () => {
    setConfirmacao(prev => ({ ...prev, isOpen: false }));
    if (confirmacao.tipo === 'sucesso') {
      navigate('/painel-cliente/dashboard');
    }
  };

  if (!cliente) {
    navigate('/painel-cliente/login');
    return null;
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen w-screen bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950">
      <div className="absolute inset-0 bg-gradient-to-r from-green-600/5 via-blue-600/5 to-green-600/5" />
      
      <div className="relative w-full px-4 py-8 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-2xl mx-auto space-y-6"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
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
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-green-400 via-blue-400 to-green-400 bg-clip-text text-transparent">
                Novo Agendamento
              </h1>
              <p className="text-gray-400 text-base sm:text-lg mt-2">Agende seu próximo corte</p>
            </div>
          </div>

          {/* Form */}
          <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border border-slate-700/50 backdrop-blur-xl shadow-2xl">
            <CardHeader>
              <CardTitle className="text-white text-xl flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl">
                  <Plus className="h-5 w-5 text-white" />
                </div>
                Dados do Agendamento
              </CardTitle>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Serviço */}
                  <div className="space-y-2">
                    <Label className="text-white flex items-center gap-2">
                      <Scissors className="h-4 w-4 text-green-400" />
                      Serviço *
                    </Label>
                    <Select
                      value={formData.servico_id}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, servico_id: value }))}
                    >
                      <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                        <SelectValue placeholder="Selecione o serviço" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-600">
                        {servicos.map((servico) => (
                          <SelectItem key={servico.id} value={servico.id} className="text-white">
                            {servico.nome} - R$ {servico.preco.toFixed(2)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Barbeiro */}
                  <div className="space-y-2">
                    <Label className="text-white flex items-center gap-2">
                      <User className="h-4 w-4 text-green-400" />
                      Barbeiro *
                    </Label>
                    <Select
                      value={formData.barbeiro_id}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, barbeiro_id: value }))}
                    >
                      <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                        <SelectValue placeholder="Selecione o barbeiro" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-600">
                        {barbeiros.map((barbeiro) => (
                          <SelectItem key={barbeiro.id} value={barbeiro.id} className="text-white">
                            {barbeiro.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Data */}
                  <div className="space-y-2">
                    <Label className="text-white flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-green-400" />
                      Data *
                    </Label>
                    <Select
                      value={formData.data}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, data: value }))}
                    >
                      <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                        <SelectValue placeholder="Selecione a data" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-600">
                        {gerarDatasDisponiveis().map((data) => (
                          <SelectItem key={data.value} value={data.value} className="text-white">
                            {data.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Hora */}
                  <div className="space-y-2">
                    <Label className="text-white flex items-center gap-2">
                      <Clock className="h-4 w-4 text-green-400" />
                      Horário *
                    </Label>
                    <Select
                      value={formData.hora}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, hora: value }))}
                    >
                      <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                        <SelectValue placeholder="Selecione o horário" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-600">
                        {gerarHorariosDisponiveis().map((hora) => (
                          <SelectItem key={hora} value={hora} className="text-white">
                            {hora}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Observações */}
                <div className="space-y-2">
                  <Label htmlFor="observacoes" className="text-white">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={formData.observacoes}
                    onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                    className="bg-slate-800 border-slate-600 text-white"
                    placeholder="Observações adicionais (opcional)..."
                    rows={3}
                  />
                </div>

                {/* Botão de envio */}
                <div className="pt-4">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold px-8 py-4 rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                  >
                    {loading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                      />
                    ) : (
                      <Calendar className="h-5 w-5 mr-2" />
                    )}
                    {loading ? 'Agendando...' : 'Confirmar Agendamento'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Modal de Confirmação */}
      <ConfirmacaoAgendamento
        isOpen={confirmacao.isOpen}
        onClose={fecharConfirmacao}
        tipo={confirmacao.tipo}
        titulo={confirmacao.titulo}
        mensagem={confirmacao.mensagem}
        detalhesAgendamento={confirmacao.detalhes}
      />
    </div>
  );
}
