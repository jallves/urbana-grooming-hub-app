import React, { useState, useEffect, useMemo } from 'react';
import { useBarberDataQuery } from '@/hooks/barber/queries/useBarberDataQuery';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, addDays, parseISO, isBefore, startOfDay, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useBarberAvailableSlots } from '@/hooks/barber/useBarberAvailableSlots';
import { Loader2, Clock } from 'lucide-react';
import { sendAppointmentUpdateEmail } from '@/hooks/useSendAppointmentUpdateEmail';

interface BarberEditAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId: string | null;
  barberId: string;
  onSuccess: () => void;
}

interface PainelServico {
  id: string;
  nome: string;
  preco: number;
  duracao: number;
}

const BarberEditAppointmentModal: React.FC<BarberEditAppointmentModalProps> = ({
  isOpen,
  onClose,
  appointmentId,
  barberId,
  onSuccess
}) => {
  const { data: currentBarberData } = useBarberDataQuery();
  const isBarberAdmin = currentBarberData?.is_barber_admin || false;
  const [appointment, setAppointment] = useState<any>(null);
  const [services, setServices] = useState<PainelServico[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedService, setSelectedService] = useState<PainelServico | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  
  // Armazena dados originais do agendamento
  const [originalDate, setOriginalDate] = useState<Date | null>(null);
  const [originalTime, setOriginalTime] = useState<string>('');
  
  const { slots, loading: slotsLoading, fetchAvailableSlots } = useBarberAvailableSlots();

  useEffect(() => {
    if (isOpen && appointmentId) {
      fetchAppointment();
      fetchServices();
    }
  }, [isOpen, appointmentId]);

  useEffect(() => {
    if (selectedDate && selectedService) {
      console.log('🔍 [BarberEditModal] Chamando fetchAvailableSlots:', {
        barberId,
        selectedDate,
        duracao: selectedService.duracao,
        appointmentId
      });
      fetchAvailableSlots(
        barberId,
        selectedDate,
        selectedService.duracao,
        appointmentId || undefined,
        isBarberAdmin
      );
    }
  }, [selectedDate, selectedService, barberId, appointmentId, fetchAvailableSlots, isBarberAdmin]);

  const fetchAppointment = async () => {
    if (!appointmentId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('painel_agendamentos')
        .select(`
          *,
          painel_clientes(nome, email, whatsapp),
          painel_servicos(id, nome, preco, duracao)
        `)
        .eq('id', appointmentId)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        toast.error('Agendamento não encontrado');
        onClose();
        return;
      }

      console.log('📋 [BarberEditModal] Agendamento carregado:', {
        id: data.id,
        data: data.data,
        hora: data.hora,
        servico: data.painel_servicos
      });

      setAppointment(data);
      
      const appointmentDate = parseISO(data.data);
      setSelectedDate(appointmentDate);
      setSelectedTime(data.hora);
      
      // Salvar dados originais
      setOriginalDate(appointmentDate);
      setOriginalTime(data.hora?.substring(0, 5) || data.hora);
      
      // Garantir que o serviço tenha o campo duracao
      if (data.painel_servicos) {
        setSelectedService(data.painel_servicos);
      }
    } catch (error) {
      console.error('Erro ao buscar agendamento:', error);
      toast.error('Erro ao carregar agendamento');
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('painel_servicos')
        .select('*')
        .eq('is_active', true)
        .order('nome');

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Erro ao buscar serviços:', error);
    }
  };

  const handleServiceChange = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (service) {
      setSelectedService(service);
      setSelectedTime(''); // Reset time when service changes
    }
  };

  const handleSave = async () => {
    if (!appointmentId || !selectedDate || !selectedTime || !selectedService) {
      toast.error('Preencha todos os campos');
      return;
    }

    // Validar que a data/hora é futura (exceto barbeiro admin)
    if (!isBarberAdmin) {
      const appointmentDateTime = parseISO(`${format(selectedDate, 'yyyy-MM-dd')}T${selectedTime}`);
      if (isBefore(appointmentDateTime, new Date())) {
        toast.error('Não é possível agendar para horário passado');
        return;
      }
    }

    // Guardar dados anteriores para o e-mail
    const previousData = {
      date: appointment?.data,
      time: appointment?.hora?.substring(0, 5),
      staffName: undefined, // Barbeiro não muda
      serviceName: appointment?.painel_servicos?.nome
    };

    setSaving(true);
    try {
      const { error } = await supabase
        .from('painel_agendamentos')
        .update({
          data: format(selectedDate, 'yyyy-MM-dd'),
          hora: selectedTime,
          servico_id: selectedService.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId);

      if (error) throw error;

      // Determinar tipo de alteração
      const newDate = format(selectedDate, 'yyyy-MM-dd');
      const newTime = selectedTime.substring(0, 5);
      let updateType: 'reschedule' | 'change_barber' | 'change_service' | 'general' = 'general';
      
      if (previousData.date !== newDate || previousData.time !== newTime) {
        updateType = 'reschedule';
      } else if (previousData.serviceName !== selectedService.nome) {
        updateType = 'change_service';
      }

      // Enviar e-mail de atualização
      console.log('📧 [BarberEdit] Enviando e-mail de atualização...');
      try {
        await sendAppointmentUpdateEmail({
          appointmentId,
          previousData,
          updateType,
          updatedBy: 'barber'
        });
      } catch (emailError) {
        console.error('⚠️ [BarberEdit] Erro ao enviar e-mail (não crítico):', emailError);
      }

      toast.success('✅ Agendamento atualizado!', {
        description: `Nova data: ${format(selectedDate, "dd/MM/yyyy", { locale: ptBR })} às ${selectedTime}`
      });
      onSuccess();
      onClose();
      setShowConfirmDialog(false);
    } catch (error: any) {
      console.error('Erro ao atualizar agendamento:', error);
      toast.error('Erro ao atualizar agendamento', {
        description: error.message
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveClick = () => {
    if (!selectedDate || !selectedTime || !selectedService) {
      toast.error('Preencha todos os campos');
      return;
    }

    // Validar que a data/hora é futura (exceto barbeiro admin)
    if (!isBarberAdmin) {
      const appointmentDateTime = parseISO(`${format(selectedDate, 'yyyy-MM-dd')}T${selectedTime}`);
      if (isBefore(appointmentDateTime, new Date())) {
        toast.error('Não é possível agendar para horário passado');
        return;
      }
    }

    // Abrir dialog de confirmação
    setShowConfirmDialog(true);
  };

  // Verifica se a data selecionada é a mesma do agendamento original
  const isOriginalDate = useMemo(() => {
    if (!selectedDate || !originalDate) return false;
    return isSameDay(selectedDate, originalDate);
  }, [selectedDate, originalDate]);

  // Normaliza o horário original para comparação (remove segundos se houver)
  const normalizedOriginalTime = useMemo(() => {
    return originalTime?.substring(0, 5) || '';
  }, [originalTime]);

  const availableSlots = slots.filter(slot => slot.available);
  const today = startOfDay(new Date());

  if (!isOpen || !appointmentId) return null;

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-urbana-black/95 backdrop-blur-2xl border border-urbana-gold/20 shadow-2xl shadow-urbana-gold/5">
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-urbana-gold" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-urbana-black border border-urbana-gold/20 shadow-2xl shadow-urbana-gold/5 text-urbana-light w-[95vw] sm:w-full max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden [&_*]:!transition-none [&_*:hover]:!bg-inherit [&_*:hover]:!text-inherit [&_*:hover]:!border-inherit [&_*:hover]:!opacity-inherit [&_*:hover]:!scale-100 [&_*:hover]:!transform-none">
        <style>{`
          .barber-edit-modal *:hover {
            background-color: inherit !important;
            color: inherit !important;
            border-color: inherit !important;
            opacity: inherit !important;
            transform: none !important;
            scale: none !important;
          }
          .barber-edit-modal button:active {
            opacity: 0.8 !important;
          }
        `}</style>
        <DialogHeader>
          <DialogTitle className="text-urbana-light text-lg sm:text-xl font-bold">Editar Agendamento</DialogTitle>
        </DialogHeader>

        {appointment && (
          <div className="space-y-4 sm:space-y-6 overflow-x-hidden">
            {/* Info do Cliente */}
            <div className="p-3 sm:p-4 bg-urbana-black/40 backdrop-blur-sm rounded-lg border border-urbana-gold/10">
              <p className="text-xs sm:text-sm text-urbana-light/50 mb-1">Cliente</p>
              <p className="font-medium text-urbana-light text-base sm:text-lg truncate">
                {appointment.painel_clientes.nome}
              </p>
              <p className="text-xs sm:text-sm text-urbana-light/50 mt-1 truncate">
                {appointment.painel_clientes.whatsapp}
              </p>
            </div>

            {/* Info do Agendamento Original */}
            <div className="p-3 sm:p-4 bg-sky-500/10 backdrop-blur-sm rounded-lg border border-sky-500/20">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-sky-400" />
                <p className="text-xs sm:text-sm text-sky-400 font-medium">Horário Original</p>
              </div>
              <p className="text-urbana-light text-sm sm:text-base">
                {originalDate && format(originalDate, "dd/MM/yyyy", { locale: ptBR })} às {normalizedOriginalTime}
              </p>
            </div>

            {/* Seleção de Serviço - Responsivo */}
            <div className="space-y-2">
              <Label className="text-urbana-light/70 text-sm">Serviço</Label>
              <Select
                value={selectedService?.id}
                onValueChange={handleServiceChange}
              >
                <SelectTrigger className="bg-urbana-black/60 border-urbana-gold/20 text-urbana-light h-10 text-sm sm:text-base w-full cursor-pointer">
                  <SelectValue placeholder="Selecione um serviço" />
                </SelectTrigger>
                <SelectContent className="bg-urbana-black border-urbana-gold/20 max-w-[90vw]">
                  {services.map(service => (
                    <SelectItem key={service.id} value={service.id} className="text-sm sm:text-base text-urbana-light cursor-pointer focus:bg-urbana-gold/20 focus:text-urbana-light">
                      {service.nome} - R$ {service.preco.toFixed(2)} ({service.duracao}min)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Calendário - Responsivo */}
            <div className="space-y-2">
              <Label className="text-urbana-light/70 text-sm">Data</Label>
              <div className="border border-urbana-gold/20 rounded-lg p-2 sm:p-4 bg-urbana-black/60 overflow-x-hidden">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => isBarberAdmin ? false : isBefore(date, today)}
                  locale={ptBR}
                  className="text-urbana-light mx-auto pointer-events-auto"
                  classNames={{
                    months: "space-y-2",
                    month: "space-y-2",
                    caption: "flex justify-center pt-1 relative items-center text-sm sm:text-base",
                    caption_label: "text-sm sm:text-base font-medium text-urbana-light",
                    nav: "space-x-1 flex items-center",
                    nav_button: "h-7 w-7 sm:h-8 sm:w-8 text-urbana-light/70 active:text-urbana-gold",
                    head_row: "flex justify-center",
                    head_cell: "text-urbana-light/50 rounded-md w-8 sm:w-9 font-normal text-[10px] sm:text-xs",
                    row: "flex w-full mt-1 justify-center",
                    cell: "relative p-0 text-center text-xs sm:text-sm focus-within:relative focus-within:z-20",
                    day: "h-8 w-8 sm:h-9 sm:w-9 p-0 font-normal text-xs sm:text-sm text-urbana-light",
                    day_selected: "bg-urbana-gold text-urbana-black",
                    day_disabled: "text-urbana-light/20",
                  }}
                />
              </div>
            </div>

            {/* Horários Disponíveis - Mobile First */}
            {selectedDate && selectedService && (
              <div className="space-y-2 overflow-x-hidden">
                <Label className="text-urbana-light/70 text-sm">Horário Disponível</Label>
                
                {isOriginalDate && (
                  <div className="flex items-center gap-2 p-2 bg-urbana-black/40 backdrop-blur-sm rounded-lg border border-urbana-gold/10">
                    <div className="w-4 h-4 rounded border-2 border-sky-400 bg-sky-400/20 flex-shrink-0" />
                    <span className="text-xs text-urbana-light/70">
                      Horário original: <strong className="text-sky-400">{normalizedOriginalTime}</strong>
                    </span>
                  </div>
                )}
                
                {slotsLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-urbana-gold" />
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="p-3 sm:p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-red-400 text-xs sm:text-sm">
                      Nenhum horário disponível para esta data
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1.5 sm:gap-2">
                    {availableSlots.map((slot) => {
                      const slotTimeNormalized = slot.time.substring(0, 5);
                      const isOriginalSlot = isOriginalDate && slotTimeNormalized === normalizedOriginalTime;
                      const isSelected = selectedTime === slot.time;
                      
                      return (
                        <button
                          key={slot.time}
                          type="button"
                          className={`
                            h-9 px-2 text-xs sm:text-sm rounded-md font-medium transition-colors touch-manipulation relative
                            ${isSelected 
                              ? "bg-urbana-gold text-urbana-black" 
                              : isOriginalSlot
                                ? "bg-sky-400/20 text-sky-300 border-2 border-sky-400"
                                : "bg-urbana-black/40 text-urbana-light/80 border border-urbana-gold/15 hover:border-urbana-gold/30"
                            }
                          `}
                          onClick={() => setSelectedTime(slot.time)}
                        >
                          {slot.time}
                          {isOriginalSlot && !isSelected && (
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-sky-400 rounded-full" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Botões de Ação - Mobile First */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2 sm:pt-4">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={saving}
                className="w-full sm:flex-1 h-10 border-urbana-gold/20 text-urbana-light/70 hover:bg-urbana-gold/10 hover:text-urbana-light text-sm touch-manipulation bg-transparent"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveClick}
                disabled={saving || !selectedDate || !selectedTime || !selectedService}
                className="w-full sm:flex-1 h-10 bg-urbana-gold text-urbana-black hover:bg-urbana-gold/90 text-sm touch-manipulation font-semibold"
              >
                Salvar Alterações
              </Button>
            </div>
          </div>
        )}
      </DialogContent>

      {/* Dialog de confirmação para salvar - Responsivo */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="bg-urbana-black/95 backdrop-blur-2xl border-urbana-gold/20 w-[90vw] max-w-md overflow-x-hidden">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-urbana-light text-base sm:text-lg">
              Confirmar alterações?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-urbana-light/60 text-sm">
              Você está prestes a alterar este agendamento para:
              <div className="mt-3 p-3 bg-urbana-black/40 backdrop-blur-sm rounded-lg border border-urbana-gold/10">
                <p className="text-urbana-light font-medium text-sm">
                  📅 {selectedDate && format(selectedDate, "dd/MM/yyyy", { locale: ptBR })}
                </p>
                <p className="text-urbana-light font-medium text-sm">
                  🕐 {selectedTime}
                </p>
                <p className="text-urbana-light font-medium text-sm truncate">
                  ✂️ {selectedService?.nome}
                </p>
              </div>
              <strong className="text-urbana-gold block mt-3 text-sm">
                Tem certeza que deseja salvar estas alterações?
              </strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel 
              className="bg-urbana-black/40 border-urbana-gold/20 text-urbana-light hover:bg-urbana-gold/10 w-full sm:w-auto h-10 text-sm touch-manipulation"
              disabled={saving}
            >
              Não, voltar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSave}
              disabled={saving}
              className="bg-urbana-gold text-urbana-black hover:bg-urbana-gold/90 w-full sm:w-auto h-10 text-sm touch-manipulation font-semibold"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Salvando...
                </>
              ) : (
                'Sim, salvar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
};

export default BarberEditAppointmentModal;
