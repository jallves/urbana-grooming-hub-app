import React, { useState } from 'react';
import { useSubscriptionPlans, PlanFormData } from '@/hooks/admin/useSubscriptionPlans';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { Plus, Pencil, Trash2, Crown, Loader2, Sparkles, Shield, Star, CheckCircle2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useClientSubscriptions } from '@/hooks/admin/useClientSubscriptions';

const planColors: Record<string, string> = {
  amber: 'from-amber-400 to-amber-600',
  emerald: 'from-emerald-400 to-emerald-600',
  violet: 'from-violet-400 to-violet-600',
  blue: 'from-blue-400 to-blue-600',
  rose: 'from-rose-400 to-rose-600',
};

const planIcons: Record<string, React.ReactNode> = {
  shield: <Shield className="h-5 w-5 sm:h-8 sm:w-8" />,
  star: <Star className="h-5 w-5 sm:h-8 sm:w-8" />,
  crown: <Crown className="h-5 w-5 sm:h-8 sm:w-8" />,
  sparkles: <Sparkles className="h-5 w-5 sm:h-8 sm:w-8" />,
};

const emptyForm: PlanFormData = {
  name: '', slug: '', description: '', price: 0,
  billing_period: 'monthly', is_active: true, color: 'amber',
  display_order: 0, service_ids: [], credits_total: 4,
};

