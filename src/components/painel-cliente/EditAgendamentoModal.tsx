
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, Save, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

  // Gerar horários disponíveis com base no horário atual e data selecionada
  const gerarHorariosDisponiveis = () => {
    if (!formData.data) return [];
    
    const selectedDate = new Date(formData.data);
    const now = new Date();
    const isToday = selectedDate.getDate() === now.getDate() &&
                   selectedDate.getMonth() === now.getMonth() &&
                   selectedDate.getFullYear() === now.getFullYear();

    const horarios = [];
    
    // Horário de funcionamento: 09:00 às 20:00
    for (let hora = 9; hora < 20; hora++) {
      for (let minuto = 0; minuto < 60; minuto += 30) {
        const horaFormatada = `${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}`;
        
        // Se for hoje, permitir horários até 10 minutos após passar
        if (isToday) {
          const slotTime = new Date(now);
          slotTime.setHours(hora, minuto, 0, 0);
          
          // Permitir até 10 minutos depois do horário passar
          const minTime = new Date(now.getTime() - 10 * 60 * 1000);
          
          if (slotTime < minTime) {
            continue;
          }
        }
        
        horarios.push(horaFormatada);
      }
    }
    
    return horarios;
  };

  // Gerar datas disponíveis com base nas regras de negócio
  const gerarDatasDisponiveis = () => {
    const datas = [];
    const now = new Date();
    const currentHour = now.getHours();
    
    // Se já passou das 20h, começar de amanhã
    const startDay = currentHour >= 20 ? 1 : 0;
    
    for (let i = startDay; i <= 30; i++) {
      const data = addDays(new Date(), i);
      
      // Não incluir domingos (0 = domingo)
      if (data.getDay() !== 0) {
        datas.push({
          value: format(data, 'yyyy-MM-dd'),
          label: format(data, "EEEE, dd 'de' MMMM", { locale: ptBR })
        });
      }
    }
    
    return datas;
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

  const horariosDisponiveis = gerarHorariosDisponiveis();
  const datasDisponiveis = gerarDatasDisponiveis();

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
              <Label className="text-white flex items-center gap-2">
                <Calendar className="h-4 w-4 text-purple-400" />
                Data
              </Label>
              <Select 
                value={formData.data} 
                onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, data: value, hora: '' })); // Limpar hora ao mudar data
                }}
              >
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                  <SelectValue placeholder="Selecione uma data" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  {datasDisponiveis.map((data) => (
                    <SelectItem key={data.value} value={data.value} className="text-white">
                      {data.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-white flex items-center gap-2">
                <Clock className="h-4 w-4 text-purple-400" />
                Hora
              </Label>
              <Select 
                value={formData.hora} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, hora: value }))}
                disabled={!formData.data}
              >
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                  <SelectValue 
                    placeholder={
                      !formData.data 
                        ? "Selecione uma data primeiro" 
                        : horariosDisponiveis.length === 0 
                          ? "Nenhum horário disponível" 
                          : "Selecione um horário"
                    } 
                  />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  {horariosDisponiveis.length > 0 ? (
                    horariosDisponiveis.map((hora) => (
                      <SelectItem key={hora} value={hora} className="text-white">
                        {hora}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-gray-500 text-sm text-center">
                      {!formData.data ? 'Selecione uma data primeiro' : 'Nenhum horário disponível'}
                    </div>
                  )}
                </SelectContent>
              </Select>
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
