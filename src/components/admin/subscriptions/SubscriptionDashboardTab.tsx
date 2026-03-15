import React from 'react';
import { useClientSubscriptions } from '@/hooks/admin/useClientSubscriptions';
import { useSubscriptionPlans } from '@/hooks/admin/useSubscriptionPlans';
import { useSubscriptionAlerts } from '@/hooks/admin/useSubscriptionAlerts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Crown, Users, TrendingUp, DollarSign, 
  UserCheck, Loader2, ArrowUpRight,
  ArrowDownRight, Bell, Clock, CreditCard,
  AlertCircle
} from 'lucide-react';

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

  const recentPayments = payments.slice(0, 10);

  const avgCreditsUsed = activeSubs.length > 0
    ? (activeSubs.reduce((a, s) => a + ((s as any).credits_used || 0), 0) / activeSubs.length).toFixed(1)
    : '0';

  const formatDate = (d: string | null) => {
    if (!d) return '—';
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
  };

  const kpis = [
    { label: 'Ativos', value: activeSubs.length, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'MRR', value: `R$ ${mrr.toFixed(0)}`, icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Recebido', value: `R$ ${totalReceived.toFixed(0)}`, icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Churn', value: `${churnRate}%`, icon: cancelledSubs.length > 0 ? ArrowDownRight : ArrowUpRight, color: cancelledSubs.length > 0 ? 'text-red-500' : 'text-emerald-500', bg: cancelledSubs.length > 0 ? 'bg-red-50' : 'bg-emerald-50' },
  ];

  return (
    <div className="space-y-3 sm:space-y-6 mt-2 sm:mt-4">
      {/* KPIs - 2x2 grid on mobile */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
        {kpis.map(kpi => (
          <Card key={kpi.label} className="border shadow-sm">
            <CardContent className="p-2.5 sm:p-4">
              <div className="flex items-center gap-2">
                <div className={`${kpi.bg} p-1.5 sm:p-2 rounded-lg flex-shrink-0`}>
                  <kpi.icon className={`h-3.5 w-3.5 sm:h-5 sm:w-5 ${kpi.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wider truncate">{kpi.label}</p>
                  <p className={`text-sm sm:text-xl font-bold ${kpi.color} truncate`}>{kpi.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alerts Section */}
      {(overdueAlerts.length > 0 || expiringAlerts.length > 0) && (
        <Card className="border-2 border-amber-200 bg-gradient-to-r from-amber-50/50 to-orange-50/30">
          <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-base flex items-center gap-2">
              <Bell className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-500 animate-pulse" />
              Alertas
              <Badge className="bg-amber-100 text-amber-800 text-[10px] sm:text-xs">{alerts.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="space-y-2 max-h-56 sm:max-h-64 overflow-y-auto">
              {overdueAlerts.map(alert => (
                <div key={`overdue-${alert.id}`} className="bg-red-50 rounded-lg p-2 sm:p-3 border border-red-200">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs sm:text-sm font-medium truncate">{alert.client_name}</p>
                        <Badge variant="destructive" className="text-[9px] sm:text-xs flex-shrink-0">
                          R$ {alert.plan_price.toFixed(0)}
                        </Badge>
                      </div>
                      <p className="text-[10px] sm:text-xs text-red-600 mt-0.5">
                        {alert.plan_name} • Venceu {Math.abs(alert.days_until)}d atrás
                      </p>
                      <div className="flex items-center justify-between mt-0.5">
                        {alert.last_payment_date && (
                          <p className="text-[9px] sm:text-[10px] text-muted-foreground">
                            Últ. pgto: {formatDate(alert.last_payment_date)}
                          </p>
                        )}
                        <p className="text-[9px] sm:text-[10px] text-muted-foreground">
                          {alert.credits_used}/{alert.credits_total} créd.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {expiringAlerts.map(alert => (
                <div key={`exp-${alert.id}`} className="bg-amber-50 rounded-lg p-2 sm:p-3 border border-amber-200">
                  <div className="flex items-start gap-2">
                    <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs sm:text-sm font-medium truncate">{alert.client_name}</p>
                        <Badge className="bg-amber-100 text-amber-800 text-[9px] sm:text-xs flex-shrink-0">
                          R$ {alert.plan_price.toFixed(0)}
                        </Badge>
                      </div>
                      <p className="text-[10px] sm:text-xs text-amber-700 mt-0.5">
                        {alert.plan_name} • Vence {alert.days_until === 0 ? 'hoje' : alert.days_until === 1 ? 'amanhã' : `em ${alert.days_until}d`}
                      </p>
                      <div className="flex items-center justify-between mt-0.5">
                        {alert.last_payment_date && (
                          <p className="text-[9px] sm:text-[10px] text-muted-foreground">
                            Últ. pgto: {formatDate(alert.last_payment_date)}
                          </p>
                        )}
                        <p className="text-[9px] sm:text-[10px] text-muted-foreground">
                          {alert.credits_used}/{alert.credits_total} créd.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bottom Grid: stacked on mobile, side-by-side on md+ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
        {/* Payment History */}
        <Card className="border md:col-span-2">
          <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-base flex items-center gap-2">
              <CreditCard className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500" />
              Histórico de Pagamentos
              {recentPayments.length > 0 && (
                <Badge className="bg-blue-100 text-blue-700 text-[10px] sm:text-xs">{payments.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            {recentPayments.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhum pagamento registrado</p>
            ) : (
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {recentPayments.map((pay, idx) => (
                  <div key={pay.id} className="flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${pay.status === 'paid' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      {idx < recentPayments.length - 1 && <div className="w-0.5 h-4 sm:h-6 bg-border mt-0.5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] sm:text-sm font-medium truncate">{pay.client_name}</span>
                        <Badge variant="outline" className="text-[9px] sm:text-[10px] px-1 py-0">{pay.plan_name}</Badge>
                      </div>
                      <p className="text-[9px] sm:text-[10px] text-muted-foreground truncate">
                        {formatDate(pay.payment_date)} • {formatDate(pay.period_start)} a {formatDate(pay.period_end)}
                      </p>
                    </div>
                    <span className="font-bold text-emerald-600 text-xs sm:text-sm flex-shrink-0">R$ {pay.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Plan Distribution */}
        <Card className="border">
          <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-base flex items-center gap-2">
              <Crown className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-500" />
              Distribuição por Plano
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            {planDistribution.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhum assinante ativo</p>
            ) : (
              <div className="space-y-2.5 sm:space-y-3">
                {planDistribution.map(p => {
                  const pct = activeSubs.length > 0 ? (p.count / activeSubs.length) * 100 : 0;
                  return (
                    <div key={p.name} className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] sm:text-sm">
                        <span className="font-medium truncate">{p.name}</span>
                        <span className="text-muted-foreground flex-shrink-0 ml-2">{p.count} ({pct.toFixed(0)}%)</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5 sm:h-2">
                        <div 
                          className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-[9px] sm:text-[10px] text-muted-foreground">
                        R$ {(p.count * p.price).toFixed(2)}/mês
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Usage & Activity */}
        <Card className="border">
          <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-base flex items-center gap-2">
              <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-violet-500" />
              Atividade & Créditos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0 space-y-3">
            {/* Credits Summary */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-violet-50 rounded-lg p-2 text-center">
                <p className="text-[9px] sm:text-[10px] text-muted-foreground">Média Créditos</p>
                <p className="text-base sm:text-lg font-bold text-violet-600">{avgCreditsUsed}/4</p>
              </div>
              <div className="bg-emerald-50 rounded-lg p-2 text-center">
                <p className="text-[9px] sm:text-[10px] text-muted-foreground">Novas este Mês</p>
                <p className="text-base sm:text-lg font-bold text-emerald-600">
                  {subscriptions.filter(s => {
                    const created = new Date(s.created_at);
                    const now = new Date();
                    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
            </div>

            {/* Recent Activity */}
            {subscriptions.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhuma atividade</p>
            ) : (
              <div className="space-y-1.5 max-h-40 sm:max-h-48 overflow-y-auto">
                {subscriptions.slice(0, 5).map(sub => (
                  <div key={sub.id} className="flex items-center gap-2 p-1.5 sm:p-2 rounded-lg hover:bg-accent/50">
                    <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full flex-shrink-0 ${sub.status === 'active' ? 'bg-emerald-500' : sub.status === 'cancelled' ? 'bg-red-500' : 'bg-muted-foreground/40'}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] sm:text-sm font-medium truncate">{sub.client_name}</p>
                      <p className="text-[9px] sm:text-xs text-muted-foreground truncate">
                        {sub.plan_name} • {sub.status === 'active' ? 'Ativa' : sub.status === 'cancelled' ? 'Cancelada' : sub.status}
                      </p>
                    </div>
                    <span className="text-[9px] sm:text-xs text-muted-foreground flex-shrink-0">
                      {formatDate(sub.start_date)}
                    </span>
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
