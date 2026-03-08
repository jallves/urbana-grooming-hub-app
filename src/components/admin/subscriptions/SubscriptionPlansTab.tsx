import React, { useState } from 'react';
import { useSubscriptionPlans, PlanFormData } from '@/hooks/admin/useSubscriptionPlans';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Crown, Loader2, Sparkles, Shield, Star } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const planColors: Record<string, string> = {
  amber: 'from-amber-400 to-amber-600',
  emerald: 'from-emerald-400 to-emerald-600',
  violet: 'from-violet-400 to-violet-600',
  blue: 'from-blue-400 to-blue-600',
  rose: 'from-rose-400 to-rose-600',
};

const planIcons: Record<string, React.ReactNode> = {
  shield: <Shield className="h-8 w-8" />,
  star: <Star className="h-8 w-8" />,
  crown: <Crown className="h-8 w-8" />,
  sparkles: <Sparkles className="h-8 w-8" />,
};

const emptyForm: PlanFormData = {
  name: '', slug: '', description: '', price: 0,
  billing_period: 'monthly', is_active: true, color: 'amber',
  display_order: 0, service_ids: [],
};

const SubscriptionPlansTab: React.FC = () => {
  const { plans, loading, createPlan, updatePlan, deletePlan } = useSubscriptionPlans();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PlanFormData>(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const servicesQuery = useQuery({
    queryKey: ['all-services'],
    queryFn: async () => {
      const { data } = await supabase.from('painel_servicos').select('id, nome, preco').eq('is_active', true).order('nome');
      return data || [];
    },
  });

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm, display_order: plans.length });
    setDialogOpen(true);
  };

  const openEdit = (plan: any) => {
    setEditingId(plan.id);
    setForm({
      name: plan.name,
      slug: plan.slug,
      description: plan.description || '',
      price: plan.price,
      billing_period: plan.billing_period,
      is_active: plan.is_active,
      color: plan.color || 'amber',
      display_order: plan.display_order,
      service_ids: plan.services?.map((s: any) => s.id) || [],
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.slug || form.price <= 0) return;
    if (editingId) {
      await updatePlan.mutateAsync({ id: editingId, data: form });
    } else {
      await createPlan.mutateAsync(form);
    }
    setDialogOpen(false);
  };

  const toggleService = (serviceId: string) => {
    setForm(prev => ({
      ...prev,
      service_ids: prev.service_ids.includes(serviceId)
        ? prev.service_ids.filter(id => id !== serviceId)
        : [...prev.service_ids, serviceId],
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {plans.length} plano{plans.length !== 1 ? 's' : ''} cadastrado{plans.length !== 1 ? 's' : ''}
        </p>
        <Button onClick={openCreate} className="gap-2 bg-amber-500 hover:bg-amber-600 text-white">
          <Plus className="h-4 w-4" /> Novo Plano
        </Button>
      </div>

      {plans.length === 0 ? (
        <Card className="border-dashed border-2 border-amber-200 bg-amber-50/50">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <Crown className="h-12 w-12 text-amber-400 mb-4" />
            <h3 className="text-lg font-semibold text-foreground">Nenhum plano cadastrado</h3>
            <p className="text-muted-foreground mt-1">Crie seu primeiro plano de assinatura</p>
            <Button onClick={openCreate} className="mt-4 gap-2 bg-amber-500 hover:bg-amber-600 text-white">
              <Plus className="h-4 w-4" /> Criar Plano
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {plans.map(plan => {
            const gradient = planColors[plan.color || 'amber'] || planColors.amber;
            const icon = planIcons[plan.icon || 'crown'] || planIcons.crown;
            return (
              <Card key={plan.id} className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow">
                <div className={`bg-gradient-to-br ${gradient} p-6 text-white`}>
                  <div className="flex justify-between items-start">
                    <div>{icon}</div>
                    <Badge variant={plan.is_active ? 'default' : 'secondary'} className="bg-white/20 text-white border-white/30">
                      {plan.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  <h3 className="text-xl font-bold mt-3">{plan.name}</h3>
                  <div className="mt-2">
                    <span className="text-3xl font-black">R$ {plan.price.toFixed(2)}</span>
                    <span className="text-white/70 text-sm">/{plan.billing_period === 'monthly' ? 'mês' : plan.billing_period === 'quarterly' ? 'trim' : 'ano'}</span>
                  </div>
                </div>
                <CardContent className="p-5 space-y-4">
                  {plan.description && <p className="text-sm text-muted-foreground">{plan.description}</p>}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Serviços Inclusos</p>
                    {plan.services && plan.services.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {plan.services.map((s: any) => (
                          <Badge key={s.id} variant="outline" className="text-xs">{s.nome}</Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">Nenhum serviço vinculado</p>
                    )}
                  </div>
                  <p className="text-xs text-emerald-600 font-medium">✓ Uso ilimitado dos serviços inclusos</p>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => openEdit(plan)}>
                      <Pencil className="h-3.5 w-3.5" /> Editar
                    </Button>
                    <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => setDeleteId(plan.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Plano' : 'Novo Plano de Assinatura'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nome</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') }))} placeholder="Premium" />
              </div>
              <div>
                <Label>Slug</Label>
                <Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="premium" />
              </div>
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Todos os serviços inclusos..." rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Preço (R$)</Label>
                <Input type="number" step="0.01" min="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div>
                <Label>Período</Label>
                <Select value={form.billing_period} onValueChange={v => setForm(f => ({ ...f, billing_period: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Mensal</SelectItem>
                    <SelectItem value="quarterly">Trimestral</SelectItem>
                    <SelectItem value="yearly">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Cor</Label>
                <Select value={form.color} onValueChange={v => setForm(f => ({ ...f, color: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="amber">🟡 Dourado</SelectItem>
                    <SelectItem value="emerald">🟢 Esmeralda</SelectItem>
                    <SelectItem value="violet">🟣 Violeta</SelectItem>
                    <SelectItem value="blue">🔵 Azul</SelectItem>
                    <SelectItem value="rose">🔴 Rosé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-3 pb-1">
                <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
                <Label>Ativo</Label>
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Serviços Inclusos</Label>
              <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                {servicesQuery.data?.map((svc: any) => (
                  <label key={svc.id} className="flex items-center gap-2 cursor-pointer hover:bg-accent/50 rounded p-1.5">
                    <Checkbox
                      checked={form.service_ids.includes(svc.id)}
                      onCheckedChange={() => toggleService(svc.id)}
                    />
                    <span className="text-sm flex-1">{svc.nome}</span>
                    <span className="text-xs text-muted-foreground">R$ {svc.preco?.toFixed(2)}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{form.service_ids.length} serviço(s) selecionado(s)</p>
            </div>
            <Button
              onClick={handleSave}
              disabled={createPlan.isPending || updatePlan.isPending}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white"
            >
              {(createPlan.isPending || updatePlan.isPending) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingId ? 'Salvar Alterações' : 'Criar Plano'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir plano?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Planos com assinantes ativos não podem ser excluídos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() => { if (deleteId) deletePlan.mutate(deleteId); setDeleteId(null); }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SubscriptionPlansTab;
