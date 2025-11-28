import React, { useState, useEffect } from 'react';
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
import { format, addDays, parseISO, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useBarberAvailableSlots } from '@/hooks/barber/useBarberAvailableSlots';
import { Loader2 } from 'lucide-react';

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
  const [appointment, setAppointment] = useState<any>(null);
  const [services, setServices] = useState<PainelServico[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedService, setSelectedService] = useState<PainelServico | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  
  const { slots, loading: slotsLoading, fetchAvailableSlots } = useBarberAvailableSlots();

  useEffect(() => {
    if (isOpen && appointmentId) {
      fetchAppointment();
      fetchServices();
    }
  }, [isOpen, appointmentId]);

  useEffect(() => {
    if (selectedDate && selectedService) {
      fetchAvailableSlots(
        barberId,
        selectedDate,
        selectedService.duracao,
        appointmentId || undefined
      );
    }
  }, [selectedDate, selectedService, barberId, appointmentId, fetchAvailableSlots]);

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

      setAppointment(data);
      setSelectedDate(parseISO(data.data));
      setSelectedTime(data.hora);
      setSelectedService(data.painel_servicos);
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

    // Validar que a data/hora é futura
    const appointmentDateTime = parseISO(`${format(selectedDate, 'yyyy-MM-dd')}T${selectedTime}`);
    if (isBefore(appointmentDateTime, new Date())) {
      toast.error('Não é possível agendar para horário passado');
      return;
    }

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

    // Validar que a data/hora é futura
    const appointmentDateTime = parseISO(`${format(selectedDate, 'yyyy-MM-dd')}T${selectedTime}`);
    if (isBefore(appointmentDateTime, new Date())) {
      toast.error('Não é possível agendar para horário passado');
      return;
    }

    // Abrir dialog de confirmação
    setShowConfirmDialog(true);
  };

  const availableSlots = slots.filter(slot => slot.available);
  const today = startOfDay(new Date());

  if (!isOpen || !appointmentId) return null;

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-gray-800 border-gray-700">
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-urbana-gold" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white w-[95vw] sm:w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white text-lg sm:text-xl">Editar Agendamento</DialogTitle>
        </DialogHeader>

        {appointment && (
          <div className="space-y-4 sm:space-y-6">
            {/* Info do Cliente - Responsivo */}
            <div className="p-3 sm:p-4 bg-gray-700/50 rounded-lg border border-gray-600">
              <p className="text-xs sm:text-sm text-gray-400 mb-1">Cliente</p>
              <p className="font-medium text-white text-base sm:text-lg truncate">
                {appointment.painel_clientes.nome}
              </p>
              <p className="text-xs sm:text-sm text-gray-400 mt-1 truncate">
                {appointment.painel_clientes.whatsapp}
              </p>
            </div>

            {/* Seleção de Serviço - Responsivo */}
            <div className="space-y-2">
              <Label className="text-gray-300 text-sm">Serviço</Label>
              <Select
                value={selectedService?.id}
                onValueChange={handleServiceChange}
              >
                <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white h-10 text-sm sm:text-base">
                  <SelectValue placeholder="Selecione um serviço" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {services.map(service => (
                    <SelectItem key={service.id} value={service.id} className="text-sm sm:text-base">
                      {service.nome} - R$ {service.preco.toFixed(2)} ({service.duracao}min)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Calendário - Responsivo */}
            <div className="space-y-2">
              <Label className="text-gray-300 text-sm">Data</Label>
              <div className="border border-gray-600 rounded-lg p-2 sm:p-4 bg-gray-700/30">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => isBefore(date, today)}
                  locale={ptBR}
                  className="text-white mx-auto"
                  classNames={{
                    months: "space-y-2",
                    month: "space-y-2",
                    caption: "flex justify-center pt-1 relative items-center text-sm sm:text-base",
                    caption_label: "text-sm sm:text-base font-medium",
                    nav: "space-x-1 flex items-center",
                    nav_button: "h-7 w-7 sm:h-8 sm:w-8",
                    head_row: "flex",
                    head_cell: "text-gray-400 rounded-md w-8 sm:w-9 font-normal text-[10px] sm:text-xs",
                    row: "flex w-full mt-1",
                    cell: "relative p-0 text-center text-xs sm:text-sm focus-within:relative focus-within:z-20",
                    day: "h-8 w-8 sm:h-9 sm:w-9 p-0 font-normal text-xs sm:text-sm",
                  }}
                />
              </div>
            </div>

            {/* Horários Disponíveis - Mobile First */}
            {selectedDate && selectedService && (
              <div className="space-y-2">
                <Label className="text-gray-300 text-sm">Horário Disponível</Label>
                {slotsLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-urbana-gold" />
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="p-3 sm:p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <p className="text-red-400 text-xs sm:text-sm">
                      Nenhum horário disponível para esta data
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1.5 sm:gap-2">
                    {availableSlots.map((slot) => (
                      <Button
                        key={slot.time}
                        variant={selectedTime === slot.time ? "default" : "outline"}
                        className={`h-9 text-xs sm:text-sm touch-manipulation ${
                          selectedTime === slot.time 
                            ? "bg-urbana-gold text-black hover:bg-urbana-gold/90" 
                            : "border-gray-600 text-gray-300 hover:bg-gray-700"
                        }`}
                        onClick={() => setSelectedTime(slot.time)}
                      >
                        {slot.time}
                      </Button>
                    ))}
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
                className="w-full sm:flex-1 h-10 border-gray-600 text-gray-300 hover:bg-gray-700 text-sm touch-manipulation"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveClick}
                disabled={saving || !selectedDate || !selectedTime || !selectedService}
                className="w-full sm:flex-1 h-10 bg-urbana-gold text-black hover:bg-urbana-gold/90 text-sm touch-manipulation"
              >
                Salvar Alterações
              </Button>
            </div>
          </div>
        )}
      </DialogContent>

      {/* Dialog de confirmação para salvar - Responsivo */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="bg-gray-800 border-gray-700 w-[90vw] max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white text-base sm:text-lg">
              Confirmar alterações?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400 text-sm">
              Você está prestes a alterar este agendamento para:
              <div className="mt-3 p-3 bg-gray-700/50 rounded-lg border border-gray-600">
                <p className="text-white font-medium text-sm">
                  📅 {selectedDate && format(selectedDate, "dd/MM/yyyy", { locale: ptBR })}
                </p>
                <p className="text-white font-medium text-sm">
                  🕐 {selectedTime}
                </p>
                <p className="text-white font-medium text-sm truncate">
                  ✂️ {selectedService?.nome}
                </p>
              </div>
              <strong className="text-blue-400 block mt-3 text-sm">
                Tem certeza que deseja salvar estas alterações?
              </strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel 
              className="bg-gray-700 text-white hover:bg-gray-600 w-full sm:w-auto h-10 text-sm touch-manipulation"
              disabled={saving}
            >
              Não, voltar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSave}
              disabled={saving}
              className="bg-urbana-gold text-black hover:bg-urbana-gold/90 w-full sm:w-auto h-10 text-sm touch-manipulation"
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
