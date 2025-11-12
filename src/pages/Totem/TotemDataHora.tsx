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
import { useAppointmentValidation } from '@/hooks/useAppointmentValidation';

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

  const { getAvailableTimeSlots, validateAppointment, isValidating, extractDatabaseError } = useAppointmentValidation();

  // Verificar se uma data tem horários disponíveis
  const hasAvailableSlots = async (date: Date): Promise<boolean> => {
    const now = new Date();
    const today = startOfToday();
    
    // Comparar datas sem conversão de timezone
    const dateDay = date.getDate();
    const dateMonth = date.getMonth();
    const dateYear = date.getFullYear();
    const todayDay = today.getDate();
    const todayMonth = today.getMonth();
    const todayYear = today.getFullYear();
    const isToday = dateDay === todayDay && dateMonth === todayMonth && dateYear === todayYear;
    
    // Gerar horários de 9h às 20h
    for (let hour = 9; hour <= 20; hour++) {
      for (let minute of [0, 30]) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        
        // Se é hoje, verificar se horário já passou
        if (isToday) {
          const [slotHour, slotMinute] = timeStr.split(':').map(Number);
          const slotTime = new Date(today);
          slotTime.setHours(slotHour, slotMinute, 0, 0);
          if (slotTime < now) continue;
        }
        
        // Verificar se horário está disponível
        // Garantir data local sem conversão de timezone
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dataLocal = `${year}-${month}-${day}`;
        
        // @ts-ignore
        const response = await supabase
          .from('painel_agendamentos')
          .select('*')
          .eq('data', dataLocal)
          .eq('hora', timeStr)
          .eq('barbeiro_id', barber.id)
          .neq('status', 'cancelado');

        // Se encontrou pelo menos um horário disponível, retornar true
        if (!response.data || response.data.length === 0) {
          return true;
        }
      }
    }
    
    return false;
  };

  useEffect(() => {
    document.documentElement.classList.add('totem-mode');
    
    if (!client || !service || !barber) {
      navigate('/totem/barbeiro', { state: { client, service } });
      return;
    }
    
    // Carregar datas disponíveis
    const loadAvailableDates = async () => {
      setLoadingDates(true);
      try {
        const dates: Date[] = [];
        
        // Verificar próximos 14 dias para garantir pelo menos 7 dias com horários
        for (let i = 0; i < 14 && dates.length < 7; i++) {
          const date = addDays(startOfToday(), i);
          const hasSlots = await hasAvailableSlots(date);
          
          if (hasSlots) {
            dates.push(date);
          }
        }
        
        setAvailableDates(dates);
        
        // Selecionar a primeira data disponível automaticamente
        if (dates.length > 0) {
          setSelectedDate(dates[0]);
        }
      } catch (error) {
        console.error('Erro ao carregar datas:', error);
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
    if (selectedDate) {
      loadTimeSlots();
    }
  }, [selectedDate]);

  const loadTimeSlots = async () => {
    if (!selectedDate || !service) return;
    
    const now = new Date();
    
    // Comparar datas sem conversão de timezone
    const isToday = selectedDate.getDate() === now.getDate() &&
                    selectedDate.getMonth() === now.getMonth() &&
                    selectedDate.getFullYear() === now.getFullYear();
    
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const selectedDateStr = `${year}-${month}-${day}`;
    
    console.log('🕐 Carregando slots:', {
      selectedDate: selectedDateStr,
      isToday,
      currentTime: format(now, 'HH:mm:ss'),
      minTimeRequired: format(addMinutes(now, 30), 'HH:mm:ss')
    });
    
    setLoading(true);
    try {
      const slots = await getAvailableTimeSlots(
        barber.id,
        selectedDate,
        service.duracao || 60
      );

      console.log('📊 Slots recebidos:', {
        total: slots.length,
        available: slots.filter(s => s.available).length,
        unavailable: slots.filter(s => !s.available).length,
        reasons: slots.filter(s => !s.available).map(s => ({ time: s.time, reason: s.reason }))
      });

      // Filtrar apenas horários disponíveis
      const availableSlots: TimeSlot[] = slots
        .filter(slot => slot.available)
        .map(slot => ({
          hora: slot.time,
          disponivel: true
        }));
      
      console.log('✅ Horários finais disponíveis:', availableSlots.map(s => s.hora));
      
      if (availableSlots.length === 0) {
        toast.info('Não há horários disponíveis para esta data', {
          description: isToday 
            ? 'Não há mais horários disponíveis hoje. Selecione outra data.' 
            : 'Selecione outra data ou tente mais tarde.'
        });
      }
      
      setTimeSlots(availableSlots);
    } catch (error) {
      console.error('Erro ao carregar horários:', error);
      toast.error('Erro ao carregar horários disponíveis');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    console.log('🔘 Botão confirmar clicado!', { selectedTime, selectedDate });
    
    if (!selectedTime || !selectedDate) {
      toast.error('Selecione uma data e horário');
      return;
    }

    console.log('✅ Iniciando criação de agendamento...');
    setCreating(true);
    try {
      // Validação robusta antes de criar
      console.log('🔐 Iniciando validação...');
      const validation = await validateAppointment(
        barber.id,
        selectedDate,
        selectedTime,
        service.duracao || 60
      );

      if (!validation.valid) {
        console.log('❌ Validação falhou:', validation.error);
        // Erro já foi mostrado pelo hook
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
        // Usar extração de erro do banco de dados
        const errorMessage = extractDatabaseError(response.error);
        toast.error(errorMessage);
        
        // Recarregar horários se for erro de conflito
        if (response.error.message?.includes('Conflito') || 
            response.error.message?.includes('duplicate')) {
          loadTimeSlots();
        }
        
        setCreating(false);
        return;
      }

      console.log('✅ Agendamento criado:', response.data);
      toast.success('Agendamento criado com sucesso!');
      
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
              <p className="text-xs text-urbana-light/40 text-center mt-2">
                Debug: selectedTime={selectedTime}, creating={String(creating)}, validating={String(isValidating)}
              </p>
            </div>
          )}
        </div>
      </TotemContentContainer>
    </TotemLayout>
  );
};

export default TotemDataHora;
