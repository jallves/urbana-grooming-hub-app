
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EditAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId: string | null;
  currentDate: Date | null;
  onSuccess: () => void;
}

interface PainelServico {
  id: string;
  nome: string;
  preco: number;
  duracao: number;
}

const EditAppointmentModal: React.FC<EditAppointmentModalProps> = ({
  isOpen,
  onClose,
  appointmentId,
  currentDate,
  onSuccess
}) => {
  const [appointment, setAppointment] = useState<any>(null);
  const [services, setServices] = useState<PainelServico[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    data: '',
    hora: '',
    servico_id: ''
  });

  useEffect(() => {
    if (isOpen && appointmentId) {
      fetchAppointment();
      fetchServices();
    }
  }, [isOpen, appointmentId]);

  const fetchAppointment = async () => {
    if (!appointmentId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('painel_agendamentos')
        .select(`
          *,
          painel_clientes(nome, email, whatsapp),
          painel_servicos(nome, preco, duracao)
        `)
        .eq('id', appointmentId)
        .single();

      if (error) throw error;

      setAppointment(data);
      setFormData({
        data: data.data,
        hora: data.hora,
        servico_id: data.servico_id
      });
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
        .order('nome');

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Erro ao buscar serviços:', error);
    }
  };

  const handleSave = async () => {
    if (!appointmentId) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('painel_agendamentos')
        .update({
          data: formData.data,
          hora: formData.hora,
          servico_id: formData.servico_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId);

      if (error) throw error;

      toast.success('Agendamento atualizado com sucesso!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao atualizar agendamento:', error);
      toast.error('Erro ao atualizar agendamento');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !appointmentId) return null;

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-gray-800 border-gray-700">
          <div className="flex justify-center items-center py-8">
            <div className="w-8 h-8 border-2 border-urbana-gold border-t-transparent rounded-full animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Editar Agendamento</DialogTitle>
        </DialogHeader>

        {appointment && (
          <div className="space-y-4">
            <div className="p-3 bg-gray-700/50 rounded-lg">
              <p className="text-sm text-gray-300">Cliente:</p>
              <p className="font-medium text-white">{appointment.painel_clientes.nome}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="data" className="text-gray-300">Data</Label>
              <Input
                id="data"
                type="date"
                value={formData.data}
                onChange={(e) => setFormData(prev => ({ ...prev, data: e.target.value }))}
                className="bg-gray-700/50 border-gray-600 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hora" className="text-gray-300">Horário</Label>
              <Input
                id="hora"
                type="time"
                value={formData.hora}
                onChange={(e) => setFormData(prev => ({ ...prev, hora: e.target.value }))}
                className="bg-gray-700/50 border-gray-600 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="servico" className="text-gray-300">Serviço</Label>
              <Select
                value={formData.servico_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, servico_id: value }))}
              >
                <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white">
                  <SelectValue placeholder="Selecione um serviço" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {services.map(service => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.nome} - R$ {service.preco.toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={saving}
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-urbana-gold text-black hover:bg-urbana-gold/90"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2" />
                    Salvando...
                  </>
                ) : (
                  'Salvar'
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EditAppointmentModal;
