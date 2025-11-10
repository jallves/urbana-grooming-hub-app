import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Calendar, Clock } from 'lucide-react';
import { format, addDays, startOfToday } from 'date-fns';
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
    const isToday = format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
    
    // Gerar horários de 8h às 20h
    for (let hour = 8; hour <= 20; hour++) {
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
        // @ts-ignore
        const response = await supabase
          .from('painel_agendamentos')
          .select('*')
          .eq('data', format(date, 'yyyy-MM-dd'))
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
    
    setLoading(true);
    try {
      const slots = await getAvailableTimeSlots(
        barber.id,
        selectedDate,
        service.duracao || 60
      );

      // Filtrar apenas horários disponíveis
      const availableSlots: TimeSlot[] = slots
        .filter(slot => slot.available)
        .map(slot => ({
          hora: slot.time,
          disponivel: true
        }));
      
      console.log('✅ Horários disponíveis carregados:', availableSlots.length);
      setTimeSlots(availableSlots);
    } catch (error) {
      console.error('Erro ao carregar horários:', error);
      toast.error('Erro ao carregar horários disponíveis');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedTime || !selectedDate) {
      toast.error('Selecione uma data e horário');
      return;
    }

    setCreating(true);
    try {
      // Validação robusta antes de criar
      const validation = await validateAppointment(
        barber.id,
        selectedDate,
        selectedTime,
        service.duracao || 60
      );

      if (!validation.valid) {
        // Erro já foi mostrado pelo hook
        setCreating(false);
        return;
      }

      // Validação passou, criar agendamento
      // @ts-ignore - Evitar inferência profunda de tipos do Supabase
      const response = await supabase
        .from('painel_agendamentos')
        .insert({
          cliente_id: client.id,
          barbeiro_id: barber.id,
          servico_id: service.id,
          data: format(selectedDate, 'yyyy-MM-dd'),
          hora: selectedTime,
          status: 'agendado'
        })
        .select()
        .single();

      if (response.error) {
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
                      selectedDate && format(selectedDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
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
                onClick={handleConfirm}
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
