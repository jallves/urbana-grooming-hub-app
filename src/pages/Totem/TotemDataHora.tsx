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

  const { getAvailableTimeSlots, validateAppointment, isValidating } = useUnifiedAppointmentValidation();

  useEffect(() => {
    document.documentElement.classList.add('totem-mode');
    
    if (!client || !service || !barber) {
      navigate('/totem/barbeiro', { state: { client, service } });
      return;
    }
    
    // Carregar datas disponíveis usando o hook otimizado
    const loadAvailableDates = async () => {
      setLoadingDates(true);
      console.log('📅 [TotemDataHora] Iniciando carregamento de datas para:', barber.nome);
      
      try {
        const today = startOfToday();
        const daysToCheck = 14;
        const allDays = Array.from({ length: daysToCheck }, (_, i) => addDays(today, i));
        
        // OTIMIZADO: Verificar TODOS os 14 dias em paralelo ao invés de sequencialmente
        const results = await Promise.all(
          allDays.map(async (date) => {
            const slots = await getAvailableTimeSlots(
              barber.id,
              date,
              service.duracao || 60
            );
            const availableCount = slots.filter(s => s.available).length;
            console.log(`📅 [TotemDataHora] ${format(date, 'dd/MM')}: ${availableCount} slots disponíveis`);
            return { date, availableCount };
          })
        );
        
        // Filtrar dias com horários e limitar a 7
        const dates = results
          .filter(r => r.availableCount > 0)
          .slice(0, 7)
          .map(r => r.date);
        
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
  }, [client, service, barber, navigate, getAvailableTimeSlots]);

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
        barber.id, // CRÍTICO: Sempre usar painel_barbeiros.id (não staff_id)
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
        await loadTimeSlots();
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
          loadTimeSlots();
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
