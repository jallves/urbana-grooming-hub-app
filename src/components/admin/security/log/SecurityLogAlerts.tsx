import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, ShieldAlert, Trash2, LogOut, Clock } from 'lucide-react';
import { SecurityLog, entityLabels, actionLabels, getLogSeverity } from './securityLogTypes';
import { format, parseISO, isAfter, subHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  logs: SecurityLog[];
}

interface AlertItem {
  id: string;
  type: 'deletion' | 'off_hours' | 'mass_action' | 'sensitive_change';
  severity: 'critical' | 'warning';
  title: string;
  description: string;
  time: string;
  icon: typeof AlertTriangle;
}

const SecurityLogAlerts: React.FC<Props> = ({ logs }) => {
  const alerts = useMemo(() => {
    const items: AlertItem[] = [];
    const recent = logs.filter(l => isAfter(new Date(l.created_at), subHours(new Date(), 24)));

    // 1. Deletions in last 24h
    const deletions = recent.filter(l => l.action === 'delete');
    if (deletions.length > 0) {
      deletions.forEach(d => {
        const entityName = d.old_data?.nome || d.old_data?.name || d.old_data?.descricao || '';
        items.push({
          id: `del-${d.id}`,
          type: 'deletion',
          severity: 'critical',
          title: `Exclusão: ${entityLabels[d.entity_type || ''] || d.entity_type}`,
          description: entityName ? `"${entityName}" excluído por ${d.admin_name || 'Sistema'}` : `Registro excluído por ${d.admin_name || 'Sistema'}`,
          time: d.created_at,
          icon: Trash2,
        });
      });
    }

    // 2. Logins outside business hours (before 7am or after 23pm)
    const offHourLogins = recent.filter(l => {
      if (l.action !== 'login') return false;
      const hour = new Date(l.created_at).getHours();
      return hour < 7 || hour >= 23;
    });
    offHourLogins.forEach(l => {
      items.push({
        id: `off-${l.id}`,
        type: 'off_hours',
        severity: 'warning',
        title: 'Login fora do horário',
        description: `${l.admin_name || l.new_data?.user_email || 'Usuário'} acessou às ${format(parseISO(l.created_at), 'HH:mm')}`,
        time: l.created_at,
        icon: Clock,
      });
    });

    // 3. Sensitive changes (settings, access)
    const sensitiveChanges = recent.filter(l =>
      (l.action === 'update' && l.entity_type === 'settings') ||
      l.action === 'grant' || l.action === 'revoke'
    );
    sensitiveChanges.forEach(l => {
      items.push({
        id: `sens-${l.id}`,
        type: 'sensitive_change',
        severity: 'warning',
        title: `${actionLabels[l.action] || l.action}: ${entityLabels[l.entity_type || ''] || l.entity_type}`,
        description: `Por ${l.admin_name || 'Sistema'}`,
        time: l.created_at,
        icon: ShieldAlert,
      });
    });

    // 4. Mass actions (more than 5 of the same action type in 1 hour)
    const actionCounts = new Map<string, number>();
    recent.forEach(l => {
      const key = `${l.action}-${l.admin_email}`;
      actionCounts.set(key, (actionCounts.get(key) || 0) + 1);
    });
    actionCounts.forEach((count, key) => {
      if (count >= 5) {
        const [action, email] = key.split('-');
        if (action !== 'view') {
          items.push({
            id: `mass-${key}`,
            type: 'mass_action',
            severity: 'warning',
            title: 'Ação em massa detectada',
            description: `${email} realizou ${count}x "${actionLabels[action] || action}" nas últimas 24h`,
            time: new Date().toISOString(),
            icon: AlertTriangle,
          });
        }
      }
    });

    return items.sort((a, b) => {
      if (a.severity === 'critical' && b.severity !== 'critical') return -1;
      if (a.severity !== 'critical' && b.severity === 'critical') return 1;
      return new Date(b.time).getTime() - new Date(a.time).getTime();
    }).slice(0, 8);
  }, [logs]);

  if (alerts.length === 0) return null;

  const criticalCount = alerts.filter(a => a.severity === 'critical').length;

  return (
    <Card className={`border ${criticalCount > 0 ? 'border-red-200 bg-red-50/30' : 'border-amber-200 bg-amber-50/30'}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <ShieldAlert className={`h-4 w-4 ${criticalCount > 0 ? 'text-red-600' : 'text-amber-600'}`} />
          Alertas de Segurança
          <Badge variant="outline" className={criticalCount > 0 ? 'bg-red-100 text-red-700 border-red-300' : 'bg-amber-100 text-amber-700 border-amber-300'}>
            {alerts.length}
          </Badge>
          <span className="text-xs font-normal text-muted-foreground ml-auto">Últimas 24h</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
          {alerts.map(alert => {
            const Icon = alert.icon;
            const isCritical = alert.severity === 'critical';
            return (
              <div
                key={alert.id}
                className={`flex items-start gap-3 p-2.5 rounded-lg border ${
                  isCritical ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
                }`}
              >
                <div className={`p-1 rounded-full ${isCritical ? 'bg-red-100' : 'bg-amber-100'} flex-shrink-0 mt-0.5`}>
                  <Icon className={`h-3.5 w-3.5 ${isCritical ? 'text-red-600' : 'text-amber-600'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold ${isCritical ? 'text-red-800' : 'text-amber-800'}`}>
                    {alert.title}
                  </p>
                  <p className="text-[11px] text-gray-600 truncate">{alert.description}</p>
                </div>
                <span className="text-[10px] text-gray-400 flex-shrink-0">
                  {alert.time && format(parseISO(alert.time), 'HH:mm', { locale: ptBR })}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default SecurityLogAlerts;
