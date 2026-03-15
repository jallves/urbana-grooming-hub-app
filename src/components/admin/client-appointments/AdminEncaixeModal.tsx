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
import { Loader2, UserPlus, Users, Search, Zap } from 'lucide-react';
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

interface AdminEncaixeModalProps {
  isOpen: boolean;
  onClose: () => void;
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

interface PainelBarbeiro {
  id: string;
  nome: string;
  image_url: string | null;
}

type ClientMode = 'existing' | 'new';

const AdminEncaixeModal: React.FC<AdminEncaixeModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [services, setServices] = useState<PainelServico[]>([]);
  const [clients, setClients] = useState<PainelCliente[]>([]);
  const [barbers, setBarbers] = useState<PainelBarbeiro[]>([]);
  const [filteredClients, setFilteredClients] = useState<PainelCliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Form state
  const [clientMode, setClientMode] = useState<ClientMode>('existing');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [newClientName, setNewClientName] = useState('');
  const [newClientWhatsapp, setNewClientWhatsapp] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedBarberId, setSelectedBarberId] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  const [hasEncaixe, setHasEncaixe] = useState(false);
  const [checkingEncaixe, setCheckingEncaixe] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    } else {
      resetForm();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedDate && selectedTime && selectedBarberId) {
      checkEncaixeLimit();
    }
  }, [selectedDate, selectedTime, selectedBarberId]);

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
    setSelectedBarberId('');
    setSelectedTime('');
    setSelectedDate('');
    setHasEncaixe(false);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [servicesRes, clientsRes, barbersRes] = await Promise.all([
        supabase.from('painel_servicos').select('id, nome, preco, duracao').eq('is_active', true).order('nome'),
        supabase.from('painel_clientes').select('id, nome, whatsapp, email').order('nome').limit(500),
        supabase.from('painel_barbeiros').select('id, nome, image_url').eq('is_active', true).order('nome'),
      ]);

      if (servicesRes.error) throw servicesRes.error;
      if (clientsRes.error) throw clientsRes.error;
      if (barbersRes.error) throw barbersRes.error;

      setServices(servicesRes.data || []);
      setClients(clientsRes.data || []);
      setFilteredClients((clientsRes.data || []).slice(0, 20));
      setBarbers(barbersRes.data || []);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const checkEncaixeLimit = async () => {
    setCheckingEncaixe(true);
    try {
      const { count, error } = await supabase
        .from('painel_agendamentos')
        .select('id', { count: 'exact', head: true })
        .eq('barbeiro_id', selectedBarberId)
        .eq('data', selectedDate)
        .eq('hora', selectedTime)
        .eq('is_encaixe', true)
        .not('status', 'in', '("cancelado")');

      if (error) throw error;
      setHasEncaixe((count || 0) >= 1);
    } catch (error) {
      console.error('Erro ao verificar encaixe:', error);
    } finally {
      setCheckingEncaixe(false);
    }
  };

  const isSlotInPast = (): boolean => {
    if (!selectedDate || !selectedTime) return false;
    const now = new Date();
    const [year, month, day] = selectedDate.split('-').map(Number);
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const slotDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
    return slotDate <= now;
  };

  const handleSaveClick = () => {
    if (!selectedDate || !selectedTime || !selectedServiceId || !selectedBarberId) {
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
      toast.error('Não é possível criar encaixe em horário retroativo');
      return;
    }
    setShowConfirmDialog(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let clienteId = selectedClientId;

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

      const { error } = await supabase
        .from('painel_agendamentos')
        .insert({
          barbeiro_id: selectedBarberId,
          cliente_id: clienteId,
          servico_id: selectedServiceId,
          data: selectedDate,
          hora: selectedTime,
          status: 'agendado',
          is_encaixe: true,
          notas: '⚡ Encaixe (Admin)',
        });

      if (error) throw error;

      const service = services.find(s => s.id === selectedServiceId);
      const barber = barbers.find(b => b.id === selectedBarberId);
      toast.success('⚡ Encaixe criado com sucesso!', {
        description: `${barber?.nome} - ${format(parseISO(selectedDate), "dd/MM/yyyy", { locale: ptBR })} às ${selectedTime} - ${service?.nome || 'Serviço'}`,
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
  const selectedBarber = barbers.find(b => b.id === selectedBarberId);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white border border-gray-200 shadow-2xl text-gray-900 w-[95vw] sm:w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-gray-900 text-lg sm:text-xl flex items-center gap-2">
            <span className="text-purple-600">⚡</span> Novo Encaixe
          </DialogTitle>
          <p className="text-xs text-gray-500 mt-1">
            Encaixar um cliente em um horário já ocupado
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Barbeiro */}
          <div className="space-y-1.5">
            <Label className="text-gray-700 text-xs font-semibold">Barbeiro *</Label>
            <Select value={selectedBarberId} onValueChange={setSelectedBarberId}>
              <SelectTrigger className="bg-gray-50 border-gray-300 text-gray-900 h-9 text-sm">
                <SelectValue placeholder="Selecione o barbeiro" />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200">
                {barbers.map(b => (
                  <SelectItem key={b.id} value={b.id} className="text-sm">
                    {b.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Data/Hora */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-gray-700 text-xs font-semibold">Data *</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-gray-50 border-gray-300 text-gray-900 h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-gray-700 text-xs font-semibold">Horário *</Label>
              <Input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="bg-gray-50 border-gray-300 text-gray-900 h-9 text-sm"
              />
            </div>
          </div>

          {/* Encaixe limit warning */}
          {hasEncaixe && (
            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
              <p className="text-red-700 text-xs font-medium">
                ⚠️ Este horário já possui 1 encaixe (limite máximo atingido)
              </p>
            </div>
          )}

          {/* Serviço */}
          <div className="space-y-1.5">
            <Label className="text-gray-700 text-xs font-semibold">Serviço *</Label>
            <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
              <SelectTrigger className="bg-gray-50 border-gray-300 text-gray-900 h-9 text-sm">
                <SelectValue placeholder="Selecione o serviço" />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200">
                {services.map(s => (
                  <SelectItem key={s.id} value={s.id} className="text-sm">
                    {s.nome} - R$ {s.preco.toFixed(2)} ({s.duracao}min)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cliente mode */}
          <div className="space-y-1.5">
            <Label className="text-gray-700 text-xs font-semibold">Cliente</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                onClick={() => setClientMode('existing')}
                className={`flex-1 h-8 text-xs ${
                  clientMode === 'existing'
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300'
                }`}
              >
                <Users className="h-3.5 w-3.5 mr-1" />
                Cadastrado
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => setClientMode('new')}
                className={`flex-1 h-8 text-xs ${
                  clientMode === 'new'
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300'
                }`}
              >
                <UserPlus className="h-3.5 w-3.5 mr-1" />
                Novo Cliente
              </Button>
            </div>
          </div>

          {clientMode === 'existing' && (
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <Input
                  placeholder="Buscar cliente por nome ou telefone..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  className="bg-gray-50 border-gray-300 text-gray-900 h-9 text-sm pl-8"
                />
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1 border border-gray-200 rounded-lg p-1.5 bg-gray-50">
                {loading ? (
                  <div className="flex justify-center py-3">
                    <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
                  </div>
                ) : filteredClients.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-3">Nenhum cliente encontrado</p>
                ) : (
                  filteredClients.map(client => (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => setSelectedClientId(client.id)}
                      className={`w-full text-left px-2.5 py-2 rounded-md text-xs transition-colors ${
                        selectedClientId === client.id
                          ? 'bg-purple-100 border border-purple-300 text-purple-800'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <p className="font-medium truncate">{client.nome}</p>
                      {client.whatsapp && (
                        <p className="text-[10px] text-gray-400 mt-0.5">{client.whatsapp}</p>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {clientMode === 'new' && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-gray-700 text-xs">Nome *</Label>
                <Input
                  placeholder="Nome do cliente"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="bg-gray-50 border-gray-300 text-gray-900 h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-gray-700 text-xs">WhatsApp</Label>
                <Input
                  placeholder="(00) 00000-0000"
                  value={newClientWhatsapp}
                  onChange={(e) => setNewClientWhatsapp(e.target.value)}
                  className="bg-gray-50 border-gray-300 text-gray-900 h-9 text-sm"
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={saving}
              className="w-full sm:flex-1 h-10 text-sm"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveClick}
              disabled={saving || hasEncaixe || checkingEncaixe || !selectedDate || !selectedTime || !selectedServiceId || !selectedBarberId || isSlotInPast()}
              className="w-full sm:flex-1 h-10 bg-purple-600 text-white hover:bg-purple-700 text-sm font-semibold"
            >
              <Zap className="h-4 w-4 mr-1.5" />
              Criar Encaixe
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Confirmation */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="bg-white border-gray-200 w-[90vw] max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900 text-base sm:text-lg">
              Confirmar encaixe?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 text-sm">
              Você está criando um encaixe:
              <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-gray-900 font-medium text-sm">
                  👤 {clientMode === 'existing' ? selectedClient?.nome : newClientName}
                </p>
                <p className="text-gray-900 font-medium text-sm">
                  💈 {selectedBarber?.nome}
                </p>
                <p className="text-gray-900 font-medium text-sm">
                  📅 {selectedDate && format(parseISO(selectedDate), "dd/MM/yyyy", { locale: ptBR })} às 🕐 {selectedTime}
                </p>
                <p className="text-gray-900 font-medium text-sm truncate">
                  ✂️ {selectedService?.nome}
                </p>
              </div>
              <strong className="text-purple-700 block mt-3 text-sm">
                ⚡ Este agendamento será marcado como ENCAIXE
              </strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto h-10 text-sm" disabled={saving}>
              Não, voltar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSave}
              disabled={saving}
              className="bg-purple-600 text-white hover:bg-purple-700 w-full sm:w-auto h-10 text-sm font-semibold"
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

export default AdminEncaixeModal;
