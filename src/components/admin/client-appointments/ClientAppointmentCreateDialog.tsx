import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ClientAppointmentCreateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: () => void;
}

const ClientAppointmentCreateDialog: React.FC<ClientAppointmentCreateDialogProps> = ({
  isOpen,
  onClose,
  onCreate
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [clientes, setClientes] = useState<any[]>([]);
  const [barbeiros, setBarbeiros] = useState<any[]>([]);
  const [servicos, setServicos] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    cliente_id: '',
    barbeiro_id: '',
    servico_id: '',
    data: '',
    hora: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      const [clientesRes, barbeirosRes, servicosRes] = await Promise.all([
        supabase.from('painel_clientes').select('*').order('nome'),
        supabase.from('painel_barbeiros').select('*').eq('is_active', true).order('nome'),
        supabase
          .from('painel_servicos')
          .select('*, service_staff!inner(staff_id)')
          .eq('is_active', true)
          .gt('preco', 0)
          .order('nome')
      ]);

      if (clientesRes.data) setClientes(clientesRes.data);
      if (barbeirosRes.data) setBarbeiros(barbeirosRes.data);
      
      // Remove duplicates (serviços com múltiplos barbeiros)
      if (servicosRes.data) {
        const uniqueServices = servicosRes.data.reduce((acc: any[], curr: any) => {
          if (!acc.find(s => s.id === curr.id)) {
            acc.push(curr);
          }
          return acc;
        }, []);
        setServicos(uniqueServices);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('painel_agendamentos')
        .insert({
          cliente_id: formData.cliente_id,
          barbeiro_id: formData.barbeiro_id,
          servico_id: formData.servico_id,
          data: formData.data,
          hora: formData.hora,
          status: 'agendado'
        });

      if (error) throw error;

      toast.success('Agendamento criado com sucesso!');
      onCreate();
      handleClose();
    } catch (error: any) {
      console.error('Erro ao criar agendamento:', error);
      toast.error(error.message || 'Erro ao criar agendamento');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      cliente_id: '',
      barbeiro_id: '',
      servico_id: '',
      data: '',
      hora: ''
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900">Novo Agendamento</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cliente">Cliente</Label>
            <Select
              value={formData.cliente_id}
              onValueChange={(value) => setFormData({ ...formData, cliente_id: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o cliente" />
              </SelectTrigger>
              <SelectContent>
                {clientes.map((cliente) => (
                  <SelectItem key={cliente.id} value={cliente.id}>
                    {cliente.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="barbeiro">Barbeiro</Label>
            <Select
              value={formData.barbeiro_id}
              onValueChange={(value) => setFormData({ ...formData, barbeiro_id: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o barbeiro" />
              </SelectTrigger>
              <SelectContent>
                {barbeiros.map((barbeiro) => (
                  <SelectItem key={barbeiro.id} value={barbeiro.id}>
                    {barbeiro.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="servico">Serviço</Label>
            <Select
              value={formData.servico_id}
              onValueChange={(value) => setFormData({ ...formData, servico_id: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o serviço" />
              </SelectTrigger>
              <SelectContent>
                {servicos.map((servico) => (
                  <SelectItem key={servico.id} value={servico.id}>
                    {servico.nome} - R$ {servico.preco?.toFixed(2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data">Data</Label>
              <Input
                type="date"
                id="data"
                value={formData.data}
                onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hora">Hora</Label>
              <Input
                type="time"
                id="hora"
                value={formData.hora}
                onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                required
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-gradient-to-r from-urbana-gold to-yellow-600">
              {isLoading ? 'Criando...' : 'Criar Agendamento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ClientAppointmentCreateDialog;
