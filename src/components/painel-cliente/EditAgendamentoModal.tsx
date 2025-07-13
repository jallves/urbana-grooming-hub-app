
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, Save, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

interface Agendamento {
  id: string;
  data: string;
  hora: string;
  status: string;
  painel_barbeiros: {
    nome: string;
  };
  painel_servicos: {
    nome: string;
    preco: number;
    duracao: number;
  };
}

interface Barbeiro {
  id: string;
  nome: string;
}

interface Servico {
  id: string;
  nome: string;
  preco: number;
  duracao: number;
}

interface EditAgendamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  agendamento: Agendamento | null;
  onUpdate: () => void;
}

export default function EditAgendamentoModal({ isOpen, onClose, agendamento, onUpdate }: EditAgendamentoModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  
  const [formData, setFormData] = useState({
    data: '',
    hora: '',
    barbeiro_id: '',
    servico_id: ''
  });

  useEffect(() => {
    if (agendamento) {
      setFormData({
        data: agendamento.data,
        hora: agendamento.hora,
        barbeiro_id: '',
        servico_id: ''
      });
    }
  }, [agendamento]);

  useEffect(() => {
    if (isOpen) {
      fetchBarbeiros();
      fetchServicos();
    }
  }, [isOpen]);

  const fetchBarbeiros = async () => {
    const { data } = await supabase.from('painel_barbeiros').select('*');
    if (data) setBarbeiros(data);
  };

  const fetchServicos = async () => {
    const { data } = await supabase.from('painel_servicos').select('*');
    if (data) setServicos(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updateData: any = {
        data: formData.data,
        hora: formData.hora
      };

      // Só incluir barbeiro_id e servico_id se foram selecionados
      if (formData.barbeiro_id) {
        updateData.barbeiro_id = formData.barbeiro_id;
      }
      if (formData.servico_id) {
        updateData.servico_id = formData.servico_id;
      }

      const { error } = await supabase
        .from('painel_agendamentos')
        .update(updateData)
        .eq('id', agendamento?.id);

      if (error) throw error;

      toast({
        title: "✅ Alterado com sucesso!",
        description: "Seu agendamento foi atualizado com sucesso.",
        duration: 4000,
      });

      onUpdate();
      onClose();
    } catch (error) {
      console.error('Erro ao atualizar agendamento:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar o agendamento.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!agendamento) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Editar Agendamento
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data" className="text-white flex items-center gap-2">
                <Calendar className="h-4 w-4 text-purple-400" />
                Data
              </Label>
              <Input
                id="data"
                type="date"
                value={formData.data}
                onChange={(e) => setFormData(prev => ({ ...prev, data: e.target.value }))}
                className="bg-slate-800 border-slate-600 text-white"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hora" className="text-white flex items-center gap-2">
                <Clock className="h-4 w-4 text-purple-400" />
                Hora
              </Label>
              <Input
                id="hora"
                type="time"
                value={formData.hora}
                onChange={(e) => setFormData(prev => ({ ...prev, hora: e.target.value }))}
                className="bg-slate-800 border-slate-600 text-white"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-white">Barbeiro (Opcional)</Label>
            <Select
              value={formData.barbeiro_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, barbeiro_id: value }))}
            >
              <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                <SelectValue placeholder="Manter barbeiro atual ou selecionar novo" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                {barbeiros.map((barbeiro) => (
                  <SelectItem key={barbeiro.id} value={barbeiro.id} className="text-white">
                    {barbeiro.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-white">Serviço (Opcional)</Label>
            <Select
              value={formData.servico_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, servico_id: value }))}
            >
              <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                <SelectValue placeholder="Manter serviço atual ou selecionar novo" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                {servicos.map((servico) => (
                  <SelectItem key={servico.id} value={servico.id} className="text-white">
                    {servico.nome} - R$ {servico.preco.toFixed(2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
            >
              {loading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-slate-600 text-white hover:bg-slate-800"
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
