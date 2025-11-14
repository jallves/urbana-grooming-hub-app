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
        
        // Se for hoje, só mostrar horários com pelo menos 10 minutos de antecedência
        if (isToday) {
          const currentHour = now.getHours();
          const currentMinute = now.getMinutes();
          
          // Criar data/hora para comparação
          const slotTime = new Date(now);
          slotTime.setHours(hora, minuto, 0, 0);
          
          // Adicionar 10 minutos de buffer ao horário atual
          const minTime = new Date(now.getTime() + 10 * 60 * 1000);
          
          if (slotTime < minTime) {
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
      
      // Notificar barbeiro via Realtime
      try {
        const channel = supabase.channel(`barbearia:${formData.barbeiro_id}`)
        await channel.send({
          type: 'broadcast',
          event: 'NEW_APPOINTMENT',
          payload: {
            tipo: 'NOVO_AGENDAMENTO',
            agendamento_id: novoAgendamento,
            cliente_nome: cliente?.nome,
            servico_nome: servico?.nome,
            data: formattedDate,
            hora: formData.hora,
            timestamp: new Date().toISOString()
          }
        })
        console.log('✅ Notificação enviada ao barbeiro');
      } catch (notifError) {
        console.error('⚠️ Erro ao notificar barbeiro:', notifError);
        // Não falhar o agendamento por erro de notificação
      }
      
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
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-urbana-gold border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const horariosDisponiveis = gerarHorariosDisponiveis();

  return (
    <div className="min-h-screen w-full">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-urbana-gold/5 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-urbana-gold/5 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
      </div>
      
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
              className="border-urbana-gold/30 text-urbana-light bg-urbana-black/40 backdrop-blur-xl hover:bg-urbana-gold/10 hover:border-urbana-gold rounded-lg px-4 py-3 flex items-center gap-2 transition-all"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Voltar</span>
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-urbana-gold drop-shadow-lg">
                Novo Agendamento
              </h1>
              <p className="text-urbana-light/70 text-base sm:text-lg mt-2">Agende seu próximo corte</p>
            </div>
          </div>

          {/* Formulário */}
          <Card className="bg-urbana-black/40 border-urbana-gold/20 backdrop-blur-2xl shadow-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold text-urbana-light flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-urbana-gold to-urbana-gold-vibrant rounded-lg shadow-lg shadow-urbana-gold/30">
                  <Scissors className="h-5 w-5 text-urbana-black" />
                </div>
                Detalhes do Agendamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Cliente Info */}
                <div className="p-4 bg-urbana-gold/10 backdrop-blur-sm rounded-lg border border-urbana-gold/30">
                  <div className="flex items-center gap-3 mb-2">
                    <User className="h-5 w-5 text-urbana-gold" />
                    <span className="text-urbana-gold font-medium">Cliente</span>
                  </div>
                  <p className="text-urbana-light font-semibold text-lg">{cliente.nome}</p>
                  <p className="text-urbana-light/70">{cliente.email}</p>
                </div>

                {/* Serviço */}
                <div className="space-y-2">
                  <Label htmlFor="servico" className="text-urbana-light font-medium">
                    Serviço *
                  </Label>
                  <Select value={formData.servico_id} onValueChange={(value) => setFormData(prev => ({ ...prev, servico_id: value }))}>
                    <SelectTrigger className="bg-urbana-black/50 backdrop-blur-sm border-urbana-gold/30 text-urbana-light hover:border-urbana-gold transition-colors">
                      <SelectValue placeholder="Selecione um serviço" />
                    </SelectTrigger>
                    <SelectContent className="bg-urbana-black/95 backdrop-blur-xl border-urbana-gold/30">
                      {servicos.map((servico) => (
                        <SelectItem key={servico.id} value={servico.id} className="text-urbana-light hover:bg-urbana-gold/20 focus:bg-urbana-gold/20">
                          {servico.nome} - R$ {servico.preco.toFixed(2)} ({servico.duracao}min)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Barbeiro */}
                <div className="space-y-2">
                  <Label htmlFor="barbeiro" className="text-urbana-light font-medium">
                    Barbeiro *
                  </Label>
                  <Select value={formData.barbeiro_id} onValueChange={(value) => setFormData(prev => ({ ...prev, barbeiro_id: value }))}>
                    <SelectTrigger className="bg-urbana-black/50 backdrop-blur-sm border-urbana-gold/30 text-urbana-light hover:border-urbana-gold transition-colors">
                      <SelectValue placeholder="Selecione um barbeiro" />
                    </SelectTrigger>
                    <SelectContent className="bg-urbana-black/95 backdrop-blur-xl border-urbana-gold/30">
                      {barbeiros.map((barbeiro) => (
                        <SelectItem key={barbeiro.id} value={barbeiro.id} className="text-urbana-light hover:bg-urbana-gold/20 focus:bg-urbana-gold/20">
                          {barbeiro.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Data */}
                <div className="space-y-2">
                  <Label htmlFor="data" className="text-urbana-light font-medium">
                    Data *
                  </Label>
                  <Select 
                    value={formData.data} 
                    onValueChange={(value) => {
                      console.log('Data selecionada:', value);
                      setFormData(prev => ({ ...prev, data: value, hora: '' }));
                    }}
                  >
                    <SelectTrigger className="bg-urbana-black/50 backdrop-blur-sm border-urbana-gold/30 text-urbana-light hover:border-urbana-gold transition-colors">
                      <SelectValue placeholder="Selecione uma data" />
                    </SelectTrigger>
                    <SelectContent className="bg-urbana-black/95 backdrop-blur-xl border-urbana-gold/30">
                      {gerarDatasDisponiveis().map((data) => (
                        <SelectItem key={data.value} value={data.value} className="text-urbana-light hover:bg-urbana-gold/20 focus:bg-urbana-gold/20">
                          {data.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Hora */}
                <div className="space-y-2">
                  <Label htmlFor="hora" className="text-urbana-light font-medium">
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
                    <SelectTrigger className="bg-urbana-black/50 backdrop-blur-sm border-urbana-gold/30 text-urbana-light hover:border-urbana-gold transition-colors disabled:opacity-50">
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
                    <SelectContent className="bg-urbana-black/95 backdrop-blur-xl border-urbana-gold/30">
                      {horariosDisponiveis.length > 0 ? (
                        horariosDisponiveis.map((hora) => (
                          <SelectItem key={hora} value={hora} className="text-urbana-light hover:bg-urbana-gold/20 focus:bg-urbana-gold/20">
                            {hora}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-2 text-urbana-light/50 text-sm text-center">
                          {!formData.data ? 'Selecione uma data primeiro' : 'Nenhum horário disponível'}
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Observações */}
                <div className="space-y-2">
                  <Label htmlFor="observacoes" className="text-urbana-light font-medium">
                    Observações
                  </Label>
                  <Textarea
                    id="observacoes"
                    value={formData.observacoes}
                    onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                    placeholder="Digite suas observações (opcional)"
                    className="bg-urbana-black/50 backdrop-blur-sm border-urbana-gold/30 text-urbana-light placeholder-urbana-light/40 hover:border-urbana-gold transition-colors"
                    rows={3}
                  />
                </div>

                {/* Botões */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/painel-cliente/dashboard')}
                    className="border-urbana-gold/30 text-urbana-light bg-urbana-black/50 backdrop-blur-sm hover:bg-urbana-gold/10 hover:border-urbana-gold transition-all"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-gradient-to-r from-urbana-gold to-urbana-gold-vibrant hover:from-urbana-gold-vibrant hover:to-urbana-gold text-urbana-black font-bold px-8 py-3 rounded-lg shadow-xl shadow-urbana-gold/30 flex-1 transition-all disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-urbana-black border-t-transparent rounded-full animate-spin" />
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
