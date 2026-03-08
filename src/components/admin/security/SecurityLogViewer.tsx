import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { toast as sonnerToast } from 'sonner';
import { subDays, startOfDay, endOfDay, parseISO, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import SecurityLogHeader from './log/SecurityLogHeader';
import SecurityLogFilters from './log/SecurityLogFilters';
import SecurityLogStats from './log/SecurityLogStats';
import SecurityLogTimeline from './log/SecurityLogTimeline';
import SecurityLogAlerts from './log/SecurityLogAlerts';
import SecurityLogList from './log/SecurityLogList';

import { SecurityLog, actionLabels, entityLabels } from './log/securityLogTypes';

export const SecurityLogViewer = () => {
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const { toast } = useToast();

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEntity, setFilterEntity] = useState<string>('all');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterUser, setFilterUser] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<Date | undefined>(subDays(new Date(), 30));
  const [dateTo, setDateTo] = useState<Date | undefined>(new Date());

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const fromDate = dateFrom ? startOfDay(dateFrom).toISOString() : subDays(new Date(), 30).toISOString();
      const toDate = dateTo ? endOfDay(dateTo).toISOString() : new Date().toISOString();

      const { data, error } = await supabase
        .from('admin_activity_log')
        .select('*')
        .gte('created_at', fromDate)
        .lte('created_at', toDate)
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;

      const adminIds = [...new Set((data || []).map(log => log.admin_id).filter(Boolean))];
      let adminInfo: Record<string, { name: string; email: string }> = {};

      if (adminIds.length > 0) {
        const { data: admins } = await supabase
          .from('admin_users')
          .select('id, name, email')
          .in('id', adminIds);

        if (admins) {
          adminInfo = admins.reduce((acc, admin) => {
            acc[admin.id] = { name: admin.name, email: admin.email };
            return acc;
          }, {} as Record<string, { name: string; email: string }>);
        }
      }

      const logsWithEmail: SecurityLog[] = (data || []).map(log => ({
        id: log.id,
        admin_id: log.admin_id,
        action: log.action,
        entity_type: log.entity_type,
        entity_id: log.entity_id,
        new_data: log.new_data as Record<string, any> | null,
        old_data: log.old_data as Record<string, any> | null,
        created_at: log.created_at || '',
        admin_name: log.admin_id ? adminInfo[log.admin_id]?.name : 'Sistema',
        admin_email: log.admin_id ? adminInfo[log.admin_id]?.email : 'sistema',
      }));

      setLogs(logsWithEmail);
    } catch (error) {
      console.error('Erro ao buscar logs:', error);
      toast({ title: 'Erro', description: 'Não foi possível carregar os logs de segurança', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast, dateFrom, dateTo]);

  useEffect(() => {
    fetchLogs();

    const channel = supabase
      .channel('security-logs-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admin_activity_log' }, async (payload) => {
        let adminName = 'Sistema';
        let adminEmail = 'sistema';
        if (payload.new.admin_id) {
          const { data: admin } = await supabase.from('admin_users').select('name, email').eq('id', payload.new.admin_id).single();
          adminName = admin?.name || 'Usuário';
          adminEmail = admin?.email || 'usuário';
        }

        const newLog: SecurityLog = {
          id: payload.new.id,
          admin_id: payload.new.admin_id,
          action: payload.new.action,
          entity_type: payload.new.entity_type,
          entity_id: payload.new.entity_id,
          new_data: payload.new.new_data as Record<string, any> | null,
          old_data: payload.new.old_data as Record<string, any> | null,
          created_at: payload.new.created_at,
          admin_name: adminName,
          admin_email: adminEmail,
        };

        setLogs(prev => [newLog, ...prev.slice(0, 999)]);
        sonnerToast.info('🔔 Novo log registrado', {
          description: `${actionLabels[newLog.action] || newLog.action} em ${entityLabels[newLog.entity_type || ''] || newLog.entity_type}`,
          duration: 3000,
        });
      })
      .subscribe((status) => setIsRealtimeConnected(status === 'SUBSCRIBED'));

    return () => { supabase.removeChannel(channel); };
  }, [fetchLogs]);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = !searchTerm ||
        log.admin_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.admin_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.entity_type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesEntity = filterEntity === 'all' || log.entity_type === filterEntity;
      const matchesAction = filterAction === 'all' || log.action === filterAction;
      const matchesUser = filterUser === 'all' || log.admin_email === filterUser || log.admin_name === filterUser;

      return matchesSearch && matchesEntity && matchesAction && matchesUser;
    });
  }, [logs, searchTerm, filterEntity, filterAction, filterUser]);

  const uniqueEntities = useMemo(() => [...new Set(logs.map(l => l.entity_type).filter(Boolean))], [logs]);
  const uniqueActions = useMemo(() => [...new Set(logs.map(l => l.action).filter(Boolean))], [logs]);
  const uniqueUsers = useMemo(() => {
    const users = new Map<string, string>();
    logs.forEach(l => {
      if (l.admin_email && l.admin_email !== 'sistema') {
        users.set(l.admin_email, l.admin_name || l.admin_email);
      }
    });
    return Array.from(users.entries()).map(([email, name]) => ({ email, name }));
  }, [logs]);

  const cleanupOldLogs = async () => {
    try {
      const thirtyDaysAgo = subDays(new Date(), 30);
      await supabase.from('admin_activity_log').delete().lt('created_at', thirtyDaysAgo.toISOString());
      toast({ title: 'Limpeza concluída', description: 'Logs com mais de 30 dias foram removidos' });
      fetchLogs();
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível limpar os logs antigos', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-5">
      <SecurityLogHeader
        isRealtimeConnected={isRealtimeConnected}
        loading={loading}
        onRefresh={fetchLogs}
        onCleanup={cleanupOldLogs}
        logs={filteredLogs}
      />

      <SecurityLogFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterEntity={filterEntity}
        onEntityChange={setFilterEntity}
        filterAction={filterAction}
        onActionChange={setFilterAction}
        filterUser={filterUser}
        onUserChange={setFilterUser}
        dateFrom={dateFrom}
        onDateFromChange={setDateFrom}
        dateTo={dateTo}
        onDateToChange={setDateTo}
        uniqueEntities={uniqueEntities}
        uniqueActions={uniqueActions}
        uniqueUsers={uniqueUsers}
      />

      <SecurityLogAlerts logs={logs} />

      <SecurityLogStats logs={logs} filteredLogs={filteredLogs} />

      <SecurityLogTimeline logs={filteredLogs} />

      <SecurityLogList logs={filteredLogs} loading={loading} />
    </div>
  );
};

export default SecurityLogViewer;
