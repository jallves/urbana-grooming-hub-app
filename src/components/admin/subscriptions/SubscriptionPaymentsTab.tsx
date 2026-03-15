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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Plus, CreditCard, DollarSign, Search, Calendar } from 'lucide-react';

const paymentMethodLabels: Record<string, string> = {
  credit_card: 'Cartão',
  pix: 'PIX',
  cash: 'Dinheiro',
  debit: 'Débito',
};

const SubscriptionPaymentsTab: React.FC = () => {
  const { subscriptions, payments, paymentsLoading, registerPayment } = useClientSubscriptions();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState({
    subscription_id: '', amount: 0, payment_method: 'credit_card',
    period_start: new Date().toISOString().split('T')[0], period_end: '', notes: '',
  });

  const activeSubs = subscriptions.filter(s => s.status === 'active');

  const openRegister = () => {
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setForm({
      subscription_id: '', amount: 0, payment_method: 'credit_card',
      period_start: today.toISOString().split('T')[0],
      period_end: nextMonth.toISOString().split('T')[0], notes: '',
    });
    setDialogOpen(true);
  };

  const handleSubChange = (subId: string) => {
    const sub = activeSubs.find(s => s.id === subId);
    setForm(f => ({ ...f, subscription_id: subId, amount: sub?.plan_price || 0 }));
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

  const filteredPayments = payments.filter(p =>
    p.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.plan_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalReceived = payments.filter(p => p.status === 'paid').reduce((a, p) => a + p.amount, 0);
  const thisMonthPayments = payments.filter(p => {
    if (!p.payment_date) return false;
    const now = new Date();
    const payDate = new Date(p.payment_date);
    return payDate.getMonth() === now.getMonth() && payDate.getFullYear() === now.getFullYear();
  });
  const thisMonthTotal = thisMonthPayments.reduce((a, p) => a + p.amount, 0);

  if (paymentsLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>;
  }

  return (
    <div className="space-y-3 sm:space-y-6 mt-2 sm:mt-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <Card>
          <CardContent className="p-2 sm:p-3 flex items-center gap-1.5 sm:gap-2">
            <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-500 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[9px] sm:text-xs text-muted-foreground">Recebido</p>
              <p className="font-bold text-emerald-600 text-xs sm:text-base truncate">R$ {totalReceived.toFixed(0)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2 sm:p-3 flex items-center gap-1.5 sm:gap-2">
            <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[9px] sm:text-xs text-muted-foreground">Este Mês</p>
              <p className="font-bold text-blue-600 text-xs sm:text-base truncate">R$ {thisMonthTotal.toFixed(0)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2 sm:p-3 flex items-center gap-1.5 sm:gap-2">
            <CreditCard className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-violet-500 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[9px] sm:text-xs text-muted-foreground">Total</p>
              <p className="font-bold text-violet-600 text-xs sm:text-base">{payments.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search + Action */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
          <Input placeholder="Buscar pagamento..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-8 sm:pl-9 text-xs sm:text-sm h-9" />
        </div>
        <Button onClick={openRegister} size="sm" className="gap-1.5 bg-blue-500 hover:bg-blue-600 text-white w-full sm:w-auto text-xs sm:text-sm h-9" disabled={activeSubs.length === 0}>
          <Plus className="h-3.5 w-3.5" /> Registrar Pagamento
        </Button>
      </div>

      {filteredPayments.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center py-6 sm:py-12 text-center px-4">
            <CreditCard className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground/40 mb-3" />
            <h3 className="text-sm sm:text-lg font-semibold text-foreground">Nenhum pagamento registrado</h3>
            <p className="text-[11px] sm:text-sm text-muted-foreground mt-1">Registre pagamentos das assinaturas ativas</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-1.5 sm:space-y-2">
          {filteredPayments.map(pay => (
            <Card key={pay.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-2.5 sm:p-4">
                <div className="flex justify-between gap-2">
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                      <h4 className="font-medium text-[11px] sm:text-sm text-foreground truncate">{pay.client_name}</h4>
                      <Badge variant="outline" className="text-[9px] sm:text-xs px-1 py-0">{pay.plan_name}</Badge>
                      <Badge className={`text-[9px] sm:text-xs px-1 py-0 ${pay.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                        {pay.status === 'paid' ? 'Pago' : 'Pendente'}
                      </Badge>
                    </div>
                    <p className="text-[9px] sm:text-xs text-muted-foreground">
                      {formatDate(pay.period_start)} a {formatDate(pay.period_end)} • {formatDate(pay.payment_date)}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-emerald-600 text-xs sm:text-base">R$ {pay.amount.toFixed(2)}</p>
                    <p className="text-[9px] sm:text-xs text-muted-foreground">{paymentMethodLabels[pay.payment_method || ''] || pay.payment_method || '—'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Register Payment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md w-[95vw] sm:w-full p-0 bg-background border shadow-2xl z-[60] max-h-[85vh] flex flex-col">
          <DialogHeader className="p-4 pb-2 sm:p-6 sm:pb-3 flex-shrink-0">
            <DialogTitle className="text-sm sm:text-lg">Registrar Pagamento</DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 px-4 pb-4 sm:px-6 sm:pb-6">
            <div className="space-y-3">
              <div>
                <Label className="text-[11px] sm:text-sm">Assinante</Label>
                <Select value={form.subscription_id} onValueChange={handleSubChange}>
                  <SelectTrigger className="text-xs sm:text-sm h-9"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent className="z-[70]">
                    {activeSubs.map(s => (
                      <SelectItem key={s.id} value={s.id} className="text-xs sm:text-sm">{s.client_name} — {s.plan_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <Label className="text-[11px] sm:text-sm">Valor (R$)</Label>
                  <Input type="number" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))} className="text-xs sm:text-sm h-9" />
                </div>
                <div>
                  <Label className="text-[11px] sm:text-sm">Forma</Label>
                  <Select value={form.payment_method} onValueChange={v => setForm(f => ({ ...f, payment_method: v }))}>
                    <SelectTrigger className="text-xs sm:text-sm h-9"><SelectValue /></SelectTrigger>
                    <SelectContent className="z-[70]">
                      <SelectItem value="credit_card">Cartão</SelectItem>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="cash">Dinheiro</SelectItem>
                      <SelectItem value="debit">Débito</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <Label className="text-[11px] sm:text-sm">Início</Label>
                  <Input type="date" value={form.period_start} onChange={e => setForm(f => ({ ...f, period_start: e.target.value }))} className="text-xs sm:text-sm h-9" />
                </div>
                <div>
                  <Label className="text-[11px] sm:text-sm">Fim</Label>
                  <Input type="date" value={form.period_end} onChange={e => setForm(f => ({ ...f, period_end: e.target.value }))} className="text-xs sm:text-sm h-9" />
                </div>
              </div>
              <div>
                <Label className="text-[11px] sm:text-sm">Observações</Label>
                <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="text-xs sm:text-sm" />
              </div>
              <Button onClick={handleSave} disabled={registerPayment.isPending} className="w-full bg-blue-500 hover:bg-blue-600 text-white text-xs sm:text-sm h-9 sm:h-10">
                {registerPayment.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />}
                Registrar Pagamento
              </Button>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubscriptionPaymentsTab;