const SubscriptionPlansTab: React.FC = () => {
  const { plans, loading, createPlan, updatePlan, deletePlan } = useSubscriptionPlans();
  const { subscriptions } = useClientSubscriptions();
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
      name: plan.name, slug: plan.slug, description: plan.description || '',
      price: plan.price, billing_period: plan.billing_period, is_active: plan.is_active,
      color: plan.color || 'amber', display_order: plan.display_order,
      service_ids: plan.services?.map((s: any) => s.id) || [],
      credits_total: (plan as any).credits_total || 4,
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

  const recalcPrice = (ids: string[]) => {
    const services = servicesQuery.data || [];
    return ids.reduce((sum, id) => {
      const svc = services.find((s: any) => s.id === id);
      return sum + (svc?.preco || 0);
    }, 0);
  };

  const toggleService = (serviceId: string) => {
    setForm(prev => {
      const newIds = prev.service_ids.includes(serviceId)
        ? prev.service_ids.filter(id => id !== serviceId)
        : [...prev.service_ids, serviceId];
      return { ...prev, service_ids: newIds, price: recalcPrice(newIds) };
    });
  };

  const getActiveSubsCount = (planId: string) => 
    subscriptions.filter(s => s.plan_id === planId && s.status === 'active').length;

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-amber-500" /></div>;
  }

  return (
    <div className="space-y-3 sm:space-y-6 mt-2 sm:mt-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-3">
        <p className="text-[11px] sm:text-sm text-muted-foreground">
          {plans.length} plano{plans.length !== 1 ? 's' : ''} cadastrado{plans.length !== 1 ? 's' : ''}
        </p>
        <Button onClick={openCreate} size="sm" className="gap-1.5 bg-amber-500 hover:bg-amber-600 text-white w-full sm:w-auto text-xs sm:text-sm">
          <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Novo Plano
        </Button>
      </div>

      {plans.length === 0 ? (
        <Card className="border-dashed border-2 border-amber-200 bg-amber-50/50">
          <CardContent className="flex flex-col items-center py-6 sm:py-12 text-center px-4">
            <Crown className="h-8 w-8 sm:h-12 sm:w-12 text-amber-400 mb-3" />
            <h3 className="text-sm sm:text-lg font-semibold text-foreground">Nenhum plano cadastrado</h3>
            <p className="text-[11px] sm:text-sm text-muted-foreground mt-1">Crie seu primeiro plano de assinatura</p>
            <Button onClick={openCreate} size="sm" className="mt-3 gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs sm:text-sm">
              <Plus className="h-3.5 w-3.5" /> Criar Plano
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-6">
          {plans.map(plan => {
            const gradient = planColors[plan.color || 'amber'] || planColors.amber;
            const icon = planIcons[plan.icon || 'crown'] || planIcons.crown;
            const activeCount = getActiveSubsCount(plan.id);
            return (
              <Card key={plan.id} className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow">
                <div className={`bg-gradient-to-br ${gradient} p-3 sm:p-6 text-white`}>
                  <div className="flex justify-between items-start">
                    <div>{icon}</div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant={plan.is_active ? 'default' : 'secondary'} className="bg-white/20 text-white border-white/30 text-[9px] sm:text-xs">
                        {plan.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                      {activeCount > 0 && (
                        <Badge className="bg-white/20 text-white border-white/30 text-[9px] sm:text-xs">
                          {activeCount} assinante{activeCount !== 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <h3 className="text-base sm:text-xl font-bold mt-1.5 sm:mt-3">{plan.name}</h3>
                  <div className="mt-1 sm:mt-2">
                    <span className="text-xl sm:text-3xl font-black">R$ {plan.price.toFixed(2)}</span>
                    <span className="text-white/70 text-[10px] sm:text-sm">/{plan.billing_period === 'monthly' ? 'mês' : plan.billing_period === 'quarterly' ? 'trim' : 'ano'}</span>
                  </div>
                </div>
                <CardContent className="p-3 sm:p-5 space-y-2 sm:space-y-4">
                  {plan.description && <p className="text-[11px] sm:text-sm text-muted-foreground line-clamp-2">{plan.description}</p>}
                  <div>
                    <p className="text-[9px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 sm:mb-2">Serviços Inclusos</p>
                    {plan.services && plan.services.length > 0 ? (
                      <div className="space-y-0.5 sm:space-y-1">
                        {plan.services.map((s: any) => (
                          <div key={s.id} className="flex items-center gap-1 text-[11px] sm:text-sm">
                            <CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-500 flex-shrink-0" />
                            <span className="truncate">{s.nome}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] sm:text-xs text-muted-foreground italic">Nenhum serviço vinculado</p>
                    )}
                  </div>
                  <p className="text-[10px] sm:text-xs text-emerald-600 font-medium">✓ {(plan as any).credits_total || 4} créditos/mês</p>
                  <div className="flex gap-2 pt-1">
                    <Button variant="outline" size="sm" className="flex-1 gap-1 text-[11px] sm:text-sm h-8 sm:h-9" onClick={() => openEdit(plan)}>
                      <Pencil className="h-3 w-3" /> Editar
                    </Button>
                    <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10 h-8 sm:h-9" onClick={() => setDeleteId(plan.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog - mobile fullscreen approach */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg w-[100vw] sm:w-[95vw] h-[100dvh] sm:h-auto sm:max-h-[90vh] p-0 bg-background border-0 sm:border shadow-2xl z-[60] rounded-none sm:rounded-lg flex flex-col gap-0">
          <DialogHeader className="px-4 pt-4 pb-3 sm:px-6 sm:pt-6 sm:pb-4 flex-shrink-0 border-b">
            <DialogTitle className="text-sm sm:text-lg">{editingId ? 'Editar Plano' : 'Novo Plano de Assinatura'}</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-3 sm:px-6 sm:py-4">
            <div className="space-y-4">
              {/* Nome & Slug */}
              <div>
                <Label className="text-xs sm:text-sm font-medium">Nome do Plano</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') }))} placeholder="Ex: Premium" className="text-sm h-10 mt-1" />
                <p className="text-[10px] text-muted-foreground mt-0.5">Slug: {form.slug || '—'}</p>
              </div>

              {/* Descrição */}
              <div>
                <Label className="text-xs sm:text-sm font-medium">Descrição</Label>
                <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Todos os serviços inclusos..." rows={2} className="text-sm mt-1" />
              </div>

              {/* Preço + Período */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs sm:text-sm font-medium">Preço (R$)</Label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">R$</span>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={form.price > 0 ? form.price.toFixed(2).replace('.', ',') : ''}
                      placeholder="0,00"
                      onFocus={e => e.target.select()}
                      onChange={e => {
                        const raw = e.target.value.replace(/[^\d,]/g, '').replace(',', '.');
                        const val = parseFloat(raw);
                        setForm(f => ({ ...f, price: isNaN(val) ? 0 : val }));
                      }}
                      className="text-sm h-10 pl-10 font-semibold"
                    />
                  </div>
                  {form.service_ids.length > 0 && (
                    <p className="text-[10px] text-emerald-600 mt-0.5 font-medium">
                      ✓ Calculado com base nos serviços
                    </p>
                  )}
                </div>
                <div>
                  <Label className="text-xs sm:text-sm font-medium">Período</Label>
                  <Select value={form.billing_period} onValueChange={v => setForm(f => ({ ...f, billing_period: v }))}>
                    <SelectTrigger className="text-sm h-10 mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent className="z-[70]">
                      <SelectItem value="monthly">Mensal</SelectItem>
                      <SelectItem value="quarterly">Trimestral</SelectItem>
                      <SelectItem value="yearly">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Créditos */}
              <div>
                <Label className="text-xs sm:text-sm font-medium">Créditos por Mês</Label>
                <Input type="number" min="1" max="99" value={form.credits_total} onChange={e => setForm(f => ({ ...f, credits_total: parseInt(e.target.value) || 4 }))} className="text-sm h-10 mt-1 w-24" />
                <p className="text-[10px] text-muted-foreground mt-0.5">Quantas vezes o cliente pode usar os serviços por período</p>
              </div>

              {/* Cor */}
              <div>
                <Label className="text-xs sm:text-sm font-medium">Cor do Plano</Label>
                <div className="flex gap-3 mt-2">
                  {Object.entries(planColors).map(([key, gradient]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, color: key }))}
                      className={`w-9 h-9 rounded-full bg-gradient-to-br ${gradient} border-2 transition-all ${form.color === key ? 'border-foreground scale-110 ring-2 ring-offset-2 ring-foreground/30' : 'border-transparent opacity-50 hover:opacity-100'}`}
                    />
                  ))}
                </div>
              </div>

              {/* Ativo */}
              <div className="flex items-center gap-3 py-1">
                <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
                <Label className="text-xs sm:text-sm font-medium">Plano ativo</Label>
              </div>

              {/* Serviços Inclusos */}
              <div>
                <Label className="text-xs sm:text-sm font-medium">Serviços Inclusos</Label>
                <p className="text-[10px] text-muted-foreground mb-2">{form.service_ids.length} serviço(s) selecionado(s) — o preço é calculado automaticamente</p>
                <div className="border rounded-lg divide-y max-h-[200px] overflow-y-auto overscroll-contain">
                  {servicesQuery.data?.map((svc: any) => (
                    <label key={svc.id} className="flex items-center gap-3 cursor-pointer hover:bg-accent/50 px-3 py-2.5 active:bg-accent">
                      <Checkbox checked={form.service_ids.includes(svc.id)} onCheckedChange={() => toggleService(svc.id)} />
                      <span className="text-xs sm:text-sm flex-1 truncate">{svc.nome}</span>
                      <span className="text-[10px] sm:text-xs text-muted-foreground flex-shrink-0 font-medium">R$ {svc.preco?.toFixed(2)}</span>
                    </label>
                  ))}
                  {(!servicesQuery.data || servicesQuery.data.length === 0) && (
                    <p className="text-xs text-muted-foreground p-3 text-center">Nenhum serviço cadastrado</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Fixed bottom button */}
          <div className="flex-shrink-0 border-t px-4 py-3 sm:px-6 sm:py-4 bg-background">
            <Button onClick={handleSave} disabled={createPlan.isPending || updatePlan.isPending} className="w-full bg-amber-500 hover:bg-amber-600 text-white text-sm h-10 sm:h-11 font-semibold">
              {(createPlan.isPending || updatePlan.isPending) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingId ? 'Salvar Alterações' : 'Criar Plano'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="w-[90vw] sm:w-auto max-w-sm bg-background border shadow-2xl z-[60]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm sm:text-base">Excluir plano?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm">
              Esta ação não pode ser desfeita. Planos com assinantes ativos não podem ser excluídos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="text-xs sm:text-sm h-8 sm:h-9">Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground text-xs sm:text-sm h-8 sm:h-9" onClick={() => { if (deleteId) deletePlan.mutate(deleteId); setDeleteId(null); }}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SubscriptionPlansTab;
