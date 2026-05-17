import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2, UserPlus, Users, Search, Zap, X, Plus, Minus } from 'lucide-react';

interface BarberEncaixeModalProps {
  isOpen: boolean;
  onClose: () => void;
  barberId: string;
  slotDate?: string;
  slotTime?: string;
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
  const [step, setStep] = useState<'form' | 'confirm'>('form');

  const [clientMode, setClientMode] = useState<ClientMode>('existing');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [clientSearch, setClientSearch] = useState('');
  const [newClientName, setNewClientName] = useState('');
  const [newClientWhatsapp, setNewClientWhatsapp] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  // Serviços adicionais do encaixe (quantidade por id). 1º item = principal.
  const [extraServiceIds, setExtraServiceIds] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string>(slotTime || '');
  const [selectedDate, setSelectedDate] = useState<string>(slotDate || '');

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
    setExtraServiceIds([]);
    setSelectedTime(slotTime || '');
    setSelectedDate(slotDate || '');
    setStep('form');
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

  const handleNext = () => {
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
    setStep('confirm');
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

      // Monta servicos_extras a partir dos IDs adicionais
      const extrasPayload = extraServiceIds
        .map((id) => services.find((s) => s.id === id))
        .filter(Boolean)
        .map((s) => ({ id: s!.id, nome: s!.nome, preco: s!.preco, duracao: s!.duracao }));

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
          servicos_extras: extrasPayload.length > 0 ? extrasPayload : null,
        });

      if (error) throw error;

      const service = services.find(s => s.id === selectedServiceId);
      toast.success('Encaixe criado!', {
        description: `${format(parseISO(selectedDate), "dd/MM", { locale: ptBR })} ${selectedTime} · ${service?.nome}`,
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Erro ao criar encaixe:', error);
      toast.error('Erro ao criar encaixe', { description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const selectedService = services.find(s => s.id === selectedServiceId);
  const selectedClient = clients.find(c => c.id === selectedClientId);

  const addExtraService = (id: string) => setExtraServiceIds((prev) => [...prev, id]);
  const removeExtraService = (id: string) => {
    setExtraServiceIds((prev) => {
      const idx = prev.indexOf(id);
      if (idx === -1) return prev;
      const next = [...prev];
      next.splice(idx, 1);
      return next;
    });
  };
  const extraQty = (id: string) => extraServiceIds.filter((x) => x === id).length;

  const totalDuration =
    (selectedService?.duracao || 0) +
    extraServiceIds.reduce((sum, id) => sum + (services.find((s) => s.id === id)?.duracao || 0), 0);
  const totalPrice =
    (selectedService?.preco || 0) +
    extraServiceIds.reduce((sum, id) => sum + (services.find((s) => s.id === id)?.preco || 0), 0);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white w-[100vw] sm:w-full max-w-md p-0 gap-0 rounded-none sm:rounded-xl h-[100dvh] sm:h-auto sm:max-h-[85vh] flex flex-col [&>button]:hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Novo Encaixe</h2>
              {step === 'form' && (
                <p className="text-[10px] text-gray-500">Preencha os dados</p>
              )}
              {step === 'confirm' && (
                <p className="text-[10px] text-purple-400">Confirme os dados</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white touch-manipulation"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {step === 'form' && (
            <div className="px-4 py-3 space-y-3">
              {/* Date/Time */}
              {slotDate && slotTime ? (
                <div className="flex items-center gap-3 px-3 py-2.5 bg-gray-800 rounded-lg">
                  <span className="text-xs text-gray-400">Data/Hora</span>
                  <span className="text-sm font-semibold text-white ml-auto">
                    {format(parseISO(slotDate), "dd/MM", { locale: ptBR })} · {slotTime}
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase tracking-wider font-medium mb-1 block">Data</label>
                    <Input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white h-10 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase tracking-wider font-medium mb-1 block">Horário</label>
                    <Input
                      type="time"
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white h-10 text-sm"
                    />
                  </div>
                </div>
              )}

              {/* Service */}
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider font-medium mb-1 block">Serviço</label>
                <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white h-10 text-sm">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {services.map(s => (
                      <SelectItem key={s.id} value={s.id} className="text-sm text-white focus:bg-gray-700 focus:text-white">
                        {s.nome} · R$ {s.preco.toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedService && (
                  <p className="text-[10px] text-gray-500 mt-1">{selectedService.duracao}min · R$ {selectedService.preco.toFixed(2)}</p>
                )}

                {/* Serviços adicionais (encaixe múltiplo) */}
                {selectedServiceId && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">
                        Serviços adicionais
                      </label>
                      <span className="text-[10px] text-purple-400 font-semibold">
                        Total: {totalDuration}min · R$ {totalPrice.toFixed(2)}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-1.5 max-h-40 overflow-y-auto">
                      {services.map((s) => {
                        const qty = extraQty(s.id);
                        return (
                          <div
                            key={s.id}
                            className="flex items-center justify-between gap-2 px-2.5 py-1.5 bg-gray-800 border border-gray-700 rounded-lg"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-xs text-white truncate">{s.nome}</p>
                              <p className="text-[10px] text-gray-500">{s.duracao}min · R$ {s.preco.toFixed(2)}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => removeExtraService(s.id)}
                                disabled={qty === 0}
                                className="w-7 h-7 rounded-md bg-red-900/40 text-red-300 disabled:opacity-30 flex items-center justify-center touch-manipulation"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="w-5 text-center text-xs font-bold text-white">{qty}</span>
                              <button
                                type="button"
                                onClick={() => addExtraService(s.id)}
                                className="w-7 h-7 rounded-md bg-purple-600 text-white flex items-center justify-center touch-manipulation"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-[10px] text-gray-500 italic">
                      Encaixe livre — clique + para adicionar o mesmo serviço várias vezes
                    </p>
                  </div>
                )}
              </div>

              {/* Client mode */}
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider font-medium mb-1.5 block">Cliente</label>
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-gray-800 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setClientMode('existing')}
                    className={`flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-colors touch-manipulation ${
                      clientMode === 'existing'
                        ? 'bg-purple-600 text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Users className="h-3.5 w-3.5" />
                    Cadastrado
                  </button>
                  <button
                    type="button"
                    onClick={() => setClientMode('new')}
                    className={`flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-colors touch-manipulation ${
                      clientMode === 'new'
                        ? 'bg-purple-600 text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    Novo
                  </button>
                </div>
              </div>

              {/* Existing client */}
              {clientMode === 'existing' && (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
                    <Input
                      placeholder="Buscar nome ou telefone..."
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white h-10 text-sm pl-9"
                    />
                  </div>
                  <div className="max-h-36 overflow-y-auto space-y-0.5 overscroll-contain">
                    {loading ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                      </div>
                    ) : filteredClients.length === 0 ? (
                      <p className="text-xs text-gray-600 text-center py-4">Nenhum cliente</p>
                    ) : (
                      filteredClients.map(client => (
                        <button
                          key={client.id}
                          type="button"
                          onClick={() => setSelectedClientId(client.id)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors touch-manipulation ${
                            selectedClientId === client.id
                              ? 'bg-purple-600/20 text-purple-300'
                              : 'text-gray-300 hover:bg-gray-800'
                          }`}
                        >
                          <p className="font-medium truncate">{client.nome}</p>
                          {client.whatsapp && (
                            <p className="text-[10px] text-gray-500 mt-0.5">{client.whatsapp}</p>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* New client */}
              {clientMode === 'new' && (
                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase tracking-wider font-medium mb-1 block">Nome *</label>
                    <Input
                      placeholder="Nome do cliente"
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white h-10 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase tracking-wider font-medium mb-1 block">WhatsApp</label>
                    <Input
                      placeholder="(00) 00000-0000"
                      value={newClientWhatsapp}
                      onChange={(e) => setNewClientWhatsapp(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white h-10 text-sm"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Confirm step */}
          {step === 'confirm' && (
            <div className="px-4 py-4 space-y-3">
              <div className="space-y-1">
                {[
                  { label: 'Cliente', value: clientMode === 'existing' ? selectedClient?.nome : newClientName },
                  { label: 'Serviço', value: selectedService?.nome },
                  { label: 'Valor', value: `R$ ${selectedService?.preco.toFixed(2)}` },
                  { label: 'Data', value: selectedDate ? format(parseISO(selectedDate), "dd/MM/yyyy", { locale: ptBR }) : '' },
                  { label: 'Horário', value: selectedTime },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2.5 border-b border-gray-800 last:border-0">
                    <span className="text-xs text-gray-500">{item.label}</span>
                    <span className="text-sm font-medium text-white">{item.value}</span>
                  </div>
                ))}
              </div>
              <div className="px-3 py-2 bg-purple-950/50 border border-purple-900 rounded-lg">
                <p className="text-xs text-purple-400 font-medium text-center">
                  ⚡ Será registrado como ENCAIXE
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-gray-800 px-4 py-3 bg-gray-900">
          {step === 'form' ? (
            <Button
              onClick={handleNext}
              disabled={!selectedDate || !selectedTime || !selectedServiceId}
              className="w-full h-11 bg-purple-600 text-white hover:bg-purple-700 text-sm font-semibold touch-manipulation disabled:opacity-40"
            >
              Continuar
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setStep('form')}
                disabled={saving}
                className="flex-1 h-11 bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 text-sm touch-manipulation"
              >
                Voltar
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 h-11 bg-purple-600 text-white hover:bg-purple-700 text-sm font-semibold touch-manipulation"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  '⚡ Confirmar'
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BarberEncaixeModal;
