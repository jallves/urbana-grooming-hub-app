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
    } finally {
      setLoading(false);
    }
  };

  if (!appointment) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-gray-900 text-gray-100 border border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-gray-100">
            Editar Agendamento
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-gray-300">Cliente</Label>
            <Input 
              value={appointment.painel_clientes?.nome || ''} 
              disabled 
              className="bg-gray-800 text-gray-200 border-gray-700"
            />
          </div>

          <div>
            <Label htmlFor="data" className="text-gray-300">Data</Label>
            <Input
              id="data"
              type="date"
              value={formData.data}
              onChange={(e) => setFormData(prev => ({ ...prev, data: e.target.value }))}
              required
              className="bg-gray-800 text-gray-200 border-gray-700"
            />
          </div>

          <div>
            <Label htmlFor="hora" className="text-gray-300">Horário</Label>
            <Input
              id="hora"
              type="time"
              value={formData.hora}
              onChange={(e) => setFormData(prev => ({ ...prev, hora: e.target.value }))}
              required
              className="bg-gray-800 text-gray-200 border-gray-700"
            />
          </div>

          <div>
            <Label className="text-gray-300">Barbeiro</Label>
            <Select value={formData.barbeiro_id} onValueChange={(value) => setFormData(prev => ({ ...prev, barbeiro_id: value }))}>
              <SelectTrigger className="bg-gray-800 text-gray-200 border-gray-700">
                <SelectValue placeholder="Selecione um barbeiro" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700 text-gray-100">
                {barbeiros.map((barbeiro) => (
                  <SelectItem key={barbeiro.id} value={barbeiro.id} className="hover:bg-gray-800">
                    {barbeiro.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-gray-300">Serviço</Label>
            <Select value={formData.servico_id} onValueChange={(value) => setFormData(prev => ({ ...prev, servico_id: value }))}>
              <SelectTrigger className="bg-gray-800 text-gray-200 border-gray-700">
                <SelectValue placeholder="Selecione um serviço" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700 text-gray-100">
                {servicos.map((servico) => (
                  <SelectItem key={servico.id} value={servico.id} className="hover:bg-gray-800">
                    {servico.nome} - R$ {servico.preco.toFixed(2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-gray-600 text-gray-200 hover:bg-gray-800"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
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
