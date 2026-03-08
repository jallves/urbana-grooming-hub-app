import React from 'react';
import { useClientSubscriptions } from '@/hooks/admin/useClientSubscriptions';
import { useSubscriptionPlans } from '@/hooks/admin/useSubscriptionPlans';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Crown, Users, TrendingUp, AlertTriangle, DollarSign, 
  UserCheck, UserX, CalendarClock, Loader2, ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

const SubscriptionDashboardTab: React.FC = () => {
  const { subscriptions, payments, loading } = useClientSubscriptions();
  const { plans } = useSubscriptionPlans();

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-amber-500" /></div>;
  }

  const activeSubs = subscriptions.filter(s => s.status === 'active');
  const cancelledSubs = subscriptions.filter(s => s.status === 'cancelled');
  const mrr = activeSubs.reduce((a, s) => a + (s.plan_price || 0), 0);
  const totalReceived = payments.filter(p => p.status === 'paid').reduce((a, p) => a + p.amount, 0);
  
  // Churn rate (cancelled / total * 100)
  const churnRate = subscriptions.length > 0 
    ? ((cancelledSubs.length / subscriptions.length) * 100).toFixed(1)
    : '0.0';

  // Overdue subscriptions (next_billing_date < today and status active)
  const today = new Date().toISOString().split('T')[0];
  const overdueSubs = activeSubs.filter(s => s.next_billing_date && s.next_billing_date < today);

  // Upcoming renewals (next 7 days)
  const sevenDays = new Date();
  sevenDays.setDate(sevenDays.getDate() + 7);
  const sevenDaysStr = sevenDays.toISOString().split('T')[0];
  const upcomingRenewals = activeSubs.filter(
    s => s.next_billing_date && s.next_billing_date >= today && s.next_billing_date <= sevenDaysStr
  );

  // Plan distribution
  const planDistribution = plans.map(plan => {
    const count = activeSubs.filter(s => s.plan_id === plan.id).length;
    return { name: plan.name, count, color: plan.color || 'amber', price: plan.price };
  }).filter(p => p.count > 0);

  const formatDate = (d: string | null) => {
    if (!d) return '—';
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
  };

  const kpis = [
    { label: 'Assinantes Ativos', value: activeSubs.length, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'MRR (Receita Mensal)', value: `R$ ${mrr.toFixed(2)}`, icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Total Recebido', value: `R$ ${totalReceived.toFixed(2)}`, icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Taxa de Churn', value: `${churnRate}%`, icon: cancelledSubs.length > 0 ? ArrowDownRight : ArrowUpRight, color: cancelledSubs.length > 0 ? 'text-red-500' : 'text-emerald-500', bg: cancelledSubs.length > 0 ? 'bg-red-50' : 'bg-emerald-50' },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 mt-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {kpis.map(kpi => (
          <Card key={kpi.label} className="border shadow-sm">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1 min-w-0">
                  <p className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wider truncate">{kpi.label}</p>
                  <p className={`text-lg sm:text-2xl font-bold ${kpi.color} truncate`}>{kpi.value}</p>
                </div>
                <div className={`${kpi.bg} p-1.5 sm:p-2 rounded-lg flex-shrink-0`}>
                  <kpi.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${kpi.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Overdue Alert */}
        <Card className={`border ${overdueSubs.length > 0 ? 'border-red-200 bg-red-50/30' : 'border-emerald-200 bg-emerald-50/30'}`}>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-sm sm:text-base flex items-center gap-2">
              <AlertTriangle className={`h-4 w-4 ${overdueSubs.length > 0 ? 'text-red-500' : 'text-emerald-500'}`} />
              Cobranças Vencidas
              {overdueSubs.length > 0 && (
                <Badge variant="destructive" className="text-xs">{overdueSubs.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {overdueSubs.length === 0 ? (
              <p className="text-xs sm:text-sm text-emerald-600">✓ Nenhuma cobrança vencida</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {overdueSubs.map(sub => (
                  <div key={sub.id} className="flex items-center justify-between bg-white rounded-lg p-2 sm:p-3 border border-red-100">
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-medium truncate">{sub.client_name}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">{sub.plan_name} • Venceu: {formatDate(sub.next_billing_date)}</p>
                    </div>
                    <Badge variant="destructive" className="text-[10px] sm:text-xs flex-shrink-0">
                      R$ {sub.plan_price?.toFixed(2)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Renewals */}
        <Card className="border">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-sm sm:text-base flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-blue-500" />
              Próximas Renovações (7 dias)
              {upcomingRenewals.length > 0 && (
                <Badge className="bg-blue-100 text-blue-700 text-xs">{upcomingRenewals.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {upcomingRenewals.length === 0 ? (
              <p className="text-xs sm:text-sm text-muted-foreground">Nenhuma renovação nos próximos 7 dias</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {upcomingRenewals.map(sub => (
                  <div key={sub.id} className="flex items-center justify-between bg-blue-50/50 rounded-lg p-2 sm:p-3 border border-blue-100">
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-medium truncate">{sub.client_name}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">{sub.plan_name} • {formatDate(sub.next_billing_date)}</p>
                    </div>
                    <Badge className="bg-blue-100 text-blue-700 text-[10px] sm:text-xs flex-shrink-0">
                      R$ {sub.plan_price?.toFixed(2)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Plan Distribution */}
        <Card className="border">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-sm sm:text-base flex items-center gap-2">
              <Crown className="h-4 w-4 text-amber-500" />
              Distribuição por Plano
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {planDistribution.length === 0 ? (
              <p className="text-xs sm:text-sm text-muted-foreground">Nenhum assinante ativo nos planos</p>
            ) : (
              <div className="space-y-3">
                {planDistribution.map(p => {
                  const pct = activeSubs.length > 0 ? (p.count / activeSubs.length) * 100 : 0;
                  return (
                    <div key={p.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="font-medium">{p.name}</span>
                        <span className="text-muted-foreground">{p.count} assinante{p.count !== 1 ? 's' : ''} ({pct.toFixed(0)}%)</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-sm sm:text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-violet-500" />
              Atividade Recente
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {subscriptions.length === 0 ? (
              <p className="text-xs sm:text-sm text-muted-foreground">Nenhuma atividade registrada</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {subscriptions.slice(0, 5).map(sub => (
                  <div key={sub.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${sub.status === 'active' ? 'bg-emerald-500' : sub.status === 'cancelled' ? 'bg-red-500' : 'bg-gray-400'}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium truncate">{sub.client_name}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                        {sub.plan_name} • {sub.status === 'active' ? 'Ativa' : sub.status === 'cancelled' ? 'Cancelada' : sub.status}
                      </p>
                    </div>
                    <span className="text-[10px] sm:text-xs text-muted-foreground flex-shrink-0">
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
