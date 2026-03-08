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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Plus, UserX, Loader2, Users, Search, Filter, Phone, Mail, Calendar } from 'lucide-react';

const statusColors: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-800',
  expired: 'bg-gray-100 text-gray-800',
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
    <div className="space-y-4 sm:space-y-6 mt-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar assinante..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9 text-sm" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40 text-sm">
            <Filter className="h-3.5 w-3.5 mr-1.5" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativas</SelectItem>
            <SelectItem value="cancelled">Canceladas</SelectItem>
            <SelectItem value="paused">Pausadas</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => setDialogOpen(true)} className="gap-2 bg-emerald-500 hover:bg-emerald-600 text-white w-full sm:w-auto">
          <Plus className="h-4 w-4" /> Nova Assinatura
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {[
          { label: 'Total', value: subscriptions.length, color: 'text-foreground' },
          { label: 'Ativas', value: subscriptions.filter(s => s.status === 'active').length, color: 'text-emerald-600' },
          { label: 'Canceladas', value: subscriptions.filter(s => s.status === 'cancelled').length, color: 'text-red-500' },
          { label: 'Receita Mensal', value: `R$ ${subscriptions.filter(s => s.status === 'active').reduce((a, s) => a + (s.plan_price || 0), 0).toFixed(2)}`, color: 'text-amber-600' },
        ].map(stat => (
          <Card key={stat.label}>
            <CardContent className="p-3 text-center">
              <p className="text-[10px] sm:text-xs text-muted-foreground">{stat.label}</p>
              <p className={`text-base sm:text-xl font-bold ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center py-8 sm:py-12 text-center">
            <Users className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-base sm:text-lg font-semibold text-foreground">Nenhum assinante encontrado</h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">Vincule clientes a um plano de assinatura</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2 sm:space-y-3">
          {filtered.map(sub => {
            const isOverdue = sub.status === 'active' && sub.next_billing_date && sub.next_billing_date < today;
            return (
              <Card key={sub.id} className={`hover:shadow-md transition-shadow ${isOverdue ? 'border-red-200 bg-red-50/30' : ''}`}>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <h4 className="font-semibold text-sm sm:text-base text-foreground truncate">{sub.client_name}</h4>
                        <Badge className={`${statusColors[sub.status]} text-[10px] sm:text-xs`}>{statusLabels[sub.status] || sub.status}</Badge>
                        {isOverdue && <Badge variant="destructive" className="text-[10px] sm:text-xs">Vencida</Badge>}
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Plano: <span className="font-medium text-foreground">{sub.plan_name}</span> • R$ {sub.plan_price?.toFixed(2)}/mês
                      </p>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] sm:text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> Início: {formatDate(sub.start_date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> Próx: {formatDate(sub.next_billing_date)}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] sm:text-xs text-muted-foreground">
                        {sub.client_whatsapp && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {sub.client_whatsapp}</span>}
                        {sub.client_email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {sub.client_email}</span>}
                      </div>
                    </div>
                    {sub.status === 'active' && (
                      <Button variant="outline" size="sm" className="text-destructive self-start gap-1 text-xs flex-shrink-0" onClick={() => setCancelDialog(sub.id)}>
                        <UserX className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Cancelar
                      </Button>
                    )}
                  </div>
                  {sub.cancellation_reason && (
                    <p className="text-[10px] sm:text-xs text-red-500 mt-2 bg-red-50 p-2 rounded">
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
        <DialogContent className="max-w-md w-[95vw] sm:w-auto bg-background border shadow-2xl z-[60]">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Nova Assinatura</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4">
            <div>
              <Label className="text-xs sm:text-sm">Cliente</Label>
              <Select value={form.client_id} onValueChange={v => setForm(f => ({ ...f, client_id: v }))}>
                <SelectTrigger className="text-sm"><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                <SelectContent className="max-h-60 z-[70]">
                  {clientsQuery.data?.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.nome} {c.whatsapp ? `(${c.whatsapp})` : ''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs sm:text-sm">Plano</Label>
              <Select value={form.plan_id} onValueChange={v => setForm(f => ({ ...f, plan_id: v }))}>
                <SelectTrigger className="text-sm"><SelectValue placeholder="Selecione o plano" /></SelectTrigger>
                <SelectContent className="z-[70]">
                  {plans.filter(p => p.is_active).map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name} — R$ {p.price.toFixed(2)}/mês</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label className="text-xs sm:text-sm">Data Início</Label>
                <Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} className="text-sm" />
              </div>
              <div>
                <Label className="text-xs sm:text-sm">Pagamento</Label>
                <Select value={form.payment_method} onValueChange={v => setForm(f => ({ ...f, payment_method: v }))}>
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
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
              <Label className="text-xs sm:text-sm">Observações</Label>
              <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Opcional..." rows={2} className="text-sm" />
            </div>
            <Button onClick={handleCreate} disabled={createSub.isPending} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white text-sm">
              {createSub.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Criar Assinatura
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <AlertDialog open={!!cancelDialog} onOpenChange={() => setCancelDialog(null)}>
        <AlertDialogContent className="w-[95vw] sm:w-auto bg-background border shadow-2xl z-[60]">
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Assinatura?</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-3">
                <p>A assinatura será marcada como cancelada e o cliente perderá os benefícios.</p>
                <div>
                  <Label className="text-xs sm:text-sm">Motivo do cancelamento</Label>
                  <Textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)} placeholder="Informe o motivo..." rows={2} className="text-sm" />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={handleCancel}>
              Confirmar Cancelamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SubscriptionSubscribersTab;
