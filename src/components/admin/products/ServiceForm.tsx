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
import { Loader2, Users, Home, CheckCircle } from 'lucide-react';

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

  useEffect(() => {
    if (isOpen) {
      loadStaff();
      if (serviceId) {
        loadServiceData();
      } else {
        resetForm();
      }
    }
  }, [serviceId, isOpen]);

  const loadStaff = async () => {
    try {
      // Usar 'ativo' (o campo correto na tabela painel_barbeiros)
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
        // Remover relacionamentos antigos
        await supabase
          .from('service_staff')
          .delete()
          .eq('service_id', savedServiceId);

        // Inserir novos relacionamentos
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
      }
        
      toast.success(serviceId ? 'Serviço atualizado com sucesso!' : 'Serviço criado com sucesso!', {
        description: 'O serviço foi salvo e os barbeiros foram vinculados'
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

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="max-w-md !bg-card bg-opacity-100 border border-border shadow-2xl backdrop-blur-none" style={{ backgroundColor: 'hsl(var(--card))', opacity: 1 }}>
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {serviceId ? 'Editar Serviço' : 'Novo Serviço'}
          </DialogTitle>
        </DialogHeader>

        {loadingData ? (
          <div className="flex items-center justify-center py-8 bg-background">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome" className="text-foreground">Nome do Serviço *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Corte + Barba"
                required
                className="bg-background border-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao" className="text-foreground">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descreva o serviço..."
                rows={3}
                className="bg-background border-input"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="preco" className="text-foreground">Preço (R$) *</Label>
                <Input
                  id="preco"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.preco}
                  onChange={(e) => setFormData({ ...formData, preco: parseFloat(e.target.value) })}
                  placeholder="0.00"
                  required
                  className="bg-background border-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duracao" className="text-foreground">Duração (min) *</Label>
                <Input
                  id="duracao"
                  type="number"
                  min="1"
                  value={formData.duracao}
                  onChange={(e) => setFormData({ ...formData, duracao: parseInt(e.target.value) })}
                  placeholder="30"
                  required
                  className="bg-background border-input"
                />
              </div>
            </div>

            {/* Seleção de Barbeiros */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <Label className="text-foreground">Barbeiros que realizam este serviço</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Selecione os barbeiros que podem realizar este serviço
              </p>
              <ScrollArea className="h-48 rounded-md border border-input bg-background p-4">
                <div className="space-y-3">
                  {allStaff.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhum barbeiro ativo cadastrado
                    </p>
                  ) : (
                    allStaff.map((staff) => (
                      <div key={staff.id} className="flex items-center space-x-2 p-2 rounded hover:bg-muted/50">
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
                          className="text-sm font-normal cursor-pointer flex-1 text-foreground"
                        >
                          {staff.nome}
                        </Label>
                        {selectedStaffIds.includes(staff.id) && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
              <p className="text-xs text-muted-foreground">
                {selectedStaffIds.length === 0 
                  ? 'Nenhum selecionado = Todos os barbeiros podem fazer este serviço.'
                  : `${selectedStaffIds.length} barbeiro(s) selecionado(s). Apenas estes poderão fazer o serviço.`
                }
              </p>
            </div>

            {/* Switches de Status */}
            <div className="space-y-4 p-4 rounded-lg border border-input bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <Label htmlFor="is_active" className="text-foreground">Serviço Ativo</Label>
                </div>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Serviços inativos não aparecem para agendamento
              </p>

              <div className="border-t border-input pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4 text-primary" />
                    <Label htmlFor="exibir_home" className="text-foreground">Exibir na Homepage</Label>
                  </div>
                  <Switch
                    id="exibir_home"
                    checked={formData.exibir_home}
                    onCheckedChange={(checked) => setFormData({ ...formData, exibir_home: checked })}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
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
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ServiceForm;
