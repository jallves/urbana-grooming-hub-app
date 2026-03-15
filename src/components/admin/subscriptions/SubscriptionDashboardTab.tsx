import React from 'react';
import { useClientSubscriptions } from '@/hooks/admin/useClientSubscriptions';
import { useSubscriptionPlans } from '@/hooks/admin/useSubscriptionPlans';
import { useSubscriptionAlerts } from '@/hooks/admin/useSubscriptionAlerts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Crown, Users, TrendingUp, DollarSign, 
  UserCheck, Loader2, Bell, Clock, CreditCard,
  AlertCircle, Percent, CalendarCheck, Wallet, BarChart3
} from 'lucide-react';

const formatBRL = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const SubscriptionDashboardTab: React.FC = () => {
  const { subscriptions, payments, loading } = useClientSubscriptions();
  const { plans } = useSubscriptionPlans();
  const { data: alerts = [] } = useSubscriptionAlerts();

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-amber-500" /></div>;
  }

  const activeSubs = subscriptions.filter(s => s.status === 'active');
  const cancelledSubs = subscriptions.filter(s => s.status === 'cancelled');
  const mrr = activeSubs.reduce((a, s) => a + (s.plan_price || 0), 0);
  const totalReceived = payments.filter(p => p.status === 'paid').reduce((a, p) => a + p.amount, 0);
  
  const churnRate = subscriptions.length > 0 
    ? ((cancelledSubs.length / subscriptions.length) * 100).toFixed(1)
    : '0.0';

  const overdueAlerts = alerts.filter(a => a.type === 'overdue');
  const expiringAlerts = alerts.filter(a => a.type === 'expiring');

  const planDistribution = plans.map(plan => {
    const count = activeSubs.filter(s => s.plan_id === plan.id).length;
    return { name: plan.name, count, color: plan.color || 'amber', price: plan.price };
  }).filter(p => p.count > 0);

  const recentPayments = payments.slice(0, 8);

  const avgCreditsUsed = activeSubs.length > 0
    ? (activeSubs.reduce((a, s) => a + ((s as any).credits_used || 0), 0) / activeSubs.length).toFixed(1)
    : '0';

  const newThisMonth = subscriptions.filter(s => {
    const created = new Date(s.created_at);
    const now = new Date();
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
  }).length;

  const thisMonthRevenue = payments.filter(p => {
    if (!p.payment_date || p.status !== 'paid') return false;
    const now = new Date();
    const d = new Date(p.payment_date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((a, p) => a + p.amount, 0);

  const formatDate = (d: string | null) => {
    if (!d) return '—';
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
  };

  const planColorGradients: Record<string, string> = {
    amber: 'from-amber-400 to-amber-600',
    emerald: 'from-emerald-400 to-emerald-600',
    violet: 'from-violet-400 to-violet-600',
    blue: 'from-blue-400 to-blue-600',
    rose: 'from-rose-400 to-rose-600',
  };

  return (
    <div className="space-y-4 sm:space-y-6 mt-2 sm:mt-4">
      
      {/* ── Indicadores Principais ── */}
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 sm:mb-3 px-0.5">Resumo Geral</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
          <Card className="border shadow-sm">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2.5">
                <div className="bg-emerald-100 p-2 rounded-lg flex-shrink-0">
                  <UserCheck className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">Assinantes Ativos</p>
                  <p className="text-lg sm:text-2xl font-bold text-emerald-600">{activeSubs.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2.5">
                <div className="bg-amber-100 p-2 rounded-lg flex-shrink-0">
                  <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">Receita Mensal</p>
                  <p className="text-lg sm:text-2xl font-bold text-amber-600">{formatBRL(mrr)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2.5">
                <div className="bg-blue-100 p-2 rounded-lg flex-shrink-0">
                  <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">Total Recebido</p>
                  <p className="text-lg sm:text-2xl font-bold text-blue-600">{formatBRL(totalReceived)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2.5">
                <div className={`${parseFloat(churnRate) > 0 ? 'bg-red-100' : 'bg-emerald-100'} p-2 rounded-lg flex-shrink-0`}>
                  <Percent className={`h-4 w-4 sm:h-5 sm:w-5 ${parseFloat(churnRate) > 0 ? 'text-red-500' : 'text-emerald-600'}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">Cancelamentos</p>
                  <p className={`text-lg sm:text-2xl font-bold ${parseFloat(churnRate) > 0 ? 'text-red-500' : 'text-emerald-600'}`}>{churnRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Alertas de Vencimento ── */}
      {(overdueAlerts.length > 0 || expiringAlerts.length > 0) && (
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 sm:mb-3 px-0.5 flex items-center gap-1.5">
            <Bell className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
            Alertas de Vencimento
            <Badge className="bg-amber-100 text-amber-800 text-[10px]">{alerts.length}</Badge>
          </h3>
          <div className="space-y-2">
            {overdueAlerts.map(alert => (
              <Card key={`o-${alert.id}`} className="border border-red-200 bg-red-50/50">
                <CardContent className="p-2.5 sm:p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs sm:text-sm font-semibold truncate">{alert.client_name}</p>
                        <span className="text-xs font-bold text-red-600 flex-shrink-0">{formatBRL(alert.plan_price)}</span>
                      </div>
                      <p className="text-[10px] sm:text-xs text-red-600 mt-0.5">
                        {alert.plan_name} — vencido há {Math.abs(alert.days_until)} dia{Math.abs(alert.days_until) !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {expiringAlerts.map(alert => (
              <Card key={`e-${alert.id}`} className="border border-amber-200 bg-amber-50/50">
                <CardContent className="p-2.5 sm:p-3">
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs sm:text-sm font-semibold truncate">{alert.client_name}</p>
                        <span className="text-xs font-bold text-amber-700 flex-shrink-0">{formatBRL(alert.plan_price)}</span>
                      </div>
                      <p className="text-[10px] sm:text-xs text-amber-700 mt-0.5">
                        {alert.plan_name} — vence {alert.days_until === 0 ? 'hoje' : alert.days_until === 1 ? 'amanhã' : `em ${alert.days_until} dias`}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── Métricas Rápidas ── */}
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 sm:mb-3 px-0.5">Métricas do Mês</h3>
        <div className="grid grid-cols-3 gap-2">
          <Card className="border">
            <CardContent className="p-3 text-center">
              <CalendarCheck className="h-4 w-4 text-violet-500 mx-auto mb-1" />
              <p className="text-lg sm:text-xl font-bold text-violet-600">{newThisMonth}</p>
              <p className="text-[9px] sm:text-[10px] text-muted-foreground leading-tight">Novas Assinaturas</p>
            </CardContent>
          </Card>
          <Card className="border">
            <CardContent className="p-3 text-center">
              <TrendingUp className="h-4 w-4 text-emerald-500 mx-auto mb-1" />
              <p className="text-lg sm:text-xl font-bold text-emerald-600">{formatBRL(thisMonthRevenue)}</p>
              <p className="text-[9px] sm:text-[10px] text-muted-foreground leading-tight">Recebido este Mês</p>
            </CardContent>
          </Card>
          <Card className="border">
            <CardContent className="p-3 text-center">
              <BarChart3 className="h-4 w-4 text-blue-500 mx-auto mb-1" />
              <p className="text-lg sm:text-xl font-bold text-blue-600">{avgCreditsUsed}</p>
              <p className="text-[9px] sm:text-[10px] text-muted-foreground leading-tight">Média de Usos</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Bottom Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">

        {/* Últimos Pagamentos */}
        <Card className="border md:col-span-2">
          <CardHeader className="p-3 sm:p-5 pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm flex items-center gap-2 font-semibold">
              <CreditCard className="h-4 w-4 text-blue-500" />
              Últimos Pagamentos
              {payments.length > 0 && (
                <Badge variant="outline" className="text-[10px] sm:text-xs font-normal">{payments.length} registros</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-5 pt-0">
            {recentPayments.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">Nenhum pagamento registrado ainda</p>
            ) : (
              <div className="space-y-0.5 max-h-64 overflow-y-auto">
                {recentPayments.map((pay, idx) => (
                  <div key={pay.id} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div className={`w-2.5 h-2.5 rounded-full ${pay.status === 'paid' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      {idx < recentPayments.length - 1 && <div className="w-0.5 h-5 bg-border mt-0.5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs sm:text-sm font-medium truncate">{pay.client_name}</span>
                        <Badge variant="outline" className="text-[9px] px-1 py-0 hidden sm:inline-flex">{pay.plan_name}</Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        {formatDate(pay.payment_date)} — {pay.status === 'paid' ? 'Confirmado' : 'Pendente'}
                      </p>
                    </div>
                    <span className={`font-bold text-xs sm:text-sm flex-shrink-0 ${pay.status === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {formatBRL(pay.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Planos Populares */}
        <Card className="border">
          <CardHeader className="p-3 sm:p-5 pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm flex items-center gap-2 font-semibold">
              <Crown className="h-4 w-4 text-amber-500" />
              Planos Mais Vendidos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-5 pt-0">
            {planDistribution.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">Nenhum assinante ativo no momento</p>
            ) : (
              <div className="space-y-3">
                {planDistribution.map(p => {
                  const pct = activeSubs.length > 0 ? (p.count / activeSubs.length) * 100 : 0;
                  const gradient = planColorGradients[p.color] || planColorGradients.amber;
                  return (
                    <div key={p.name} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="font-medium">{p.name}</span>
                        <span className="text-muted-foreground text-[11px]">
                          {p.count} cliente{p.count !== 1 ? 's' : ''} · {pct.toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all`}
                          style={{ width: `${Math.max(pct, 5)}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        Receita: {formatBRL(p.count * p.price)}/mês
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Atividade Recente */}
        <Card className="border">
          <CardHeader className="p-3 sm:p-5 pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm flex items-center gap-2 font-semibold">
              <Users className="h-4 w-4 text-violet-500" />
              Últimas Movimentações
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-5 pt-0">
            {subscriptions.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">Nenhuma movimentação registrada</p>
            ) : (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {subscriptions.slice(0, 6).map(sub => (
                  <div key={sub.id} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-accent/50">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${sub.status === 'active' ? 'bg-emerald-500' : sub.status === 'cancelled' ? 'bg-red-500' : 'bg-muted-foreground/40'}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium truncate">{sub.client_name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {sub.plan_name} · {sub.status === 'active' ? 'Ativa' : sub.status === 'cancelled' ? 'Cancelada' : sub.status}
                      </p>
                    </div>
                    <span className="text-[10px] text-muted-foreground flex-shrink-0">{formatDate(sub.start_date)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SubscriptionDashboardTab;
