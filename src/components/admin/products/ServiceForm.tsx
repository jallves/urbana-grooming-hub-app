import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

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
  show_on_home: boolean;
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
    show_on_home: true
  });

  useEffect(() => {
    if (serviceId) {
      loadServiceData();
    } else {
      resetForm();
    }
  }, [serviceId]);

  const resetForm = () => {
    setFormData({
      nome: '',
      descricao: '',
      preco: 0,
      duracao: 30,
      is_active: true,
      show_on_home: true
    });
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
          is_active: data.is_active ?? true,
          show_on_home: data.show_on_home ?? true
        });
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
            show_on_home: formData.show_on_home,
            updated_at: new Date().toISOString()
          })
          .eq('id', serviceId);

        if (error) throw error;
        
        toast.success('Serviço atualizado com sucesso!', {
          description: 'O serviço foi atualizado e sincronizado automaticamente'
        });
      } else {
        // Criar novo serviço
        const { error } = await supabase
          .from('painel_servicos')
          .insert({
            nome: formData.nome.trim(),
            descricao: formData.descricao.trim(),
            preco: formData.preco,
            duracao: formData.duracao,
            is_active: formData.is_active,
            show_on_home: formData.show_on_home,
            display_order: 0
          });

        if (error) throw error;
        
        toast.success('Serviço criado com sucesso!', {
          description: 'O serviço foi criado e sincronizado automaticamente'
        });
      }

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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {serviceId ? 'Editar Serviço' : 'Novo Serviço'}
          </DialogTitle>
        </DialogHeader>

        {loadingData ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Serviço *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Corte + Barba"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descreva o serviço..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="preco">Preço (R$) *</Label>
                <Input
                  id="preco"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.preco}
                  onChange={(e) => setFormData({ ...formData, preco: parseFloat(e.target.value) })}
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duracao">Duração (min) *</Label>
                <Input
                  id="duracao"
                  type="number"
                  min="1"
                  value={formData.duracao}
                  onChange={(e) => setFormData({ ...formData, duracao: parseInt(e.target.value) })}
                  placeholder="30"
                  required
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="is_active">Serviço Ativo</Label>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="show_on_home">Exibir na Home</Label>
                <Switch
                  id="show_on_home"
                  checked={formData.show_on_home}
                  onCheckedChange={(checked) => setFormData({ ...formData, show_on_home: checked })}
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
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
