import React, { useState } from 'react';
import { useClientSubscriptions } from '@/hooks/admin/useClientSubscriptions';
import { useSubscriptionPlans } from '@/hooks/admin/useSubscriptionPlans';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Plus, UserX, Loader2, Users, Search, Filter, Phone, Mail, Calendar } from 'lucide-react';

const statusColors: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-800',
  expired: 'bg-muted text-muted-foreground',
  paused: 'bg-amber-100 text-amber-800',
};

const statusLabels: Record<string, string> = {
  active: 'Ativa',
  cancelled: 'Cancelada',
  expired: 'Vencida',
  paused: 'Pausada',
};

const SubscriptionSubscribersTab: React.FC = () => {
  const { subscriptions, loading, createSub, cancelSub } = useClientSubscriptions();
  const { plans } = useSubscriptionPlans();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [cancelDialog, setCancelDialog] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [form, setForm] = useState({
    client_id: '', plan_id: '',
    start_date: new Date().toISOString().split('T')[0],
    payment_method: 'credit_card', notes: '',
  });

  const clientsQuery = useQuery({
    queryKey: ['all-clients-for-sub'],
    queryFn: async () => {
      const { data } = await supabase.from('painel_clientes').select('id, nome, email, whatsapp').order('nome');
      return data || [];
    },
  });

  const filtered = subscriptions.filter(s => {
    const matchSearch = s.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.plan_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const today = new Date().toISOString().split('T')[0];

  const handleCreate = async () => {
    if (!form.client_id || !form.plan_id) return;
    await createSub.mutateAsync(form);
    setDialogOpen(false);
  };

  const handleCancel = async () => {
    if (!cancelDialog) return;
    await cancelSub.mutateAsync({ id: cancelDialog, reason: cancelReason });
    setCancelDialog(null);
    setCancelReason('');
  };

  const formatDate = (d: string | null) => {
    if (!d) return '—';
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-emerald-500" /></div>;
  }

  return (
    <div className="space-y-3 sm:space-y-6 mt-2 sm:mt-4">
      {/* Filters */}
      <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
          <Input placeholder="Buscar assinante..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-8 sm:pl-9 text-xs sm:text-sm h-9" />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-36 text-xs sm:text-sm h-9">
              <Filter className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="z-[70]">
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativas</SelectItem>
              <SelectItem value="cancelled">Canceladas</SelectItem>
              <SelectItem value="paused">Pausadas</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setDialogOpen(true)} size="sm" className="gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white flex-shrink-0 text-xs sm:text-sm h-9">
            <Plus className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Nova</span> Assinatura
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: 'Total', value: subscriptions.length, color: 'text-foreground' },
          { label: 'Ativas', value: subscriptions.filter(s => s.status === 'active').length, color: 'text-emerald-600' },
          { label: 'Canceladas', value: subscriptions.filter(s => s.status === 'cancelled').length, color: 'text-red-500' },
          { label: 'Receita/Mês', value: `R$ ${subscriptions.filter(s => s.status === 'active').reduce((a, s) => a + (s.plan_price || 0), 0).toFixed(0)}`, color: 'text-amber-600' },
        ].map(stat => (
          <Card key={stat.label}>
            <CardContent className="p-2 sm:p-3 text-center">
              <p className="text-[9px] sm:text-xs text-muted-foreground">{stat.label}</p>
              <p className={`text-sm sm:text-xl font-bold ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center py-6 sm:py-12 text-center px-4">
            <Users className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground/40 mb-3" />
            <h3 className="text-sm sm:text-lg font-semibold text-foreground">Nenhum assinante encontrado</h3>
            <p className="text-[11px] sm:text-sm text-muted-foreground mt-1">Vincule clientes a um plano</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(sub => {
            const isOverdue = sub.status === 'active' && sub.next_billing_date && sub.next_billing_date < today;
            return (
              <Card key={sub.id} className={`hover:shadow-md transition-shadow ${isOverdue ? 'border-red-200 bg-red-50/30' : ''}`}>
                <CardContent className="p-2.5 sm:p-4">
                  <div className="flex justify-between gap-2">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                        <h4 className="font-semibold text-xs sm:text-base text-foreground truncate">{sub.client_name}</h4>
                        <Badge className={`${statusColors[sub.status]} text-[9px] sm:text-xs px-1.5 py-0`}>{statusLabels[sub.status] || sub.status}</Badge>
                        {isOverdue && <Badge variant="destructive" className="text-[9px] sm:text-xs px-1.5 py-0">Vencida</Badge>}
                      </div>
                      <p className="text-[10px] sm:text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">{sub.plan_name}</span> • R$ {sub.plan_price?.toFixed(2)}
                      </p>
                      {/* Credits bar */}
                      <div className="flex items-center gap-1.5">
                        <div className="flex-1 max-w-[80px] sm:max-w-[100px] bg-muted rounded-full h-1 sm:h-1.5">
                          <div 
                            className={`h-full rounded-full transition-all ${((sub as any).credits_used || 0) >= ((sub as any).credits_total || 4) ? 'bg-red-500' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min(100, (((sub as any).credits_used || 0) / ((sub as any).credits_total || 4)) * 100)}%` }}
                          />
                        </div>
                        <span className="text-[9px] sm:text-[10px] text-muted-foreground">
                          {(sub as any).credits_used || 0}/{(sub as any).credits_total || 4} créd.
                        </span>
                      </div>
                      {/* Dates & contacts */}
                      <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[9px] sm:text-xs text-muted-foreground">
                        <span className="flex items-center gap-0.5">
                          <Calendar className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> {formatDate(sub.start_date)}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <Calendar className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> Próx: {formatDate(sub.next_billing_date)}
                        </span>
                        {sub.client_whatsapp && <span className="flex items-center gap-0.5"><Phone className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> {sub.client_whatsapp}</span>}
                        {sub.client_email && <span className="flex items-center gap-0.5 truncate max-w-[140px]"><Mail className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> {sub.client_email}</span>}
                      </div>
                    </div>
                    {sub.status === 'active' && (
                      <Button variant="outline" size="sm" className="text-destructive self-start gap-1 text-[10px] sm:text-xs h-7 sm:h-8 px-2 flex-shrink-0" onClick={() => setCancelDialog(sub.id)}>
                        <UserX className="h-3 w-3" /> <span className="hidden sm:inline">Cancelar</span>
                      </Button>
                    )}
                  </div>
                  {sub.cancellation_reason && (
                    <p className="text-[10px] sm:text-xs text-red-500 mt-1.5 bg-red-50 p-1.5 sm:p-2 rounded text-ellipsis overflow-hidden">
                      Motivo: {sub.cancellation_reason}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* New Subscription Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md w-[95vw] sm:w-full p-0 bg-background border shadow-2xl z-[60] max-h-[85vh] flex flex-col">
          <DialogHeader className="p-4 pb-2 sm:p-6 sm:pb-3 flex-shrink-0">
            <DialogTitle className="text-sm sm:text-lg">Nova Assinatura</DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 px-4 pb-4 sm:px-6 sm:pb-6">
            <div className="space-y-3">
              <div>
                <Label className="text-[11px] sm:text-sm">Cliente</Label>
                <Select value={form.client_id} onValueChange={v => setForm(f => ({ ...f, client_id: v }))}>
                  <SelectTrigger className="text-xs sm:text-sm h-9"><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                  <SelectContent className="max-h-52 z-[70]">
                    {clientsQuery.data?.map((c: any) => (
                      <SelectItem key={c.id} value={c.id} className="text-xs sm:text-sm">{c.nome} {c.whatsapp ? `(${c.whatsapp})` : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[11px] sm:text-sm">Plano</Label>
                <Select value={form.plan_id} onValueChange={v => setForm(f => ({ ...f, plan_id: v }))}>
                  <SelectTrigger className="text-xs sm:text-sm h-9"><SelectValue placeholder="Selecione o plano" /></SelectTrigger>
                  <SelectContent className="z-[70]">
                    {plans.filter(p => p.is_active).map(p => (
                      <SelectItem key={p.id} value={p.id} className="text-xs sm:text-sm">{p.name} — R$ {p.price.toFixed(2)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <Label className="text-[11px] sm:text-sm">Data Início</Label>
                  <Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} className="text-xs sm:text-sm h-9" />
                </div>
                <div>
                  <Label className="text-[11px] sm:text-sm">Pagamento</Label>
                  <Select value={form.payment_method} onValueChange={v => setForm(f => ({ ...f, payment_method: v }))}>
                    <SelectTrigger className="text-xs sm:text-sm h-9"><SelectValue /></SelectTrigger>
                    <SelectContent className="z-[70]">
                      <SelectItem value="credit_card">Cartão Crédito</SelectItem>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="cash">Dinheiro</SelectItem>
                      <SelectItem value="debit">Débito</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-[11px] sm:text-sm">Observações</Label>
                <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Opcional..." rows={2} className="text-xs sm:text-sm" />
              </div>
              <Button onClick={handleCreate} disabled={createSub.isPending} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white text-xs sm:text-sm h-9 sm:h-10">
                {createSub.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />}
                Criar Assinatura
              </Button>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <AlertDialog open={!!cancelDialog} onOpenChange={() => setCancelDialog(null)}>
        <AlertDialogContent className="w-[90vw] sm:w-auto max-w-sm bg-background border shadow-2xl z-[60]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm sm:text-base">Cancelar Assinatura?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm">
              <div className="space-y-2.5">
                <p>A assinatura será cancelada e os benefícios removidos.</p>
                <div>
                  <Label className="text-[11px] sm:text-sm">Motivo</Label>
                  <Textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)} placeholder="Informe o motivo..." rows={2} className="text-xs sm:text-sm" />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="text-xs sm:text-sm h-8 sm:h-9">Voltar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground text-xs sm:text-sm h-8 sm:h-9" onClick={handleCancel}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SubscriptionSubscribersTab;
