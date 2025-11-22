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
      <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white text-xl">Editar Agendamento</DialogTitle>
        </DialogHeader>

        {appointment && (
          <div className="space-y-6">
            {/* Info do Cliente */}
            <div className="p-4 bg-gray-700/50 rounded-lg border border-gray-600">
              <p className="text-sm text-gray-400 mb-1">Cliente</p>
              <p className="font-medium text-white text-lg">{appointment.painel_clientes.nome}</p>
              <p className="text-sm text-gray-400 mt-1">{appointment.painel_clientes.whatsapp}</p>
            </div>

            {/* Seleção de Serviço */}
            <div className="space-y-2">
              <Label className="text-gray-300">Serviço</Label>
              <Select
                value={selectedService?.id}
                onValueChange={handleServiceChange}
              >
                <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white">
                  <SelectValue placeholder="Selecione um serviço" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {services.map(service => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.nome} - R$ {service.preco.toFixed(2)} ({service.duracao}min)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Calendário */}
            <div className="space-y-2">
              <Label className="text-gray-300">Data</Label>
              <div className="border border-gray-600 rounded-lg p-4 bg-gray-700/30">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => isBefore(date, today)}
                  locale={ptBR}
                  className="text-white"
                />
              </div>
            </div>

            {/* Horários Disponíveis */}
            {selectedDate && selectedService && (
              <div className="space-y-2">
                <Label className="text-gray-300">Horário Disponível</Label>
                {slotsLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-urbana-gold" />
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <p className="text-red-400 text-sm">
                      Nenhum horário disponível para esta data
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {availableSlots.map((slot) => (
                      <Button
                        key={slot.time}
                        variant={selectedTime === slot.time ? "default" : "outline"}
                        className={selectedTime === slot.time 
                          ? "bg-urbana-gold text-black hover:bg-urbana-gold/90" 
                          : "border-gray-600 text-gray-300 hover:bg-gray-700"
                        }
                        onClick={() => setSelectedTime(slot.time)}
                      >
                        {slot.time}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Botões de Ação */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={saving}
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveClick}
                disabled={saving || !selectedDate || !selectedTime || !selectedService}
                className="flex-1 bg-urbana-gold text-black hover:bg-urbana-gold/90"
              >
                Salvar Alterações
              </Button>
            </div>
          </div>
        )}
      </DialogContent>

      {/* Dialog de confirmação para salvar */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="bg-gray-800 border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Confirmar alterações?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Você está prestes a alterar este agendamento para:
              <div className="mt-3 p-3 bg-gray-700/50 rounded-lg border border-gray-600">
                <p className="text-white font-medium">
                  📅 {selectedDate && format(selectedDate, "dd/MM/yyyy", { locale: ptBR })}
                </p>
                <p className="text-white font-medium">
                  🕐 {selectedTime}
                </p>
                <p className="text-white font-medium">
                  ✂️ {selectedService?.nome}
                </p>
              </div>
              <strong className="text-blue-400 block mt-3">
                Tem certeza que deseja salvar estas alterações?
              </strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              className="bg-gray-700 text-white hover:bg-gray-600"
              disabled={saving}
            >
              Não, voltar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSave}
              disabled={saving}
              className="bg-urbana-gold text-black hover:bg-urbana-gold/90"
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
