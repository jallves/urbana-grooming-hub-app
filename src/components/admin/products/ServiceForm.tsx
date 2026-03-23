import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Users, Home, CheckCircle, Layers } from 'lucide-react';

interface ServiceFormProps {
  serviceId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ServiceFormData {
  nome: string;
  descricao: string;
  preco: number;
  duracao: number;
  is_active: boolean;
  exibir_home: boolean;
}

interface StaffMember {
  id: string;
  nome: string;
  email: string | null;
  role: string | null;
}

interface ComboComponent {
  id: string;
  nome: string;
  preco: number;
}

const ServiceForm: React.FC<ServiceFormProps> = ({ serviceId, isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(!!serviceId);
  const [formData, setFormData] = useState<ServiceFormData>({
    nome: '',
    descricao: '',
    preco: 0,
    duracao: 30,
    is_active: true,
    exibir_home: false
  });
  const [allStaff, setAllStaff] = useState<StaffMember[]>([]);
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);

  // Combo state
  const [isCombo, setIsCombo] = useState(false);
  const [availableServices, setAvailableServices] = useState<ComboComponent[]>([]);
  const [selectedComponentIds, setSelectedComponentIds] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadStaff();
      loadAvailableServices();
      if (serviceId) {
        loadServiceData();
      } else {
        resetForm();
      }
    }
  }, [serviceId, isOpen]);

  // Calcular soma individual dos componentes selecionados
  const individualSum = selectedComponentIds.reduce((sum, id) => {
    const svc = availableServices.find(s => s.id === id);
    return sum + (svc?.preco || 0);
  }, 0);

  const comboSavings = isCombo && selectedComponentIds.length >= 2
    ? individualSum - formData.preco
    : 0;

  const loadStaff = async () => {
    try {
      const { data, error } = await supabase
        .from('painel_barbeiros')
        .select('id, nome, email, role')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setAllStaff(data || []);
    } catch (error) {
      console.error('Erro ao carregar barbeiros:', error);
      toast.error('Erro ao carregar lista de barbeiros');
    }
  };

  const loadAvailableServices = async () => {
    try {
      const { data, error } = await supabase
        .from('painel_servicos')
        .select('id, nome, preco')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setAvailableServices(data || []);
    } catch (error) {
      console.error('Erro ao carregar serviços:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      descricao: '',
      preco: 0,
      duracao: 30,
      is_active: true,
      exibir_home: false
    });
    setSelectedStaffIds([]);
    setIsCombo(false);
    setSelectedComponentIds([]);
  };

  const loadServiceData = async () => {
    try {
      setLoadingData(true);
      const { data, error } = await supabase
        .from('painel_servicos')
        .select('*')
        .eq('id', serviceId)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          nome: data.nome || '',
          descricao: data.descricao || '',
          preco: data.preco || 0,
          duracao: data.duracao || 30,
          is_active: data.is_active ?? data.ativo ?? true,
          exibir_home: data.exibir_home ?? false
        });

        // Carregar barbeiros vinculados ao serviço
        const { data: serviceStaff, error: staffError } = await supabase
          .from('service_staff')
          .select('staff_id')
          .eq('service_id', serviceId);

        if (staffError) {
          console.error('Erro ao carregar barbeiros do serviço:', staffError);
        } else {
          setSelectedStaffIds(serviceStaff?.map(s => s.staff_id) || []);
        }

        // Carregar componentes do combo (se existirem)
        const { data: comboItems, error: comboError } = await supabase
          .from('combo_service_items')
          .select('component_service_id')
          .eq('combo_service_id', serviceId);

        if (!comboError && comboItems && comboItems.length > 0) {
          setIsCombo(true);
          setSelectedComponentIds(comboItems.map(c => c.component_service_id));
        } else {
          setIsCombo(false);
          setSelectedComponentIds([]);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar serviço:', error);
      toast.error('Erro ao carregar dados do serviço');
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome.trim()) {
      toast.error('Nome do serviço é obrigatório');
      return;
    }

    if (formData.preco <= 0) {
      toast.error('Preço deve ser maior que zero');
      return;
    }

    if (formData.duracao <= 0) {
      toast.error('Duração deve ser maior que zero');
      return;
    }

    if (isCombo && selectedComponentIds.length < 2) {
      toast.error('Um combo precisa ter pelo menos 2 serviços componentes');
      return;
    }

    if (isCombo && formData.preco >= individualSum) {
      toast.error('O preço do combo deve ser menor que a soma dos serviços individuais');
      return;
    }

    try {
      setLoading(true);

      let savedServiceId = serviceId;

      if (serviceId) {
        // Atualizar serviço existente
        const { error } = await supabase
          .from('painel_servicos')
          .update({
            nome: formData.nome.trim(),
            descricao: formData.descricao.trim(),
            preco: formData.preco,
            duracao: formData.duracao,
            is_active: formData.is_active,
            ativo: formData.is_active,
            exibir_home: formData.exibir_home,
            updated_at: new Date().toISOString()
          })
          .eq('id', serviceId);

        if (error) throw error;
      } else {
        // Criar novo serviço
        const { data: newService, error } = await supabase
          .from('painel_servicos')
          .insert({
            nome: formData.nome.trim(),
            descricao: formData.descricao.trim(),
            preco: formData.preco,
            duracao: formData.duracao,
            is_active: formData.is_active,
            ativo: formData.is_active,
            exibir_home: formData.exibir_home
          })
          .select()
          .single();

        if (error) throw error;
        savedServiceId = newService.id;
      }

      // Atualizar relacionamento com barbeiros
      if (savedServiceId) {
        await supabase
          .from('service_staff')
          .delete()
          .eq('service_id', savedServiceId);

        if (selectedStaffIds.length > 0) {
          const serviceStaffData = selectedStaffIds.map(staffId => ({
            service_id: savedServiceId,
            staff_id: staffId
          }));

          const { error: staffError } = await supabase
            .from('service_staff')
            .insert(serviceStaffData);

          if (staffError) {
            console.error('Erro ao vincular barbeiros:', staffError);
            toast.error('Serviço salvo, mas houve erro ao vincular barbeiros');
          }
        }

        // Salvar/atualizar componentes do combo
        // Remover componentes antigos
        await supabase
          .from('combo_service_items')
          .delete()
          .eq('combo_service_id', savedServiceId);

        // Inserir componentes novos (se for combo)
        if (isCombo && selectedComponentIds.length >= 2) {
          const comboData = selectedComponentIds.map(componentId => ({
            combo_service_id: savedServiceId,
            component_service_id: componentId
          }));

          const { error: comboError } = await supabase
            .from('combo_service_items')
            .insert(comboData);

          if (comboError) {
            console.error('Erro ao salvar combo:', comboError);
            toast.error('Serviço salvo, mas houve erro ao gravar componentes do combo');
          }
        }
      }
        
      toast.success(serviceId ? 'Serviço atualizado com sucesso!' : 'Serviço criado com sucesso!', {
        description: isCombo
          ? `Combo salvo com ${selectedComponentIds.length} serviços (economia de R$ ${comboSavings.toFixed(2)})`
          : 'O serviço foi salvo e os barbeiros foram vinculados'
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Erro ao salvar serviço:', error);
      toast.error(serviceId ? 'Erro ao atualizar serviço' : 'Erro ao criar serviço', {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  // Filtrar serviços disponíveis para combo (excluir o próprio serviço em edição)
  const comboAvailableServices = availableServices.filter(s => s.id !== serviceId);

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="max-w-md bg-white border border-slate-200 shadow-xl" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-slate-800 font-semibold text-lg">
            {serviceId ? '✏️ Editar Serviço' : '✨ Novo Serviço'}
          </DialogTitle>
        </DialogHeader>

        {loadingData ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <ScrollArea className="max-h-[70vh]">
            <form onSubmit={handleSubmit} className="space-y-4 px-1">
              <div className="space-y-2">
                <Label htmlFor="nome" className="text-slate-700 font-semibold">Nome do Serviço *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Corte + Barba"
                  required
                  className="bg-white border-slate-300 text-slate-800"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao" className="text-slate-700 font-semibold">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Descreva o serviço..."
                  rows={3}
                  className="bg-white border-slate-300 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="preco" className="text-slate-700 font-semibold">Preço (R$) *</Label>
                  <Input
                    id="preco"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.preco}
                    onChange={(e) => setFormData({ ...formData, preco: parseFloat(e.target.value) })}
                    placeholder="0.00"
                    required
                    className="bg-white border-slate-300 text-slate-800"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duracao" className="text-slate-700 font-semibold">Duração (min) *</Label>
                  <Input
                    id="duracao"
                    type="number"
                    min="1"
                    value={formData.duracao}
                    onChange={(e) => setFormData({ ...formData, duracao: parseInt(e.target.value) })}
                    placeholder="30"
                    required
                    className="bg-white border-slate-300 text-slate-800"
                  />
                </div>
              </div>

              {/* Combo Toggle */}
              <div className="space-y-3 p-4 rounded-lg border border-indigo-200 bg-indigo-50/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-indigo-600" />
                    <Label htmlFor="is_combo" className="text-slate-700 font-semibold">Combo de Serviços</Label>
                  </div>
                  <Switch
                    id="is_combo"
                    checked={isCombo}
                    onCheckedChange={(checked) => {
                      setIsCombo(checked);
                      if (!checked) setSelectedComponentIds([]);
                    }}
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Ative para vincular serviços individuais que compõem este combo. O preço do combo será aplicado automaticamente no checkout.
                </p>

                {isCombo && (
                  <div className="space-y-2 mt-3">
                    <Label className="text-slate-700 text-sm font-medium">
                      Serviços que compõem o combo:
                    </Label>
                    <div className="max-h-40 overflow-y-auto rounded-md border border-indigo-200 bg-white p-3 space-y-1">
                      {comboAvailableServices.length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-4">
                          Nenhum serviço disponível
                        </p>
                      ) : (
                        comboAvailableServices.map((svc) => {
                          // Não mostrar outros combos como componentes
                          const isSelected = selectedComponentIds.includes(svc.id);
                          return (
                            <div key={svc.id} className="flex items-center justify-between p-2 rounded-md hover:bg-indigo-50 transition-colors">
                              <div className="flex items-center gap-2 flex-1">
                                <Checkbox
                                  id={`combo-${svc.id}`}
                                  checked={isSelected}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedComponentIds(prev => [...prev, svc.id]);
                                    } else {
                                      setSelectedComponentIds(prev => prev.filter(id => id !== svc.id));
                                    }
                                  }}
                                />
                                <Label
                                  htmlFor={`combo-${svc.id}`}
                                  className="text-sm font-normal cursor-pointer flex-1 text-slate-700"
                                >
                                  {svc.nome}
                                </Label>
                              </div>
                              <span className="text-xs font-medium text-slate-500">
                                R$ {svc.preco.toFixed(2)}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {selectedComponentIds.length >= 2 && (
                      <div className="p-3 rounded-lg border border-indigo-300 bg-indigo-100/50 space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Soma individual:</span>
                          <span className="text-slate-700 font-medium">R$ {individualSum.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Preço do combo:</span>
                          <span className="text-indigo-700 font-bold">R$ {formData.preco.toFixed(2)}</span>
                        </div>
                        {comboSavings > 0 ? (
                          <div className="flex justify-between text-sm pt-1 border-t border-indigo-200">
                            <span className="text-emerald-700 font-medium">Economia para o cliente:</span>
                            <span className="text-emerald-700 font-bold">R$ {comboSavings.toFixed(2)}</span>
                          </div>
                        ) : (
                          <p className="text-xs text-red-600 pt-1 border-t border-indigo-200">
                            ⚠️ O preço do combo deve ser menor que a soma individual
                          </p>
                        )}
                      </div>
                    )}

                    {selectedComponentIds.length === 1 && (
                      <p className="text-xs text-amber-600">
                        Selecione pelo menos 2 serviços para formar um combo
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Seleção de Barbeiros */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-purple-600" />
                  <Label className="text-slate-700 font-semibold">Barbeiros que realizam este serviço</Label>
                </div>
                <p className="text-sm text-slate-500">
                  Selecione os barbeiros que podem realizar este serviço
                </p>
                <div className="max-h-40 overflow-y-auto rounded-md border border-slate-200 bg-slate-50 p-3 space-y-2">
                  {allStaff.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-4">
                      Nenhum barbeiro ativo cadastrado
                    </p>
                  ) : (
                    allStaff.map((staff) => (
                      <div key={staff.id} className="flex items-center space-x-2 p-2 rounded-md hover:bg-white transition-colors">
                        <Checkbox
                          id={`staff-${staff.id}`}
                          checked={selectedStaffIds.includes(staff.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedStaffIds([...selectedStaffIds, staff.id]);
                            } else {
                              setSelectedStaffIds(selectedStaffIds.filter(id => id !== staff.id));
                            }
                          }}
                        />
                        <Label
                          htmlFor={`staff-${staff.id}`}
                          className="text-sm font-normal cursor-pointer flex-1 text-slate-700"
                        >
                          {staff.nome}
                        </Label>
                        {selectedStaffIds.includes(staff.id) && (
                          <CheckCircle className="h-4 w-4 text-emerald-500" />
                        )}
                      </div>
                    ))
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  {selectedStaffIds.length === 0 
                    ? 'Nenhum selecionado = Todos os barbeiros podem fazer este serviço.'
                    : `${selectedStaffIds.length} barbeiro(s) selecionado(s). Apenas estes poderão fazer o serviço.`
                  }
                </p>
              </div>

              {/* Switches de Status */}
              <div className="space-y-4 p-4 rounded-lg border border-slate-200 bg-slate-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    <Label htmlFor="is_active" className="text-slate-700 font-semibold">Serviço Ativo</Label>
                  </div>
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Serviços inativos não aparecem para agendamento
                </p>

                <div className="border-t border-slate-200 pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4 text-blue-500" />
                      <Label htmlFor="exibir_home" className="text-slate-700 font-semibold">Exibir na Homepage</Label>
                    </div>
                    <Switch
                      id="exibir_home"
                      checked={formData.exibir_home}
                      onCheckedChange={(checked) => setFormData({ ...formData, exibir_home: checked })}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Exibir este serviço na página inicial do site
                  </p>
                </div>
              </div>

              <DialogFooter className="gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={loading}
                  className="border-slate-300 text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    serviceId ? 'Atualizar' : 'Criar'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ServiceForm;
