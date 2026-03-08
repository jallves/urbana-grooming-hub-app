import React, { useState } from 'react';
import { useClientSubscriptions } from '@/hooks/admin/useClientSubscriptions';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, CreditCard, DollarSign } from 'lucide-react';

const SubscriptionPaymentsTab: React.FC = () => {
  const { subscriptions, payments, paymentsLoading, registerPayment } = useClientSubscriptions();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    subscription_id: '',
    amount: 0,
    payment_method: 'credit_card',
    period_start: new Date().toISOString().split('T')[0],
    period_end: '',
    notes: '',
  });

  const activeSubs = subscriptions.filter(s => s.status === 'active');

  const openRegister = () => {
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setForm({
      subscription_id: '',
      amount: 0,
      payment_method: 'credit_card',
      period_start: today.toISOString().split('T')[0],
      period_end: nextMonth.toISOString().split('T')[0],
      notes: '',
    });
    setDialogOpen(true);
  };

  const handleSubChange = (subId: string) => {
    const sub = activeSubs.find(s => s.id === subId);
    setForm(f => ({
      ...f,
      subscription_id: subId,
      amount: sub?.plan_price || 0,
    }));
  };

  const handleSave = async () => {
    if (!form.subscription_id || form.amount <= 0) return;
    await registerPayment.mutateAsync(form);
    setDialogOpen(false);
  };

  const formatDate = (d: string | null) => {
    if (!d) return '—';
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
  };

  if (paymentsLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>;
  }

  // Stats
  const totalReceived = payments.filter(p => p.status === 'paid').reduce((a, p) => a + p.amount, 0);

  return (
    <div className="space-y-6 mt-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Card>
            <CardContent className="p-3 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-500" />
              <div>
                <p className="text-xs text-muted-foreground">Total Recebido</p>
                <p className="font-bold text-emerald-600">R$ {totalReceived.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
        <Button onClick={openRegister} className="gap-2 bg-blue-500 hover:bg-blue-600 text-white" disabled={activeSubs.length === 0}>
          <Plus className="h-4 w-4" /> Registrar Pagamento
        </Button>
      </div>

      {payments.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <CreditCard className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold text-foreground">Nenhum pagamento registrado</h3>
            <p className="text-muted-foreground mt-1">Registre pagamentos das assinaturas ativas</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {payments.map(pay => (
            <Card key={pay.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4 flex flex-col sm:flex-row justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-sm text-foreground">{pay.client_name}</h4>
                    <Badge variant="outline" className="text-xs">{pay.plan_name}</Badge>
                    <Badge className={pay.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}>
                      {pay.status === 'paid' ? 'Pago' : 'Pendente'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Período: {formatDate(pay.period_start)} a {formatDate(pay.period_end)} • Pago em: {formatDate(pay.payment_date)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-emerald-600">R$ {pay.amount.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground capitalize">{pay.payment_method?.replace('_', ' ') || '—'}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Register Payment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Pagamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Assinante</Label>
              <Select value={form.subscription_id} onValueChange={handleSubChange}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {activeSubs.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.client_name} — {s.plan_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Valor (R$)</Label>
                <Input type="number" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div>
                <Label>Forma</Label>
                <Select value={form.payment_method} onValueChange={v => setForm(f => ({ ...f, payment_method: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="credit_card">Cartão Crédito</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="cash">Dinheiro</SelectItem>
                    <SelectItem value="debit">Débito</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Início Período</Label>
                <Input type="date" value={form.period_start} onChange={e => setForm(f => ({ ...f, period_start: e.target.value }))} />
              </div>
              <div>
                <Label>Fim Período</Label>
                <Input type="date" value={form.period_end} onChange={e => setForm(f => ({ ...f, period_end: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
            </div>
            <Button onClick={handleSave} disabled={registerPayment.isPending} className="w-full bg-blue-500 hover:bg-blue-600 text-white">
              {registerPayment.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Registrar Pagamento
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubscriptionPaymentsTab;
