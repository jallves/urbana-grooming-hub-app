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
import { format, addDays, startOfDay } from 'date-fns';
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

  // Gerar horários disponíveis com base no horário atual e data selecionada
  const gerarHorariosDisponiveis = () => {
    if (!formData.data) return [];
    
    const selectedDate = new Date(formData.data + 'T00:00:00'); // Garantir que seja interpretado como horário local
    const now = new Date();
    const isToday = selectedDate.getDate() === now.getDate() &&
                   selectedDate.getMonth() === now.getMonth() &&
                   selectedDate.getFullYear() === now.getFullYear();

    const horarios = [];
    
    // Horário de funcionamento: 09:00 às 20:00
    for (let hora = 9; hora < 20; hora++) {
      for (let minuto = 0; minuto < 60; minuto += 30) {
        const horaFormatada = `${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}`;
        
        // Se for hoje, só mostrar horários futuros
        if (isToday) {
          const currentHour = now.getHours();
          const currentMinute = now.getMinutes();
          
          if (hora < currentHour || (hora === currentHour && minuto <= currentMinute)) {
            continue;
          }
        }
        
        horarios.push(horaFormatada);
      }
    }
    
    return horarios;
  };

  // Gerar datas disponíveis com base nas regras de negócio
  const gerarDatasDisponiveis = () => {
    const datas = [];
    const now = new Date();
    const currentHour = now.getHours();
    
    // Se já passou das 20h, começar de amanhã
    const startDay = currentHour >= 20 ? 1 : 0;
    
    for (let i = startDay; i <= 30; i++) {
      const data = addDays(startOfDay(now), i); // Usar startOfDay para evitar problemas de timezone
      
      // Não incluir domingos (0 = domingo)
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
      // Criar objeto Date para garantir que a data seja interpretada corretamente
      const selectedDate = new Date(formData.data + 'T00:00:00');
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      
      console.log('Data original:', formData.data);
      console.log('Data formatada:', formattedDate);
      console.log('Dados antes de enviar:', {
        cliente_id: cliente?.id,
        barbeiro_id: formData.barbeiro_id,
        servico_id: formData.servico_id,
        data: formattedDate,
        hora: formData.hora
      });

      const { data: novoAgendamento, error } = await supabase
        .rpc('create_painel_agendamento', {
          cliente_id: cliente?.id,
          barbeiro_id: formData.barbeiro_id,
          servico_id: formData.servico_id,
          data: formattedDate,
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

      console.log('Agendamento criado:', novoAgendamento);

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
          data: format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }),
          hora: formData.hora,
          preco: servico?.preco || 0
        }
      });

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

  const horariosDisponiveis = gerarHorariosDisponiveis();

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
              className="border-gray-800 text-gray-300 bg-transparent rounded-lg px-4 py-3 backdrop-blur-md flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Voltar</span>
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-green-400 via-blue-400 to-green-400 bg-clip-text text-transparent">
                Novo Agendamento
              </h1>
              <p className="text-gray-400 text-base sm:text-lg mt-2">Agende seu próximo corte</p>
            </div>
          </div>

          {/* Formulário */}
          <Card className="bg-gradient-to-br from-gray-900/90 to-gray-950/90 border-gray-800/50 backdrop-blur-md shadow-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold text-white flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-green-600 to-blue-600 rounded-lg">
                  <Scissors className="h-5 w-5 text-white" />
                </div>
                Detalhes do Agendamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Cliente Info */}
                <div className="p-4 bg-gradient-to-r from-green-900/20 to-blue-900/20 rounded-lg border border-green-800/30">
                  <div className="flex items-center gap-3 mb-2">
                    <User className="h-5 w-5 text-green-400" />
                    <span className="text-green-400 font-medium">Cliente</span>
                  </div>
                  <p className="text-white font-semibold text-lg">{cliente.nome}</p>
                  <p className="text-gray-400">{cliente.email}</p>
                </div>

                {/* Serviço */}
                <div className="space-y-2">
                  <Label htmlFor="servico" className="text-gray-300 font-medium">
                    Serviço *
                  </Label>
                  <Select value={formData.servico_id} onValueChange={(value) => setFormData(prev => ({ ...prev, servico_id: value }))}>
                    <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                      <SelectValue placeholder="Selecione um serviço" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      {servicos.map((servico) => (
                        <SelectItem key={servico.id} value={servico.id} className="text-white">
                          {servico.nome} - R$ {servico.preco.toFixed(2)} ({servico.duracao}min)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Barbeiro */}
                <div className="space-y-2">
                  <Label htmlFor="barbeiro" className="text-gray-300 font-medium">
                    Barbeiro *
                  </Label>
                  <Select value={formData.barbeiro_id} onValueChange={(value) => setFormData(prev => ({ ...prev, barbeiro_id: value }))}>
                    <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                      <SelectValue placeholder="Selecione um barbeiro" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
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
                  <Label htmlFor="data" className="text-gray-300 font-medium">
                    Data *
                  </Label>
                  <Select 
                    value={formData.data} 
                    onValueChange={(value) => {
                      console.log('Data selecionada:', value);
                      setFormData(prev => ({ ...prev, data: value, hora: '' })); // Limpar hora ao mudar data
                    }}
                  >
                    <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                      <SelectValue placeholder="Selecione uma data" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
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
                  <Label htmlFor="hora" className="text-gray-300 font-medium">
                    Horário *
                  </Label>
                  <Select 
                    value={formData.hora} 
                    onValueChange={(value) => {
                      console.log('Horário selecionado:', value);
                      setFormData(prev => ({ ...prev, hora: value }));
                    }}
                    disabled={!formData.data}
                  >
                    <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                      <SelectValue 
                        placeholder={
                          !formData.data 
                            ? "Selecione uma data primeiro" 
                            : horariosDisponiveis.length === 0 
                              ? "Nenhum horário disponível" 
                              : "Selecione um horário"
                        } 
                      />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      {horariosDisponiveis.length > 0 ? (
                        horariosDisponiveis.map((hora) => (
                          <SelectItem key={hora} value={hora} className="text-white">
                            {hora}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-2 text-gray-500 text-sm text-center">
                          {!formData.data ? 'Selecione uma data primeiro' : 'Nenhum horário disponível'}
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Observações */}
                <div className="space-y-2">
                  <Label htmlFor="observacoes" className="text-gray-300 font-medium">
                    Observações
                  </Label>
                  <Textarea
                    id="observacoes"
                    value={formData.observacoes}
                    onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                    placeholder="Digite suas observações (opcional)"
                    className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-500"
                    rows={3}
                  />
                </div>

                {/* Botões */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/painel-cliente/dashboard')}
                    className="border-gray-700 text-gray-300 bg-transparent hover:bg-gray-800/50"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-medium px-8 py-3 rounded-lg shadow-xl flex-1"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Agendando...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Plus className="w-5 h-5" />
                        Confirmar Agendamento
                      </div>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Modal de Confirmação */}
          <ConfirmacaoAgendamento
            isOpen={confirmacao.isOpen}
            onClose={fecharConfirmacao}
            tipo={confirmacao.tipo}
            titulo={confirmacao.titulo}
            mensagem={confirmacao.mensagem}
            detalhesAgendamento={confirmacao.detalhes}
          />
        </motion.div>
      </div>
    </div>
  );
}
