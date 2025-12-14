
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, Save, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAppointmentValidation } from '@/hooks/useAppointmentValidation';
import { sendAppointmentUpdateEmail } from '@/hooks/useSendAppointmentUpdateEmail';

interface Agendamento {
  id: string;
  data: string;
  hora: string;
  status: string;
  barbeiro_id?: string;
  servico_id?: string;
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

interface EditAgendamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  agendamento: Agendamento | null;
  onUpdate: () => void;
}

export default function EditAgendamentoModal({ isOpen, onClose, agendamento, onUpdate }: EditAgendamentoModalProps) {
  const { toast } = useToast();
  const { getAvailableTimeSlots } = useAppointmentValidation();
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<{ time: string; available: boolean }[]>([]);
  const [currentBarberId, setCurrentBarberId] = useState<string>('');
  const [currentServiceDuration, setCurrentServiceDuration] = useState<number>(30);
  
  const [formData, setFormData] = useState({
    data: '',
    hora: '',
    barbeiro_id: '',
    servico_id: ''
  });

  // Carregar dados do agendamento quando abrir
  useEffect(() => {
    const loadAgendamentoData = async () => {
      if (agendamento && isOpen) {
        // Buscar o barbeiro_id e servico_id do agendamento
        const { data } = await supabase
          .from('painel_agendamentos')
          .select('barbeiro_id, servico_id, painel_servicos(duracao)')
          .eq('id', agendamento.id)
          .single();
        
        if (data) {
          setCurrentBarberId(data.barbeiro_id);
          setCurrentServiceDuration(data.painel_servicos?.duracao || 30);
          setFormData({
            data: agendamento.data,
            hora: agendamento.hora,
            barbeiro_id: '',
            servico_id: ''
          });
        }
      }
    };
    
    loadAgendamentoData();
  }, [agendamento, isOpen]);

  // Buscar horários disponíveis quando data, barbeiro ou serviço mudar
  useEffect(() => {
    const fetchAvailableSlots = async () => {
      if (!formData.data || !agendamento) return;
      
      const barberId = formData.barbeiro_id || currentBarberId;
      if (!barberId) return;
      
      // Verificar duração do serviço (usar novo se selecionado, senão usar atual)
      let duration = currentServiceDuration;
      if (formData.servico_id) {
        const selectedService = servicos.find(s => s.id === formData.servico_id);
        if (selectedService) {
          duration = selectedService.duracao;
        }
      }
      
      setLoadingSlots(true);
      try {
        const selectedDate = new Date(formData.data + 'T12:00:00');
        const slots = await getAvailableTimeSlots(barberId, selectedDate, duration);
        
        // Filtrar apenas horários disponíveis
        // Também incluir o horário atual do agendamento se for o mesmo dia
        const filteredSlots = slots.filter(slot => {
          if (slot.available) return true;
          // Permitir o horário atual do agendamento (já está reservado para este agendamento)
          if (agendamento.data === formData.data && slot.time === agendamento.hora) {
            return true;
          }
          return false;
        }).map(slot => ({
          ...slot,
          available: slot.available || (agendamento.data === formData.data && slot.time === agendamento.hora)
        }));
        
        setAvailableTimeSlots(filteredSlots);
        
        // Se o horário selecionado não está mais disponível, limpar
        if (formData.hora && !filteredSlots.find(s => s.time === formData.hora && s.available)) {
          setFormData(prev => ({ ...prev, hora: '' }));
        }
      } catch (error) {
        console.error('Erro ao buscar horários:', error);
        setAvailableTimeSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };
    
    fetchAvailableSlots();
  }, [formData.data, formData.barbeiro_id, formData.servico_id, currentBarberId, currentServiceDuration, agendamento, servicos, getAvailableTimeSlots]);

  useEffect(() => {
    if (isOpen) {
      fetchBarbeiros();
      fetchServicos();
    }
  }, [isOpen]);

  const fetchBarbeiros = async () => {
    const { data } = await supabase
      .from('painel_barbeiros')
      .select('*')
      .eq('is_active', true)
      .eq('available_for_booking', true);
    if (data) setBarbeiros(data);
  };

  const fetchServicos = async () => {
    const { data } = await supabase
      .from('painel_servicos')
      .select('*, service_staff!inner(staff_id)')
      .eq('is_active', true)
      .gt('preco', 0);
    
    if (data) {
      // Remove duplicates (serviços com múltiplos barbeiros)
      const uniqueServices = data.reduce((acc: any[], curr: any) => {
        if (!acc.find(s => s.id === curr.id)) {
          acc.push(curr);
        }
        return acc;
      }, []);
      setServicos(uniqueServices);
    }
  };

  // Gerar datas disponíveis com base nas regras de negócio
  const gerarDatasDisponiveis = () => {
    const datas = [];
    const now = new Date();
    const currentHour = now.getHours();
    
    // Se já passou das 20h, começar de amanhã
    const startDay = currentHour >= 20 ? 1 : 0;
    
    for (let i = startDay; i <= 30; i++) {
      const data = addDays(new Date(), i);
      
      // Domingo agora funciona (09:00-13:00)
      datas.push({
        value: format(data, 'yyyy-MM-dd'),
        label: format(data, "EEEE, dd 'de' MMMM", { locale: ptBR })
      });
    }
    
    return datas;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Guardar dados anteriores para o e-mail de atualização
      const previousData = {
        date: agendamento?.data,
        time: agendamento?.hora?.substring(0, 5),
        staffName: agendamento?.painel_barbeiros?.nome,
        serviceName: agendamento?.painel_servicos?.nome
      };

      const updateData: any = {
        data: formData.data,
        hora: formData.hora
      };

      // Só incluir barbeiro_id e servico_id se foram selecionados
      if (formData.barbeiro_id) {
        updateData.barbeiro_id = formData.barbeiro_id;
      }
      if (formData.servico_id) {
        updateData.servico_id = formData.servico_id;
      }

      const { error } = await supabase
        .from('painel_agendamentos')
        .update(updateData)
        .eq('id', agendamento?.id);

      if (error) throw error;

      // Determinar tipo de atualização
      let updateType: 'reschedule' | 'change_barber' | 'change_service' | 'general' = 'general';
      if (formData.data !== previousData.date || formData.hora !== previousData.time) {
        updateType = 'reschedule';
      } else if (formData.barbeiro_id) {
        updateType = 'change_barber';
      } else if (formData.servico_id) {
        updateType = 'change_service';
      }

      // Enviar e-mail de atualização
      console.log('📧 [EditAgendamentoModal] Enviando e-mail de atualização...');
      try {
        await sendAppointmentUpdateEmail({
          appointmentId: agendamento!.id,
          previousData,
          updateType,
          updatedBy: 'client'
        });
      } catch (emailError) {
        console.error('⚠️ Erro ao enviar e-mail de atualização:', emailError);
      }

      toast({
        title: "✅ Alterado com sucesso!",
        description: "Seu agendamento foi atualizado com sucesso.",
        duration: 4000,
      });

      onUpdate();
      onClose();
    } catch (error) {
      console.error('Erro ao atualizar agendamento:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar o agendamento.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!agendamento) return null;

  const datasDisponiveis = gerarDatasDisponiveis();
  const horariosDisponiveis = availableTimeSlots.filter(s => s.available).map(s => s.time);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Editar Agendamento
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white flex items-center gap-2">
                <Calendar className="h-4 w-4 text-purple-400" />
                Data
              </Label>
              <Select 
                value={formData.data} 
                onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, data: value, hora: '' })); // Limpar hora ao mudar data
                }}
              >
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                  <SelectValue placeholder="Selecione uma data" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  {datasDisponiveis.map((data) => (
                    <SelectItem key={data.value} value={data.value} className="text-white">
                      {data.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-white flex items-center gap-2">
                <Clock className="h-4 w-4 text-purple-400" />
                Hora
              </Label>
              <Select 
                value={formData.hora} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, hora: value }))}
                disabled={!formData.data || loadingSlots}
              >
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                  {loadingSlots ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Carregando...</span>
                    </div>
                  ) : (
                    <SelectValue 
                      placeholder={
                        !formData.data 
                          ? "Selecione uma data primeiro" 
                          : horariosDisponiveis.length === 0 
                            ? "Nenhum horário disponível" 
                            : "Selecione um horário"
                      } 
                    />
                  )}
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
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
          </div>

          <div className="space-y-2">
            <Label className="text-white">Barbeiro (Opcional)</Label>
            <Select
              value={formData.barbeiro_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, barbeiro_id: value }))}
            >
              <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                <SelectValue placeholder="Manter barbeiro atual ou selecionar novo" />
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

          <div className="space-y-2">
            <Label className="text-white">Serviço (Opcional)</Label>
            <Select
              value={formData.servico_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, servico_id: value }))}
            >
              <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                <SelectValue placeholder="Manter serviço atual ou selecionar novo" />
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

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
            >
              {loading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-slate-600 text-white hover:bg-slate-800"
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
