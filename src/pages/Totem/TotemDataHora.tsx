import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Calendar, Clock } from 'lucide-react';
import { format, addDays, startOfToday, addMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { TotemLayout, TotemContentContainer, TotemGrid } from '@/components/totem/TotemLayout';
import { TotemCard, TotemCardTitle } from '@/components/totem/TotemCard';
import { TotemButton } from '@/components/totem/TotemButton';
import { useUnifiedAppointmentValidation } from '@/hooks/useUnifiedAppointmentValidation';
import { sendConfirmationEmailDirect } from '@/hooks/useSendAppointmentEmail';

interface TimeSlot {
  hora: string;
  disponivel: boolean;
}

/**
 * TotemDataHora - Tela de seleção de data e horário
 * Implementa o design system completo com glassmorphism
 */
const TotemDataHora: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { client, service, barber } = location.state || {};
  
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingDates, setLoadingDates] = useState(true);
  const [creating, setCreating] = useState(false);

  // Cache dos dados bulk para reutilizar ao carregar slots
  const [bulkData, setBulkData] = useState<any>(null);

  const { getAvailableTimeSlots, validateAppointment, isValidating } = useUnifiedAppointmentValidation();

  useEffect(() => {
    document.documentElement.classList.add('totem-mode');
    
    if (!client || !service || !barber) {
      navigate('/totem/barbeiro', { state: { client, service } });
      return;
    }
    
    // OTIMIZADO: Bulk fetch de todos os dados de uma vez
    const loadAvailableDates = async () => {
      setLoadingDates(true);
      console.log('📅 [TotemDataHora] Iniciando carregamento OTIMIZADO de datas para:', barber.nome);
      
      try {
        const today = startOfToday();
        const barberId = barber.id;
        const serviceDuration = service.duracao || 60;
        
        const datesToCheck: Date[] = [];
        for (let i = 0; i < 14; i++) {
          datesToCheck.push(addDays(today, i));
        }

        const startDateStr = format(today, 'yyyy-MM-dd');
        const endDateStr = format(addDays(today, 13), 'yyyy-MM-dd');

        // 1. Resolver staffId UMA ÚNICA VEZ
        const { data: barberData } = await supabase
          .from('painel_barbeiros')
          .select('staff_id')
          .eq('id', barberId)
          .maybeSingle();
        
        const authStaffId = barberData?.staff_id || barberId;
        const { data: staffRecord } = await supabase
          .from('staff')
          .select('id')
          .eq('staff_id', authStaffId)
          .maybeSingle();
        const staffTableId = staffRecord?.id || authStaffId;

        // 2. BULK FETCH: Todas as queries em paralelo
        const [workingHoursResult, timeOffResult, availabilityResult, appointmentsResult] = await Promise.all([
          supabase
            .from('working_hours')
            .select('day_of_week, start_time, end_time')
            .eq('staff_id', staffTableId)
            .eq('is_active', true),
          supabase
            .from('time_off')
            .select('start_date, end_date, type')
            .eq('barber_id', barberId)
            .eq('status', 'ativo')
            .lte('start_date', endDateStr)
            .gte('end_date', startDateStr),
          supabase
            .from('barber_availability')
            .select('date, is_available, start_time, end_time')
            .eq('barber_id', barberId)
            .gte('date', startDateStr)
            .lte('date', endDateStr),
          supabase
            .from('painel_agendamentos')
            .select('data, hora, servico:painel_servicos(duracao)')
            .eq('barbeiro_id', barberId)
            .gte('data', startDateStr)
            .lte('data', endDateStr)
            .not('status', 'in', '("cancelado","ausente")')
        ]);

        // Indexar dados para acesso rápido
        const workingHoursMap = new Map<number, { start: string; end: string }>();
        workingHoursResult.data?.forEach(wh => {
          workingHoursMap.set(wh.day_of_week, { start: wh.start_time, end: wh.end_time });
        });

        const timeOffDates = new Set<string>();
        timeOffResult.data?.forEach(to => {
          const start = new Date(to.start_date + 'T12:00:00');
          const end = new Date(to.end_date + 'T12:00:00');
          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            timeOffDates.add(format(d, 'yyyy-MM-dd'));
          }
        });

        const availabilityMap = new Map<string, { is_available: boolean; start_time?: string; end_time?: string }>();
        availabilityResult.data?.forEach(a => {
          availabilityMap.set(a.date, a);
        });

        const appointmentsByDate = new Map<string, Array<{ hora: string; duracao: number }>>();
        appointmentsResult.data?.forEach(apt => {
          const list = appointmentsByDate.get(apt.data) || [];
          list.push({ hora: apt.hora, duracao: (apt.servico as any)?.duracao || 60 });
          appointmentsByDate.set(apt.data, list);
        });

        // Salvar dados bulk para reutilizar nos slots
        setBulkData({ workingHoursMap, timeOffDates, availabilityMap, appointmentsByDate });

        // 3. Processar LOCALMENTE
        const BUFFER = 10;
        const timeToMin = (t: string) => {
          const [h, m] = t.split(':').map(Number);
          return h * 60 + m;
        };

        const dates: Date[] = [];
        const now = new Date();

        for (const date of datesToCheck) {
          if (dates.length >= 7) break;
          const dateStr = format(date, 'yyyy-MM-dd');
          const dayOfWeek = date.getDay();

          if (timeOffDates.has(dateStr)) continue;
          const wh = workingHoursMap.get(dayOfWeek);
          if (!wh) continue;
          const avail = availabilityMap.get(dateStr);
          if (avail && avail.is_available === false) continue;

          const effectiveStart = avail?.start_time || wh.start;
          const effectiveEnd = avail?.end_time || wh.end;
          const startMin = timeToMin(effectiveStart);
          const endMin = timeToMin(effectiveEnd);

          const occupied = (appointmentsByDate.get(dateStr) || []).map(apt => ({
            start: timeToMin(apt.hora),
            end: timeToMin(apt.hora) + apt.duracao + BUFFER
          }));

          const isToday = date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
          let hasAvailable = false;

          for (let mins = startMin; mins + serviceDuration <= endMin; mins += 30) {
            if (isToday) {
              const slotDate = new Date(date);
              slotDate.setHours(Math.floor(mins / 60), mins % 60, 0, 0);
              if (slotDate <= now) continue;
            }
            const slotEnd = mins + serviceDuration;
            let conflict = false;
            for (const period of occupied) {
              if (mins < period.end && slotEnd + BUFFER > period.start) {
                conflict = true;
                break;
              }
            }
            if (!conflict) {
              hasAvailable = true;
              break;
            }
          }

          if (hasAvailable) dates.push(date);
        }
        
        console.log(`✅ [TotemDataHora] Total de datas disponíveis: ${dates.length}`);
        setAvailableDates(dates);
        
        if (dates.length > 0) {
          setSelectedDate(dates[0]);
        } else {
          toast.warning('Não há horários disponíveis nos próximos dias');
        }
      } catch (error) {
        console.error('❌ [TotemDataHora] Erro ao carregar datas:', error);
        toast.error('Erro ao carregar datas disponíveis');
      } finally {
        setLoadingDates(false);
      }
    };
    
    loadAvailableDates();
    
    return () => {
      document.documentElement.classList.remove('totem-mode');
    };
  }, [client, service, barber, navigate]);

  useEffect(() => {
    if (selectedDate && bulkData) {
      loadTimeSlotsFromCache();
    }
  }, [selectedDate, bulkData]);

  const loadTimeSlotsFromCache = () => {
    if (!selectedDate || !service || !bulkData) return;
    
    const now = new Date();
    const isToday = selectedDate.getDate() === now.getDate() &&
                    selectedDate.getMonth() === now.getMonth() &&
                    selectedDate.getFullYear() === now.getFullYear();
    
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const dayOfWeek = selectedDate.getDay();
    const serviceDuration = service.duracao || 60;
    const BUFFER = 10;

    const timeToMin = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };

    const wh = bulkData.workingHoursMap.get(dayOfWeek);
    if (!wh) {
      setTimeSlots([]);
      return;
    }

    const avail = bulkData.availabilityMap.get(dateStr);
    const effectiveStart = avail?.start_time || wh.start;
    const effectiveEnd = avail?.end_time || wh.end;
    const startMin = timeToMin(effectiveStart);
    const endMin = timeToMin(effectiveEnd);

    const occupied = (bulkData.appointmentsByDate.get(dateStr) || []).map((apt: any) => ({
      start: timeToMin(apt.hora),
      end: timeToMin(apt.hora) + apt.duracao + BUFFER
    }));

    const availableSlots: TimeSlot[] = [];
    for (let mins = startMin; mins + serviceDuration <= endMin; mins += 30) {
      if (isToday) {
        const slotDate = new Date(selectedDate);
        slotDate.setHours(Math.floor(mins / 60), mins % 60, 0, 0);
        if (slotDate <= now) continue;
      }
      const slotEnd = mins + serviceDuration;
      let conflict = false;
      for (const period of occupied) {
        if (mins < period.end && slotEnd + BUFFER > period.start) {
          conflict = true;
          break;
        }
      }
      if (!conflict) {
        const h = String(Math.floor(mins / 60)).padStart(2, '0');
        const m = String(mins % 60).padStart(2, '0');
        availableSlots.push({ hora: `${h}:${m}`, disponivel: true });
      }
    }

    console.log('✅ [TotemDataHora] Slots disponíveis:', availableSlots.length);

    if (availableSlots.length === 0) {
      toast.info('Não há horários disponíveis para esta data', {
        description: isToday 
          ? 'Não há mais horários disponíveis hoje. Selecione outra data.' 
          : 'Selecione outra data ou tente mais tarde.'
      });
    }

    setTimeSlots(availableSlots);
  };

  const handleConfirm = async () => {
    console.log('🔘 [TotemDataHora] Botão confirmar clicado!', { selectedTime, selectedDate });
    
    if (!selectedTime || !selectedDate) {
      toast.error('Selecione uma data e horário');
      return;
    }

    console.log('✅ [TotemDataHora] Iniciando criação de agendamento...');
    setCreating(true);
    try {
      // CRÍTICO: Usar barber.id (painel_barbeiros.id) CONSISTENTEMENTE
      // O hook resolve internamente o staff_id correto para working_hours
      console.log('🔐 [TotemDataHora] Validando com barbeiro_id:', barber.id);
      const validation = await validateAppointment(
        barber.id, // SEMPRE usar painel_barbeiros.id - o hook resolve o staff_id internamente
        selectedDate,
        selectedTime,
        service.duracao || 60
      );

      if (!validation.valid) {
        console.log('❌ [TotemDataHora] Validação falhou:', validation.error);
        // Recarregar horários para refletir estado atual
        loadTimeSlotsFromCache();
        setCreating(false);
        return;
      }

      console.log('✅ Validação passou! Criando agendamento...');
      
      // Garantir que a data seja formatada sem conversão de timezone
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const dataLocal = `${year}-${month}-${day}`;
      
      console.log('📅 Data sendo salva:', {
        selectedDate,
        dataLocal,
        hora: selectedTime,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      });
      
      // Validação passou, criar agendamento
      // @ts-ignore - Evitar inferência profunda de tipos do Supabase
      const response = await supabase
        .from('painel_agendamentos')
        .insert({
          cliente_id: client.id,
          barbeiro_id: barber.id,
          servico_id: service.id,
          data: dataLocal,
          hora: selectedTime,
          status: 'agendado'
        })
        .select()
        .single();

      if (response.error) {
        console.error('❌ Erro do banco:', response.error);
        const errorMessage = response.error.message || 'Erro ao criar agendamento';
        toast.error(errorMessage);
        
        // Recarregar horários se for erro de conflito
        if (response.error.message?.includes('Conflito') || 
            response.error.message?.includes('duplicate')) {
          loadTimeSlotsFromCache();
        }
        
        setCreating(false);
        return;
      }

      console.log('✅ Agendamento criado:', response.data);
      toast.success('Agendamento criado com sucesso!');
      
      // Enviar e-mail de confirmação
      console.log('📧 [TotemDataHora] Enviando e-mail de confirmação...');
      try {
        const emailSent = await sendConfirmationEmailDirect({
          clientName: client.nome,
          clientEmail: client.email || '',
          serviceName: service.nome,
          staffName: barber.nome,
          appointmentDate: dataLocal,
          appointmentTime: selectedTime,
          servicePrice: service.preco,
          serviceDuration: service.duracao
        });
        if (emailSent) {
          console.log('✅ [TotemDataHora] E-mail enviado com sucesso!');
        } else {
          console.log('📧 [TotemDataHora] E-mail não enviado (cliente sem e-mail válido)');
        }
      } catch (emailError) {
        console.error('❌ [TotemDataHora] Erro ao enviar e-mail:', emailError);
      }
      
      navigate('/totem/agendamento-sucesso', {
        state: {
          appointment: response.data,
          service,
          barber,
          client
        }
      });
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      toast.error('Erro ao criar agendamento', {
        description: 'Tente novamente ou procure a recepção.'
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <TotemLayout
      title="Escolha Data e Horário"
      subtitle="Selecione o melhor dia e horário para você"
      showBackButton
      onBack={() => navigate('/totem/barbeiro', { state: { client, service } })}
    >
      <TotemContentContainer maxWidth="6xl">
        <div className="space-y-6">
          {/* Seleção de Data */}
          <div>
            <h3 className="text-2xl font-bold text-urbana-gold mb-4 flex items-center gap-2">
              <Calendar className="w-6 h-6" />
              Selecione o Dia
            </h3>
            {loadingDates ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-12 h-12 border-4 border-urbana-gold/30 border-t-urbana-gold rounded-full animate-spin" />
              </div>
            ) : availableDates.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-xl text-urbana-light/60">
                  Não há horários disponíveis nos próximos dias
                </p>
              </div>
            ) : (
              <TotemGrid columns={4} gap={3}>
                {availableDates.map((date) => (
                  <TotemCard
                    key={date.toISOString()}
                    icon={Calendar}
                    variant={
                      selectedDate && 
                      selectedDate.getDate() === date.getDate() &&
                      selectedDate.getMonth() === date.getMonth() &&
                      selectedDate.getFullYear() === date.getFullYear()
                        ? 'selected'
                        : 'default'
                    }
                    onClick={() => setSelectedDate(date)}
                  >
                    <TotemCardTitle>
                      {format(date, "dd 'de' MMMM", { locale: ptBR })}
                    </TotemCardTitle>
                    <p className="text-sm text-urbana-light/60">
                      {format(date, 'EEEE', { locale: ptBR })}
                    </p>
                  </TotemCard>
                ))}
              </TotemGrid>
            )}
          </div>

          {/* Seleção de Horário */}
          <div>
            <h3 className="text-2xl font-bold text-urbana-gold mb-4 flex items-center gap-2">
              <Clock className="w-6 h-6" />
              Selecione o Horário
            </h3>
            
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-12 h-12 border-4 border-urbana-gold/30 border-t-urbana-gold rounded-full animate-spin" />
              </div>
            ) : (
              <TotemGrid columns={4} gap={3}>
                {timeSlots.map((slot) => (
                  <TotemCard
                    key={slot.hora}
                    icon={Clock}
                    variant={
                      !slot.disponivel
                        ? 'disabled'
                        : selectedTime === slot.hora
                        ? 'selected'
                        : 'default'
                    }
                    onClick={() => slot.disponivel && setSelectedTime(slot.hora)}
                  >
                    <TotemCardTitle>{slot.hora}</TotemCardTitle>
                  </TotemCard>
                ))}
              </TotemGrid>
            )}
          </div>

          {/* Botão de Confirmação */}
          {selectedTime && (
            <div className="pt-6">
              <TotemButton
                variant="primary"
                size="xl"
                onClick={() => {
                  console.log('🖱️ Click no botão detectado!');
                  handleConfirm();
                }}
                loading={creating || isValidating}
                disabled={creating || isValidating}
                className="w-full"
              >
                {isValidating ? 'Validando...' : 'Confirmar Agendamento'}
              </TotemButton>
            </div>
          )}
        </div>
      </TotemContentContainer>
    </TotemLayout>
  );
};

export default TotemDataHora;
