import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2, UserPlus, Users, Search } from 'lucide-react';
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

interface BarberEncaixeModalProps {
  isOpen: boolean;
  onClose: () => void;
  barberId: string;
  /** Pre-selected slot info when triggered from a specific appointment card */
  slotDate?: string; // yyyy-MM-dd
  slotTime?: string; // HH:mm
  onSuccess: () => void;
}

interface PainelServico {
  id: string;
  nome: string;
  preco: number;
  duracao: number;
}

interface PainelCliente {
  id: string;
  nome: string;
  whatsapp: string | null;
  email: string | null;
}

type ClientMode = 'existing' | 'new';

const BarberEncaixeModal: React.FC<BarberEncaixeModalProps> = ({
  isOpen,
  onClose,
  barberId,
  slotDate,
  slotTime,
  onSuccess
}) => {
  const [services, setServices] = useState<PainelServico[]>([]);
  const [clients, setClients] = useState<PainelCliente[]>([]);
  const [filteredClients, setFilteredClients] = useState<PainelCliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Form state
  const [clientMode, setClientMode] = useState<ClientMode>('existing');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [clientSearch, setClientSearch] = useState('');
  const [newClientName, setNewClientName] = useState('');
  const [newClientWhatsapp, setNewClientWhatsapp] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>(slotTime || '');
  const [selectedDate, setSelectedDate] = useState<string>(slotDate || '');

  // Check if slot already has an encaixe
  const [hasEncaixe, setHasEncaixe] = useState(false);
  const [checkingEncaixe, setCheckingEncaixe] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchServices();
      fetchClients();
      if (slotDate) setSelectedDate(slotDate);
      if (slotTime) setSelectedTime(slotTime);
    } else {
      resetForm();
    }
  }, [isOpen, slotDate, slotTime]);

  // Check encaixe limit when date/time changes
  useEffect(() => {
    if (selectedDate && selectedTime && barberId) {
      checkEncaixeLimit();
    }
  }, [selectedDate, selectedTime, barberId]);

  // Filter clients based on search
  useEffect(() => {
    if (!clientSearch.trim()) {
      setFilteredClients(clients.slice(0, 20));
    } else {
      const search = clientSearch.toLowerCase();
      setFilteredClients(
        clients.filter(c =>
          c.nome.toLowerCase().includes(search) ||
          c.whatsapp?.includes(search) ||
          c.email?.toLowerCase().includes(search)
        ).slice(0, 20)
      );
    }
  }, [clientSearch, clients]);

  const resetForm = () => {
    setClientMode('existing');
    setSelectedClientId('');
    setClientSearch('');
    setNewClientName('');
    setNewClientWhatsapp('');
    setSelectedServiceId('');
    setSelectedTime(slotTime || '');
    setSelectedDate(slotDate || '');
    setHasEncaixe(false);
  };

  const checkEncaixeLimit = async () => {
    setCheckingEncaixe(true);
    try {
      const { count, error } = await supabase
        .from('painel_agendamentos')
        .select('id', { count: 'exact', head: true })
        .eq('barbeiro_id', barberId)
        .eq('data', selectedDate)
        .eq('hora', selectedTime)
        .eq('is_encaixe', true)
        .not('status', 'in', '(\\\"cancelado\\\")');

      if (error) throw error;
      setHasEncaixe((count || 0) >= 1);
    } catch (error) {
      console.error('Erro ao verificar encaixe:', error);
    } finally {
      setCheckingEncaixe(false);
    }
  };

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('painel_servicos')
        .select('id, nome, preco, duracao')
        .eq('is_active', true)
        .order('nome');
      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Erro ao buscar serviços:', error);
    }
  };

  const fetchClients = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('painel_clientes')
        .select('id, nome, whatsapp, email')
        .order('nome')
        .limit(500);
      if (error) throw error;
      setClients(data || []);
      setFilteredClients((data || []).slice(0, 20));
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Verificar se o horário é retroativo (passado)
  const isSlotInPast = (): boolean => {
    if (!selectedDate || !selectedTime) return false;
    const now = new Date();
    const [year, month, day] = selectedDate.split('-').map(Number);
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const slotDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
    return slotDate <= now;
  };

  const handleSaveClick = () => {
    if (!selectedDate || !selectedTime || !selectedServiceId) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    if (clientMode === 'existing' && !selectedClientId) {
      toast.error('Selecione um cliente');
      return;
    }
    if (clientMode === 'new' && !newClientName.trim()) {
      toast.error('Informe o nome do cliente');
      return;
    }
    if (hasEncaixe) {
      toast.error('Este horário já possui um encaixe (limite: 1 por slot)');
      return;
    }
    if (isSlotInPast()) {
      toast.error('Não é possível criar encaixe em horário retroativo', {
        description: 'Selecione um horário futuro para o encaixe.'
      });
      return;
    }
    setShowConfirmDialog(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let clienteId = selectedClientId;

      // Create new client if needed
      if (clientMode === 'new') {
        const { data: newClient, error: clientError } = await supabase
          .from('painel_clientes')
          .insert({
            nome: newClientName.trim(),
            whatsapp: newClientWhatsapp.trim() || null,
          })
          .select('id')
          .single();

        if (clientError) throw clientError;
        clienteId = newClient.id;
      }

      // Create the encaixe appointment
      const { error } = await supabase
        .from('painel_agendamentos')
        .insert({
          barbeiro_id: barberId,
          cliente_id: clienteId,
          servico_id: selectedServiceId,
          data: selectedDate,
          hora: selectedTime,
          status: 'agendado',
          is_encaixe: true,
          notas: '⚡ Encaixe',
        });

      if (error) throw error;

      const service = services.find(s => s.id === selectedServiceId);
      toast.success('⚡ Encaixe criado com sucesso!', {
        description: `${format(parseISO(selectedDate), "dd/MM/yyyy", { locale: ptBR })} às ${selectedTime} - ${service?.nome || 'Serviço'}`,
      });

      onSuccess();
      onClose();
      setShowConfirmDialog(false);
    } catch (error: any) {
      console.error('Erro ao criar encaixe:', error);
      toast.error('Erro ao criar encaixe', { description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const selectedService = services.find(s => s.id === selectedServiceId);
  const selectedClient = clients.find(c => c.id === selectedClientId);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-urbana-black/95 backdrop-blur-2xl border border-purple-500/30 shadow-2xl shadow-purple-500/10 text-urbana-light w-[95vw] sm:w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-urbana-light text-lg sm:text-xl flex items-center gap-2">
            <span className="text-purple-400">⚡</span> Novo Encaixe
          </DialogTitle>
          <p className="text-xs text-urbana-light/50 mt-1">
            Encaixar um cliente em um horário já ocupado
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Slot info */}
          {slotDate && slotTime && (
            <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
              <p className="text-xs text-purple-400 font-medium mb-1">Horário do Encaixe</p>
              <p className="text-urbana-light text-sm font-semibold">
                📅 {format(parseISO(slotDate), "dd/MM/yyyy (EEEE)", { locale: ptBR })} às 🕐 {slotTime}
              </p>
            </div>
          )}

          {/* Encaixe limit warning */}
          {hasEncaixe && (
            <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
              <p className="text-red-400 text-xs font-medium">
                ⚠️ Este horário já possui 1 encaixe (limite máximo atingido)
              </p>
            </div>
          )}

          {/* Date/Time selection (when not pre-selected) */}
          {!slotDate && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-urbana-light/70 text-xs">Data</Label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-urbana-black/40 border-urbana-gold/20 text-urbana-light h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-urbana-light/70 text-xs">Horário</Label>
                <Input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="bg-urbana-black/40 border-urbana-gold/20 text-urbana-light h-9 text-sm"
                />
              </div>
            </div>
          )}

          {/* Service selection */}
          <div className="space-y-1.5">
            <Label className="text-urbana-light/70 text-xs">Serviço</Label>
            <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
              <SelectTrigger className="bg-urbana-black/40 border-urbana-gold/20 text-urbana-light h-9 text-sm">
                <SelectValue placeholder="Selecione o serviço" />
              </SelectTrigger>
              <SelectContent className="bg-urbana-black/95 backdrop-blur-2xl border-urbana-gold/20">
                {services.map(s => (
                  <SelectItem key={s.id} value={s.id} className="text-sm text-urbana-light">
                    {s.nome} - R$ {s.preco.toFixed(2)} ({s.duracao}min)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Client mode toggle */}
          <div className="space-y-1.5">
            <Label className="text-urbana-light/70 text-xs">Cliente</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant={clientMode === 'existing' ? 'default' : 'outline'}
                onClick={() => setClientMode('existing')}
                className={`flex-1 h-8 text-xs touch-manipulation ${
                  clientMode === 'existing'
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'border-urbana-gold/20 text-urbana-light/70 hover:bg-urbana-gold/10 bg-transparent'
                }`}
              >
                <Users className="h-3.5 w-3.5 mr-1" />
                Cadastrado
              </Button>
              <Button
                type="button"
                size="sm"
                variant={clientMode === 'new' ? 'default' : 'outline'}
                onClick={() => setClientMode('new')}
                className={`flex-1 h-8 text-xs touch-manipulation ${
                  clientMode === 'new'
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'border-urbana-gold/20 text-urbana-light/70 hover:bg-urbana-gold/10 bg-transparent'
                }`}
              >
                <UserPlus className="h-3.5 w-3.5 mr-1" />
                Novo Cliente
              </Button>
            </div>
          </div>

          {/* Existing client search/select */}
          {clientMode === 'existing' && (
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-urbana-light/40" />
                <Input
                  placeholder="Buscar cliente por nome ou telefone..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  className="bg-urbana-black/40 border-urbana-gold/20 text-urbana-light h-9 text-sm pl-8"
                />
              </div>

              <div className="max-h-40 overflow-y-auto space-y-1 border border-urbana-gold/10 rounded-lg p-1.5">
                {loading ? (
                  <div className="flex justify-center py-3">
                    <Loader2 className="h-5 w-5 animate-spin text-urbana-gold" />
                  </div>
                ) : filteredClients.length === 0 ? (
                  <p className="text-xs text-urbana-light/40 text-center py-3">
                    Nenhum cliente encontrado
                  </p>
                ) : (
                  filteredClients.map(client => (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => setSelectedClientId(client.id)}
                      className={`w-full text-left px-2.5 py-2 rounded-md text-xs transition-colors touch-manipulation ${
                        selectedClientId === client.id
                          ? 'bg-purple-600/30 border border-purple-500/40 text-purple-300'
                          : 'hover:bg-urbana-gold/10 text-urbana-light/80'
                      }`}
                    >
                      <p className="font-medium truncate">{client.nome}</p>
                      {client.whatsapp && (
                        <p className="text-[10px] text-urbana-light/40 mt-0.5">{client.whatsapp}</p>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* New client form */}
          {clientMode === 'new' && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-urbana-light/70 text-xs">Nome *</Label>
                <Input
                  placeholder="Nome do cliente"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="bg-urbana-black/40 border-urbana-gold/20 text-urbana-light h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-urbana-light/70 text-xs">WhatsApp</Label>
                <Input
                  placeholder="(00) 00000-0000"
                  value={newClientWhatsapp}
                  onChange={(e) => setNewClientWhatsapp(e.target.value)}
                  className="bg-urbana-black/40 border-urbana-gold/20 text-urbana-light h-9 text-sm"
                />
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={saving}
              className="w-full sm:flex-1 h-10 border-urbana-gold/20 text-urbana-light/70 hover:bg-urbana-gold/10 text-sm touch-manipulation bg-transparent"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveClick}
              disabled={saving || hasEncaixe || checkingEncaixe || !selectedDate || !selectedTime || !selectedServiceId || isSlotInPast()}
              className="w-full sm:flex-1 h-10 bg-purple-600 text-white hover:bg-purple-700 text-sm touch-manipulation font-semibold"
            >
              ⚡ Criar Encaixe
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Confirmation dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="bg-urbana-black/95 backdrop-blur-2xl border-purple-500/20 w-[90vw] max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-urbana-light text-base sm:text-lg">
              Confirmar encaixe?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-urbana-light/60 text-sm">
              Você está criando um encaixe:
              <div className="mt-3 p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                <p className="text-urbana-light font-medium text-sm">
                  👤 {clientMode === 'existing' ? selectedClient?.nome : newClientName}
                </p>
                <p className="text-urbana-light font-medium text-sm">
                  📅 {selectedDate && format(parseISO(selectedDate), "dd/MM/yyyy", { locale: ptBR })} às 🕐 {selectedTime}
                </p>
                <p className="text-urbana-light font-medium text-sm truncate">
                  ✂️ {selectedService?.nome}
                </p>
              </div>
              <strong className="text-purple-400 block mt-3 text-sm">
                ⚡ Este agendamento será marcado como ENCAIXE
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
              className="bg-purple-600 text-white hover:bg-purple-700 w-full sm:w-auto h-10 text-sm touch-manipulation font-semibold"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Salvando...
                </>
              ) : (
                '⚡ Confirmar Encaixe'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
};

export default BarberEncaixeModal;
