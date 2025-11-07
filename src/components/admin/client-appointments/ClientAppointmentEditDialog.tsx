import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ClientAppointmentEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId: string;
  onUpdate: (id: string, data: any) => Promise<boolean>;
}

const ClientAppointmentEditDialog: React.FC<ClientAppointmentEditDialogProps> = ({
  isOpen,
  onClose,
  appointmentId,
  onUpdate
}) => {
  const [loading, setLoading] = useState(false);
  const [appointment, setAppointment] = useState<any>(null);
  const [barbeiros, setBarbeiros] = useState<any[]>([]);
  const [servicos, setServicos] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    data: '',
    hora: '',
    barbeiro_id: '',
    servico_id: ''
  });

  useEffect(() => {
    if (isOpen && appointmentId) {
      loadAppointmentData();
      loadBarbeiros();
      loadServicos();
    }
  }, [isOpen, appointmentId]);

  const loadAppointmentData = async () => {
    try {
      const { data, error } = await supabase
        .from('painel_agendamentos')
        .select(`
          *,
          painel_clientes(nome, email, whatsapp),
          painel_barbeiros(nome),
          painel_servicos(nome)
        `)
        .eq('id', appointmentId)
        .single();

      if (error) throw error;

      setAppointment(data);
      setFormData({
        data: data.data,
        hora: data.hora,
        barbeiro_id: data.barbeiro_id,
        servico_id: data.servico_id
      });
    } catch (error) {
      console.error('Error loading appointment:', error);
      toast.error('Erro ao carregar dados do agendamento');
    }
  };

  const loadBarbeiros = async () => {
    try {
      const { data, error } = await supabase
        .from('painel_barbeiros')
        .select('*')
        .order('nome');

      if (error) throw error;
      setBarbeiros(data || []);
    } catch (error) {
      console.error('Error loading barbeiros:', error);
    }
  };

  const loadServicos = async () => {
    try {
      const { data, error } = await supabase
        .from('painel_servicos')
        .select('*')
        .order('nome');

      if (error) throw error;
      setServicos(data || []);
    } catch (error) {
      console.error('Error loading servicos:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const success = await onUpdate(appointmentId, formData);
      if (success) {
        onClose();
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast.error('Erro ao atualizar agendamento');
    } finally {
      setLoading(false);
    }
  };

  if (!appointment) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full bg-white text-gray-900 border border-gray-200">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-gray-900">
            Editar Agendamento
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 w-full">
          <div>
            <Label className="text-gray-700">Cliente</Label>
            <Input
              value={appointment.painel_clientes?.nome || ''}
              disabled
              className="bg-gray-100 text-gray-700 border-gray-300 w-full"
            />
          </div>

          <div>
            <Label htmlFor="data" className="text-gray-700">Data</Label>
            <Input
              id="data"
              type="date"
              value={formData.data}
              onChange={(e) => setFormData(prev => ({ ...prev, data: e.target.value }))}
              required
              className="bg-white text-gray-900 border-gray-300 w-full"
            />
          </div>

          <div>
            <Label htmlFor="hora" className="text-gray-700">Horário</Label>
            <Input
              id="hora"
              type="time"
              value={formData.hora}
              onChange={(e) => setFormData(prev => ({ ...prev, hora: e.target.value }))}
              required
              className="bg-white text-gray-900 border-gray-300 w-full"
            />
          </div>

          <div>
            <Label className="text-gray-700">Barbeiro</Label>
            <Select
              value={formData.barbeiro_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, barbeiro_id: value }))}
            >
              <SelectTrigger className="bg-white text-gray-900 border-gray-300 w-full">
                <SelectValue placeholder="Selecione um barbeiro" />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200 text-gray-900 max-h-60 overflow-auto">
                {barbeiros.map((barbeiro) => (
                  <SelectItem
                    key={barbeiro.id}
                    value={barbeiro.id}
                    className="hover:bg-gray-100"
                  >
                    {barbeiro.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-gray-700">Serviço</Label>
            <Select
              value={formData.servico_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, servico_id: value }))}
            >
              <SelectTrigger className="bg-white text-gray-900 border-gray-300 w-full">
                <SelectValue placeholder="Selecione um serviço" />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200 text-gray-900 max-h-60 overflow-auto">
                {servicos.map((servico) => (
                  <SelectItem
                    key={servico.id}
                    value={servico.id}
                    className="hover:bg-gray-100"
                  >
                    {servico.nome} - R$ {servico.preco.toFixed(2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-4 flex-col sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="w-full sm:flex-1 border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="w-full sm:flex-1 bg-gradient-to-r from-urbana-gold to-yellow-500 hover:from-urbana-gold/90 hover:to-yellow-600 text-white"
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ClientAppointmentEditDialog;
