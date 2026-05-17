import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, Save, X, Loader2, User, Scissors, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, addDays, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { sendAppointmentUpdateEmail } from '@/hooks/useSendAppointmentUpdateEmail';
import { cn } from '@/lib/utils';
import ClientBookingExtrasModal, { ClientExtraService } from '@/components/painel-cliente/ClientBookingExtrasModal';

interface Agendamento {
  id: string;
  data: string;
  hora: string;
  status: string;
  barbeiro_id?: string;
  servico_id?: string;
  servicos_extras?: Array<{ id?: string; nome?: string; preco?: number; duracao?: number; quantidade?: number }> | null;
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
  staff_id?: string;
}

interface Servico {
  id: string;
  nome: string;
  preco: number;
  duracao: number;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

interface EditAgendamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  agendamento: Agendamento | null;
  onUpdate: () => void;
}

export default function EditAgendamentoModal({ isOpen, onClose, agendamento, onUpdate }: EditAgendamentoModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedBarbeiroId, setSelectedBarbeiroId] = useState<string>('');
  const [selectedServicoId, setSelectedServicoId] = useState<string>('');
  const [currentBarbeiroId, setCurrentBarbeiroId] = useState<string>('');
  const [currentServicoId, setCurrentServicoId] = useState<string>('');
  const [currentServiceDuration, setCurrentServiceDuration] = useState<number>(30);
  const [extraServices, setExtraServices] = useState<ClientExtraService[]>([]);
  const [showExtrasModal, setShowExtrasModal] = useState(false);

  // Carregar dados do agendamento quando abrir
  useEffect(() => {
    const loadAgendamentoData = async () => {
      if (agendamento && isOpen) {
        const { data } = await supabase
          .from('painel_agendamentos')
          .select('barbeiro_id, servico_id, servicos_extras, painel_servicos(duracao)')
          .eq('id', agendamento.id)
          .maybeSingle();
        
        if (data) {
          setCurrentBarbeiroId(data.barbeiro_id);
          setCurrentServicoId(data.servico_id);
          setCurrentServiceDuration(data.painel_servicos?.duracao || 30);
          setSelectedDate(agendamento.data);
          setSelectedTime(agendamento.hora?.substring(0, 5) || '');
          setSelectedBarbeiroId(''); // Vazio = manter atual
          setSelectedServicoId(''); // Vazio = manter atual

          const grouped: Record<string, ClientExtraService> = {};
          const rawExtras = Array.isArray((data as any).servicos_extras) ? (data as any).servicos_extras : [];
          rawExtras.forEach((extra: any) => {
            const key = extra?.id || extra?.nome;
            if (!key) return;
            if (!grouped[key]) {
              grouped[key] = {
                id: extra.id || key,
                nome: extra.nome || 'Extra',
                preco: Number(extra.preco) || 0,
                duracao: Number(extra.duracao) || 0,
                quantidade: 0,
              };
            }
            grouped[key].quantidade = (grouped[key].quantidade || 0) + Math.max(1, Number(extra?.quantidade) || 1);
          });
          setExtraServices(Object.values(grouped));
        }
      }
    };
    
    loadAgendamentoData();
  }, [agendamento, isOpen]);

  // Carregar barbeiros e serviços
  useEffect(() => {
    if (isOpen) {
      fetchBarbeiros();
      fetchServicos();
    }
  }, [isOpen]);

  // Buscar horários disponíveis quando data, barbeiro ou serviço mudar
  useEffect(() => {
    if (selectedDate && (selectedBarbeiroId || currentBarbeiroId)) {
      fetchAvailableSlots();
    }
  }, [selectedDate, selectedBarbeiroId, selectedServicoId, currentBarbeiroId, currentServicoId]);

  const fetchBarbeiros = async () => {
    const { data } = await supabase
      .from('painel_barbeiros')
      .select('id, nome, staff_id')
      .eq('is_active', true)
      .eq('ativo', true);
    if (data) setBarbeiros(data);
  };

  const fetchServicos = async () => {
    const { data } = await supabase
      .from('painel_servicos')
      .select('id, nome, preco, duracao')
      .eq('is_active', true)
      .gt('preco', 0);
    
    if (data) setServicos(data);
  };

  const fetchAvailableSlots = useCallback(async () => {
    if (!selectedDate) return;
    
    const barbeiroId = selectedBarbeiroId || currentBarbeiroId;
    if (!barbeiroId) return;

    // Determinar duração do serviço considerando extras selecionados
    let duration = currentServiceDuration;
    if (selectedServicoId) {
      const service = servicos.find(s => s.id === selectedServicoId);
      if (service) duration = service.duracao;
    }
    const extrasDuration = extraServices.reduce(
      (total, extra) => total + (Number(extra.duracao) || 0) * Math.max(1, extra.quantidade || 1),
      0
    );
    duration += extrasDuration;

    setLoadingSlots(true);
    console.log('🕐 [EditAgendamentoModal] Buscando horários:', {
      barbeiroId,
      date: selectedDate,
      duration,
      excludeId: agendamento?.id
    });

    try {
      const date = new Date(selectedDate + 'T12:00:00');
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const isCurrentDay = isToday(date);

      // Configurar slots de 08:30 às 20:00
      const allSlots: TimeSlot[] = [];
      const FIRST_SLOT_HOUR = 8;
      const FIRST_SLOT_MINUTE = 30;
      const CLOSING_HOUR = 20;

      const closingTotalMinutes = CLOSING_HOUR * 60;
      const lastSlotTotalMinutes = closingTotalMinutes - duration;

      for (let hour = FIRST_SLOT_HOUR; hour < CLOSING_HOUR; hour++) {
        for (let minute of [0, 30]) {
          if (hour === FIRST_SLOT_HOUR && minute < FIRST_SLOT_MINUTE) {
            continue;
          }

          const slotTotalMinutes = hour * 60 + minute;

          if (slotTotalMinutes > lastSlotTotalMinutes) {
            continue;
          }

          // Se for hoje, só incluir horários futuros (15 min de antecedência)
          if (isCurrentDay) {
            const currentTotalMinutes = currentHour * 60 + currentMinute;
            if (slotTotalMinutes <= currentTotalMinutes + 15) {
              continue;
            }
          }

          const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          allSlots.push({ time: timeString, available: false });
        }
      }

      // Verificar disponibilidade calculando sobreposição real com a duração
      // de cada agendamento existente + serviços extras (mesma regra do
      // ClientDateTimePicker, igual a um novo agendamento).
      const { data: existingAppointments, error: apptErr } = await supabase
        .from('painel_agendamentos')
        .select('id, hora, servicos_extras, painel_servicos!inner(duracao)')
        .eq('barbeiro_id', barbeiroId)
        .eq('data', selectedDate)
        .neq('status', 'cancelado');

      if (apptErr) {
        console.error('❌ Erro ao buscar agendamentos do dia:', apptErr);
      }

      // Bloqueios de disponibilidade (folgas / fechamento)
      let staffIdMirror: string | null = null;
      const { data: barbeiroData } = await supabase
        .from('painel_barbeiros')
        .select('staff_id')
        .eq('id', barbeiroId)
        .maybeSingle();
      if (barbeiroData?.staff_id) staffIdMirror = barbeiroData.staff_id;

      const idsForAvailability = [barbeiroId, staffIdMirror].filter(Boolean) as string[];
      const { data: blocks } = await supabase
        .from('barber_availability')
        .select('start_time, end_time, is_available')
        .in('barber_id', idsForAvailability)
        .eq('date', selectedDate)
        .eq('is_available', false);

      const toMinutes = (t: string) => {
        const [h, m] = t.split(':').map(Number);
        return h * 60 + (m || 0);
      };

      const slotsWithAvailability = allSlots.map((slot) => {
        const mins = toMinutes(slot.time);
        const slotEnd = mins + duration;
        let available = true;

        if (existingAppointments) {
          for (const appt of existingAppointments as any[]) {
            // Excluir o próprio agendamento sendo editado para não
            // bloquear seus próprios slots.
            if (agendamento?.id && appt.id === agendamento.id) continue;
            const apptStart = toMinutes(appt.hora);
            const baseDur = (appt.painel_servicos?.duracao as number) || 60;
            const extras = Array.isArray(appt.servicos_extras)
              ? appt.servicos_extras.reduce(
                  (s: number, e: any) => s + (Number(e?.duracao) || 0),
                  0
                )
              : 0;
            const apptEnd = apptStart + baseDur + extras;
            if (mins < apptEnd && slotEnd > apptStart) {
              available = false;
              break;
            }
          }
        }

        if (available && blocks?.length) {
          for (const b of blocks) {
            const bStart = toMinutes(b.start_time as string);
            const bEnd = toMinutes(b.end_time as string);
            if (mins < bEnd && slotEnd > bStart) {
              available = false;
              break;
            }
          }
        }

        return { ...slot, available };
      });

      const availableCount = slotsWithAvailability.filter(s => s.available).length;
      console.log('✅ [EditAgendamentoModal] Slots disponíveis:', availableCount);

      setAvailableSlots(slotsWithAvailability);

      // Regra: na edição a disponibilidade segue exatamente a regra de
      // um novo agendamento. Se o slot selecionado não estiver disponível
      // (mesmo que seja o horário atual do agendamento), limpamos a seleção
      // para o cliente escolher um horário realmente livre.
      if (selectedTime) {
        const isAvailable = slotsWithAvailability.find(s => s.time === selectedTime && s.available);
        if (!isAvailable) {
          setSelectedTime('');
        }
      }
    } catch (error) {
      console.error('Erro ao buscar horários:', error);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [selectedDate, selectedBarbeiroId, selectedServicoId, currentBarbeiroId, currentServiceDuration, agendamento, servicos, extraServices]);

  // Gerar datas disponíveis
  const gerarDatasDisponiveis = () => {
    const datas = [];
    const now = new Date();
    const currentHour = now.getHours();
    
    const startDay = currentHour >= 20 ? 1 : 0;
    
    for (let i = startDay; i <= 30; i++) {
      const data = addDays(new Date(), i);
      datas.push({
        value: format(data, 'yyyy-MM-dd'),
        label: format(data, "EEEE, dd 'de' MMMM", { locale: ptBR })
      });
    }
    
    return datas;
  };

  const handleDateChange = (value: string) => {
    setSelectedDate(value);
    setSelectedTime(''); // Limpar horário ao mudar data
  };

  const handleBarbeiroChange = (value: string) => {
    setSelectedBarbeiroId(value);
    setSelectedTime(''); // Limpar horário ao mudar barbeiro
  };

  const handleServicoChange = (value: string) => {
    setSelectedServicoId(value);
    setSelectedTime(''); // Limpar horário ao mudar serviço
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTime) {
      toast({
        variant: "destructive",
        title: "Selecione um horário",
        description: "Por favor, selecione um horário disponível.",
      });
      return;
    }
    
    setLoading(true);

    try {
      const previousData = {
        date: agendamento?.data,
        time: agendamento?.hora?.substring(0, 5),
        staffName: agendamento?.painel_barbeiros?.nome,
        serviceName: agendamento?.painel_servicos?.nome
      };

      const updateData: any = {
        data: selectedDate,
        hora: selectedTime + ':00'
      };

      const expandedExtras = extraServices.flatMap((extra) => {
        const qty = Math.max(1, extra.quantidade || 1);
        return Array.from({ length: qty }, () => ({
          id: extra.id,
          nome: extra.nome,
          preco: Number(extra.preco) || 0,
          duracao: Number(extra.duracao) || 0,
        }));
      });

      if (selectedBarbeiroId) {
        updateData.barbeiro_id = selectedBarbeiroId;
      }
      if (selectedServicoId) {
        updateData.servico_id = selectedServicoId;
      }

      let result: any = null;
      let invokeError: any = null;
      try {
        const resp = await supabase.functions.invoke('client-update-appointment', {
          body: {
            appointmentId: agendamento?.id,
            serviceId: updateData.servico_id || currentServicoId,
            barberId: updateData.barbeiro_id || currentBarbeiroId,
            date: updateData.data,
            time: selectedTime,
            extras: expandedExtras,
          },
        });
        result = resp.data;
        invokeError = resp.error;
      } catch (e: any) {
        invokeError = e;
      }

      // Extrai mensagem real do corpo (ex: 409 com { error })
      if (invokeError && !result) {
        try {
          const ctx = invokeError?.context;
          if (ctx && typeof ctx.json === 'function') {
            result = await ctx.json();
          } else if (ctx && typeof ctx.text === 'function') {
            const txt = await ctx.text();
            try { result = JSON.parse(txt); } catch { result = { error: txt }; }
          }
        } catch { /* ignore */ }
      }

      if (!result?.success) {
        if (result?.code === 'slot_unavailable' || result?.code === 'slot_blocked') {
          setSelectedTime('');
        }
        toast({
          variant: "destructive",
          title: "Horário indisponível",
          description: result?.error || invokeError?.message || 'Não foi possível atualizar o agendamento.',
        });
        await fetchAvailableSlots();
        return;
      }

      // Determinar tipo de atualização
      let updateType: 'reschedule' | 'change_barber' | 'change_service' | 'general' = 'general';
      if (selectedDate !== previousData.date || selectedTime !== previousData.time) {
        updateType = 'reschedule';
      } else if (selectedBarbeiroId) {
        updateType = 'change_barber';
      } else if (selectedServicoId) {
        updateType = 'change_service';
      }

      // Enviar e-mail de atualização
      try {
        await sendAppointmentUpdateEmail({
          appointmentId: agendamento!.id,
          previousData,
          updateType,
          updatedBy: 'client'
        });
      } catch (emailError) {
        console.error('⚠️ Erro ao enviar e-mail:', emailError);
      }

      toast({
        title: "✅ Alterado com sucesso!",
        description: "Seu agendamento foi atualizado.",
        duration: 4000,
      });

      onUpdate();
      onClose();
    } catch (error) {
      console.error('Erro ao atualizar agendamento:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível atualizar o agendamento.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!agendamento) return null;

  const datasDisponiveis = gerarDatasDisponiveis();
  const availableSlotsFiltered = availableSlots.filter(s => s.available);
  const effectiveBarbeiroId = selectedBarbeiroId || currentBarbeiroId;
  const selectedBarbeiro = barbeiros.find(b => b.id === effectiveBarbeiroId) || 
                          { nome: agendamento.painel_barbeiros.nome };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700 text-white">
        <DialogHeader className="pb-4 border-b border-slate-700">
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Editar Agendamento
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {/* Barbeiro */}
          <div className="space-y-2">
            <Label className="text-white flex items-center gap-2 text-sm font-medium">
              <User className="h-4 w-4 text-purple-400" />
              Barbeiro
            </Label>
            <Select value={selectedBarbeiroId} onValueChange={handleBarbeiroChange}>
              <SelectTrigger className="h-11 bg-slate-800 border-slate-600 text-white">
                <SelectValue placeholder={`Manter: ${agendamento.painel_barbeiros.nome}`} />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                {barbeiros.map((barbeiro) => (
                  <SelectItem key={barbeiro.id} value={barbeiro.id} className="text-white">
                    {barbeiro.nome}
                    {barbeiro.id === currentBarbeiroId && ' (atual)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Serviço */}
          <div className="space-y-2">
            <Label className="text-white flex items-center gap-2 text-sm font-medium">
              <Scissors className="h-4 w-4 text-purple-400" />
              Serviço
            </Label>
            <Select value={selectedServicoId} onValueChange={handleServicoChange}>
              <SelectTrigger className="h-11 bg-slate-800 border-slate-600 text-white">
                <SelectValue placeholder={`Manter: ${agendamento.painel_servicos.nome}`} />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                {servicos.map((servico) => (
                  <SelectItem key={servico.id} value={servico.id} className="text-white">
                    {servico.nome} - R$ {servico.preco.toFixed(2)} ({servico.duracao}min)
                    {servico.id === currentServicoId && ' (atual)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Data */}
          <div className="space-y-2">
            <Label className="text-white flex items-center gap-2 text-sm font-medium">
              <Calendar className="h-4 w-4 text-purple-400" />
              Data
            </Label>
            <Select value={selectedDate} onValueChange={handleDateChange}>
              <SelectTrigger className="h-11 bg-slate-800 border-slate-600 text-white">
                <SelectValue placeholder="Selecione uma data" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600 max-h-60">
                {datasDisponiveis.map((data) => (
                  <SelectItem key={data.value} value={data.value} className="text-white">
                    {data.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Horários Disponíveis */}
          <div className="space-y-2">
            <Label className="text-white flex items-center gap-2 text-sm font-medium">
              <Clock className="h-4 w-4 text-purple-400" />
              Horário Disponível
              {loadingSlots && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
            </Label>
            
            {!selectedDate ? (
              <div className="flex items-center gap-2 p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                <AlertCircle className="h-4 w-4 text-slate-400" />
                <span className="text-sm text-slate-400">
                  Selecione uma data para ver horários disponíveis
                </span>
              </div>
            ) : loadingSlots ? (
              <div className="flex items-center justify-center p-6">
                <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
              </div>
            ) : availableSlotsFiltered.length === 0 ? (
              <div className="flex items-center gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <span className="text-sm text-red-400">
                  Nenhum horário disponível para esta data. Tente outra data.
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                {availableSlotsFiltered.map((slot) => (
                  <button
                    key={slot.time}
                    type="button"
                    onClick={() => setSelectedTime(slot.time)}
                    className={cn(
                      "h-10 px-2 text-sm rounded-lg font-medium transition-all duration-200",
                      selectedTime === slot.time 
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white ring-2 ring-purple-400 ring-offset-2 ring-offset-slate-900" 
                        : "bg-slate-800 text-slate-200 border border-slate-600 hover:border-purple-400/50 hover:bg-slate-700"
                    )}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            )}
            
            {selectedTime && (
              <div className="flex items-center gap-2 mt-2 text-sm text-purple-400">
                <CheckCircle2 className="h-4 w-4" />
                Horário selecionado: <span className="font-semibold">{selectedTime}</span>
              </div>
            )}
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4 border-t border-slate-700">
            <Button
              type="submit"
              disabled={loading || !selectedTime}
              className="flex-1 h-11 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
            
            <Button
              type="button"
              onClick={onClose}
              className="flex-1 h-11 bg-slate-700 hover:bg-slate-600 text-white border-0"
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
