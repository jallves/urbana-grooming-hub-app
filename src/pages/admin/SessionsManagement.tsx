import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { sessionManager, ActiveSession } from '@/hooks/useSessionManager';
import { supabase } from '@/integrations/supabase/client';
import { 
  RefreshCw, LogOut, Users, Monitor, Search, Filter, AlertCircle, CheckCircle, XCircle,
  Clock, Globe, Smartphone, Shield, Activity, Timer, Zap, Eye, Trash2, Download,
  ArrowUpDown, LayoutGrid, List, UserCheck
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as XLSX from 'xlsx';

const REFRESH_INTERVAL = 30; // seconds

const SessionsManagement: React.FC = () => {
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('activity');
  const [groupByType, setGroupByType] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<ActiveSession | null>(null);
  const [cleaningAll, setCleaningAll] = useState(false);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [now, setNow] = useState(new Date());
  const [refreshCountdown, setRefreshCountdown] = useState(REFRESH_INTERVAL);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { toast } = useToast();

  // Get current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id || null));
  }, []);

  // Tick every second for countdown + every 30s for timestamps
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
      setRefreshCountdown(prev => {
        if (prev <= 1) return REFRESH_INTERVAL;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const activeSessions = await sessionManager.getActiveSessions();
      setSessions(activeSessions);
      setRefreshCountdown(REFRESH_INTERVAL);
    } catch (error) {
      console.error('Erro ao carregar sessões:', error);
      toast({ title: 'Erro ao carregar sessões', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadSessions();
    const channel = supabase
      .channel('sessions-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'active_sessions' }, () => loadSessions())
      .subscribe((status) => setIsRealtimeConnected(status === 'SUBSCRIBED'));
    return () => { supabase.removeChannel(channel); };
  }, [loadSessions]);

  // Helpers
  const getDiffMins = useCallback((dateStr: string) => Math.floor((now.getTime() - new Date(dateStr).getTime()) / 60000), [now]);

  const getActivityStatus = useCallback((lastActivity: string) => {
    const diffMins = getDiffMins(lastActivity);
    if (diffMins < 2) return { key: 'online', label: 'Online agora', color: 'text-green-600', dotColor: 'bg-green-500', ringColor: 'ring-green-300', cardBorder: 'border-green-300', cardBg: 'bg-green-50/60' };
    if (diffMins < 10) return { key: 'active', label: 'Ativo recentemente', color: 'text-sky-600', dotColor: 'bg-sky-500', ringColor: 'ring-sky-300', cardBorder: 'border-sky-200', cardBg: 'bg-sky-50/40' };
    if (diffMins < 30) return { key: 'idle', label: 'Inativo', color: 'text-amber-600', dotColor: 'bg-amber-500', ringColor: 'ring-amber-300', cardBorder: 'border-amber-200', cardBg: 'bg-amber-50/40' };
    return { key: 'offline', label: 'Muito inativo', color: 'text-red-600', dotColor: 'bg-red-500', ringColor: 'ring-red-300', cardBorder: 'border-red-200', cardBg: 'bg-red-50/40' };
  }, [getDiffMins]);

  const getUserTypeConfig = (userType: string) => {
    const map: Record<string, { label: string; icon: React.ReactNode; bg: string; text: string; border: string; chartColor: string }> = {
      admin: { label: 'Admin', icon: <Shield className="h-3.5 w-3.5" />, bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', chartColor: '#ef4444' },
      barber: { label: 'Barbeiro', icon: <Users className="h-3.5 w-3.5" />, bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', chartColor: '#3b82f6' },
      client: { label: 'Cliente', icon: <Users className="h-3.5 w-3.5" />, bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', chartColor: '#10b981' },
      painel_cliente: { label: 'Painel Cliente', icon: <Monitor className="h-3.5 w-3.5" />, bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-200', chartColor: '#14b8a6' },
      totem: { label: 'Totem', icon: <Smartphone className="h-3.5 w-3.5" />, bg: 'bg-violet-100', text: 'text-violet-700', border: 'border-violet-200', chartColor: '#8b5cf6' },
    };
    return map[userType] || { label: userType, icon: <Users className="h-3.5 w-3.5" />, bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200', chartColor: '#6b7280' };
  };

  const parseBrowser = (ua: string | null) => {
    if (!ua) return 'Desconhecido';
    if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
    if (ua.includes('Edg')) return 'Edge';
    return 'Outro';
  };

  const parseDevice = (ua: string | null) => {
    if (!ua) return 'Desconhecido';
    if (/Mobile|Android|iPhone/i.test(ua)) return 'Mobile';
    if (/Tablet|iPad/i.test(ua)) return 'Tablet';
    return 'Desktop';
  };

  // Filter + Sort
  const filteredSessions = useMemo(() => {
    let filtered = sessions;
    if (typeFilter !== 'all') filtered = filtered.filter(s => s.user_type === typeFilter);
    if (statusFilter !== 'all') {
      filtered = filtered.filter(s => getActivityStatus(s.last_activity_at).key === statusFilter);
    }
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(s =>
        s.user_name?.toLowerCase().includes(q) ||
        s.user_email?.toLowerCase().includes(q) ||
        s.ip_address?.toLowerCase().includes(q)
      );
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'activity': return new Date(b.last_activity_at).getTime() - new Date(a.last_activity_at).getTime();
        case 'login_recent': return new Date(b.login_at).getTime() - new Date(a.login_at).getTime();
        case 'login_old': return new Date(a.login_at).getTime() - new Date(b.login_at).getTime();
        case 'duration': return new Date(a.login_at).getTime() - new Date(b.login_at).getTime(); // longest first
        case 'name': return (a.user_name || '').localeCompare(b.user_name || '');
        default: return 0;
      }
    });

    return filtered;
  }, [sessions, typeFilter, statusFilter, searchTerm, sortBy, getActivityStatus]);

  // Stats
  const stats = useMemo(() => {
    const online = sessions.filter(s => getDiffMins(s.last_activity_at) < 2).length;
    const active = sessions.filter(s => { const d = getDiffMins(s.last_activity_at); return d >= 2 && d < 10; }).length;
    const idle = sessions.filter(s => { const d = getDiffMins(s.last_activity_at); return d >= 10 && d < 30; }).length;
    const veryIdle = sessions.filter(s => getDiffMins(s.last_activity_at) >= 30).length;

    const byType: { name: string; value: number; color: string }[] = [];
    const typeCounts = new Map<string, number>();
    sessions.forEach(s => typeCounts.set(s.user_type, (typeCounts.get(s.user_type) || 0) + 1));
    typeCounts.forEach((count, type) => {
      byType.push({ name: getUserTypeConfig(type).label, value: count, color: getUserTypeConfig(type).chartColor });
    });

    const byDevice: { name: string; value: number; color: string }[] = [];
    const deviceCounts = new Map<string, number>();
    sessions.forEach(s => { const d = parseDevice(s.user_agent); deviceCounts.set(d, (deviceCounts.get(d) || 0) + 1); });
    const deviceColors: Record<string, string> = { Desktop: '#6366f1', Mobile: '#f59e0b', Tablet: '#06b6d4', Desconhecido: '#9ca3af' };
    deviceCounts.forEach((count, device) => {
      byDevice.push({ name: device, value: count, color: deviceColors[device] || '#6b7280' });
    });

    const byBrowser: { name: string; value: number; color: string }[] = [];
    const browserCounts = new Map<string, number>();
    sessions.forEach(s => { const b = parseBrowser(s.user_agent); browserCounts.set(b, (browserCounts.get(b) || 0) + 1); });
    const browserColors: Record<string, string> = { Chrome: '#4285f4', Firefox: '#ff7139', Safari: '#007aff', Edge: '#0078d7', Outro: '#9ca3af' };
    browserCounts.forEach((count, browser) => {
      byBrowser.push({ name: browser, value: count, color: browserColors[browser] || '#6b7280' });
    });

    return { total: sessions.length, online, active, idle, veryIdle, byType, byDevice, byBrowser };
  }, [sessions, now, getDiffMins]);

  // Actions
  const handleForceLogout = async (session: ActiveSession) => {
    try {
      const success = await sessionManager.forceLogoutSession(session.id);
      if (!success) throw new Error('Falha');
      toast({ title: 'Sessão encerrada', description: `${session.user_email || session.user_name} foi desconectado` });
      loadSessions();
    } catch {
      toast({ title: 'Erro ao encerrar sessão', variant: 'destructive' });
    } finally {
      setSessionToDelete(null);
    }
  };

  const handleCleanupAllSessions = async () => {
    setCleaningAll(true);
    try {
      for (const session of sessions) {
        await sessionManager.forceLogoutSession(session.id);
      }
      localStorage.removeItem('sessions');
      toast({ title: 'Todas as sessões encerradas' });
      await loadSessions();
    } catch {
      toast({ title: 'Erro ao limpar sessões', variant: 'destructive' });
    } finally {
      setCleaningAll(false);
    }
  };

  const handleExport = () => {
    const rows = filteredSessions.map(s => ({
      'Nome': s.user_name || '',
      'Email': s.user_email || '',
      'Tipo': getUserTypeConfig(s.user_type).label,
      'Status': getActivityStatus(s.last_activity_at).label,
      'Login': format(new Date(s.login_at), "dd/MM/yyyy HH:mm", { locale: ptBR }),
      'Última Atividade': format(new Date(s.last_activity_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR }),
      'IP': s.ip_address || '',
      'Dispositivo': parseDevice(s.user_agent),
      'Navegador': parseBrowser(s.user_agent),
      'Expira em': format(new Date(s.expires_at), "dd/MM/yyyy HH:mm", { locale: ptBR }),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sessões Ativas');
    ws['!cols'] = Object.keys(rows[0] || {}).map(k => ({ wch: Math.max(k.length, 18) }));
    XLSX.writeFile(wb, `sessoes-ativas-${format(new Date(), 'yyyy-MM-dd-HHmm')}.xlsx`);
  };

  // Donut chart component
  const DonutChart = ({ data, title, icon: Icon }: { data: { name: string; value: number; color: string }[]; title: string; icon: React.ElementType }) => (
    <Card className="border border-gray-200 shadow-sm">
      <CardHeader className="pb-1 pt-3 px-4">
        <CardTitle className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5" /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3">
        {data.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">Sem dados</p>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-[80px] h-[80px] flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data} cx="50%" cy="50%" innerRadius={22} outerRadius={36} paddingAngle={2} dataKey="value" stroke="none">
                    {data.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                  </Pie>
                  <Tooltip content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0];
                    return (
                      <div className="bg-white border rounded-lg shadow-md p-2 text-xs">
                        <span className="font-semibold">{d.name}: </span>
                        <span>{d.value}</span>
                      </div>
                    );
                  }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1 flex-1">
              {data.map(item => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-gray-600 truncate">{item.name}</span>
                  </div>
                  <span className="font-bold text-gray-900">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Group sessions by type
  const groupedSessions = useMemo(() => {
    if (!groupByType) return null;
    const groups = new Map<string, ActiveSession[]>();
    filteredSessions.forEach(s => {
      if (!groups.has(s.user_type)) groups.set(s.user_type, []);
      groups.get(s.user_type)!.push(s);
    });
    return groups;
  }, [filteredSessions, groupByType]);

  const renderSessionCard = (session: ActiveSession) => {
    const status = getActivityStatus(session.last_activity_at);
    const typeConf = getUserTypeConfig(session.user_type);
    const browser = parseBrowser(session.user_agent);
    const device = parseDevice(session.user_agent);
    const isCurrentUser = session.user_id === currentUserId;

    return (
      <div
        key={session.id}
        className={`rounded-xl border-2 ${status.cardBorder} ${status.cardBg} p-4 transition-all hover:shadow-md ${isCurrentUser ? 'ring-2 ring-amber-400 ring-offset-1' : ''}`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Status dot */}
            <div className="mt-1.5 flex-shrink-0">
              {status.key === 'online' ? (
                <span className="relative flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-green-500 ring-2 ring-green-200" />
                </span>
              ) : (
                <span className={`inline-flex rounded-full h-3.5 w-3.5 ${status.dotColor} opacity-70`} />
              )}
            </div>

            <div className="flex-1 min-w-0">
              {/* Name + badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-gray-900 text-base truncate">
                  {session.user_name || 'Usuário desconhecido'}
                </span>
                {isCurrentUser && (
                  <Badge className="bg-amber-100 text-amber-800 border-amber-300 border text-[10px] gap-1 px-2 py-0">
                    <UserCheck className="h-3 w-3" />
                    Você
                  </Badge>
                )}
                <Badge className={`${typeConf.bg} ${typeConf.text} ${typeConf.border} border text-[10px] gap-1 px-2 py-0`}>
                  {typeConf.icon}
                  {typeConf.label}
                </Badge>
                <span className={`text-xs font-semibold ${status.color} px-2 py-0.5 rounded-full ${status.cardBg} border ${status.cardBorder}`}>
                  {status.label}
                </span>
              </div>

              <p className="text-sm text-gray-600 truncate mt-0.5">
                {session.user_email || 'Email não informado'}
              </p>

              {/* Details grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-gray-400" />
                  <span className="text-gray-400">Login:</span>
                  <span className="font-medium text-gray-700">{format(new Date(session.login_at), "dd/MM 'às' HH:mm", { locale: ptBR })}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Activity className="h-3 w-3 text-gray-400" />
                  <span className="text-gray-400">Atividade:</span>
                  <span className={`font-medium ${status.color}`}>{formatDistanceToNow(new Date(session.last_activity_at), { locale: ptBR, addSuffix: true })}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Timer className="h-3 w-3 text-gray-400" />
                  <span className="text-gray-400">Duração:</span>
                  <span className="font-medium text-gray-700">{formatDistanceToNow(new Date(session.login_at), { locale: ptBR })}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Globe className="h-3 w-3 text-gray-400" />
                  <span className="text-gray-400">IP:</span>
                  <span className="font-medium text-gray-700">{session.ip_address || '—'}</span>
                </span>
              </div>

              <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  {device === 'Desktop' ? <Monitor className="h-3 w-3" /> : <Smartphone className="h-3 w-3" />}
                  {device}
                </span>
                <span>•</span>
                <span>{browser}</span>
                <span>•</span>
                <span className="font-mono text-[10px] text-gray-300 truncate max-w-[200px]">{session.id.slice(0, 8)}</span>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setSessionToDelete(session)}
            className="text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700 hover:border-red-400 flex-shrink-0 font-semibold"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Derrubar
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-amber-100 to-amber-200 rounded-xl shadow-sm">
            <Activity className="h-6 w-6 text-amber-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-amber-900">Dashboard de Sessões</h2>
              {isRealtimeConnected ? (
                <Badge className="bg-green-100 text-green-700 border border-green-300 text-[10px] gap-1">
                  <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" /></span>
                  AO VIVO
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] text-muted-foreground">Conectando...</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Monitore, gerencie e derrube sessões em tempo real
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          {/* Auto-refresh countdown */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-gray-50 border rounded-md px-2.5 py-1.5">
            <div className="relative w-4 h-4">
              <svg className="w-4 h-4 -rotate-90" viewBox="0 0 20 20">
                <circle cx="10" cy="10" r="8" fill="none" stroke="#e5e7eb" strokeWidth="2" />
                <circle cx="10" cy="10" r="8" fill="none" stroke="#f59e0b" strokeWidth="2"
                  strokeDasharray={`${(refreshCountdown / REFRESH_INTERVAL) * 50.27} 50.27`}
                  strokeLinecap="round" className="transition-all duration-1000"
                />
              </svg>
            </div>
            <span className="font-mono w-4 text-center">{refreshCountdown}</span>
            <span>s</span>
          </div>

          <Button onClick={handleExport} disabled={filteredSessions.length === 0} size="sm" variant="outline" className="text-indigo-600 border-indigo-200 hover:bg-indigo-50">
            <Download className="mr-1.5 h-4 w-4" />
            Exportar
          </Button>
          <Button onClick={handleCleanupAllSessions} disabled={cleaningAll || sessions.length === 0} variant="destructive" size="sm">
            <Trash2 className={`mr-1.5 h-4 w-4 ${cleaningAll ? 'animate-spin' : ''}`} />
            Derrubar Todas ({stats.total})
          </Button>
          <Button onClick={loadSessions} disabled={loading} size="sm" variant="outline">
            <RefreshCw className={`mr-1.5 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Stats Row 1 — Activity Status */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        {[
          { label: 'Online Agora', value: stats.online, icon: Zap, bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' },
          { label: 'Ativos Recente', value: stats.active, icon: CheckCircle, bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-700' },
          { label: 'Inativos', value: stats.idle, icon: AlertCircle, bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
          { label: 'Muito Inativos', value: stats.veryIdle, icon: XCircle, bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className={`${stat.bg} ${stat.border} border shadow-sm`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-xs font-medium ${stat.text} opacity-80`}>{stat.label}</p>
                    <p className={`text-3xl font-bold ${stat.text} mt-1`}>{stat.value}</p>
                  </div>
                  <div className={`p-2 rounded-full ${stat.bg}`}>
                    <Icon className={`h-5 w-5 ${stat.text}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Stats Row 2 — Donut Charts */}
      <div className="grid gap-3 grid-cols-1 md:grid-cols-3">
        <DonutChart data={stats.byType} title="Por Tipo de Usuário" icon={Users} />
        <DonutChart data={stats.byDevice} title="Por Dispositivo" icon={Smartphone} />
        <DonutChart data={stats.byBrowser} title="Por Navegador" icon={Globe} />
      </div>

      {/* Filters */}
      <Card className="border border-amber-200/60 bg-amber-50/20 shadow-sm">
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filtros e Ordenação</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email ou IP..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white h-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="bg-white h-9 text-xs">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="admin">Administradores</SelectItem>
                <SelectItem value="barber">Barbeiros</SelectItem>
                <SelectItem value="client">Clientes</SelectItem>
                <SelectItem value="painel_cliente">Painel Cliente</SelectItem>
                <SelectItem value="totem">Totens</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-white h-9 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="online">🟢 Online agora</SelectItem>
                <SelectItem value="active">🔵 Ativo recentemente</SelectItem>
                <SelectItem value="idle">🟡 Inativo</SelectItem>
                <SelectItem value="offline">🔴 Muito inativo</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="bg-white h-9 text-xs">
                <ArrowUpDown className="h-3 w-3 mr-1" />
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="activity">Última atividade</SelectItem>
                <SelectItem value="login_recent">Login mais recente</SelectItem>
                <SelectItem value="login_old">Login mais antigo</SelectItem>
                <SelectItem value="duration">Maior duração</SelectItem>
                <SelectItem value="name">Nome (A-Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* View toggle */}
          <div className="flex items-center gap-2 mt-3">
            <Button
              variant={groupByType ? "default" : "outline"}
              size="sm"
              onClick={() => setGroupByType(!groupByType)}
              className={`h-7 text-xs ${groupByType ? 'bg-amber-600 hover:bg-amber-700' : ''}`}
            >
              <LayoutGrid className="h-3 w-3 mr-1" />
              Agrupar por tipo
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sessions List */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Eye className="h-5 w-5 text-amber-600" />
                Sessões Ativas ({filteredSessions.length})
              </CardTitle>
              <CardDescription className="mt-0.5">
                Clique em "Derrubar" para desconectar um usuário imediatamente
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin text-amber-500 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Carregando sessões...</p>
              </div>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="text-center py-16">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-40" />
              <p className="text-muted-foreground font-medium">
                {searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
                  ? 'Nenhuma sessão encontrada com os filtros aplicados'
                  : 'Nenhuma sessão ativa no momento'
                }
              </p>
            </div>
          ) : groupByType && groupedSessions ? (
            // Grouped view
            <div className="space-y-6">
              {Array.from(groupedSessions.entries()).map(([type, typeSessions]) => {
                const typeConf = getUserTypeConfig(type);
                return (
                  <div key={type}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-px flex-1 bg-gray-200" />
                      <Badge className={`${typeConf.bg} ${typeConf.text} ${typeConf.border} border gap-1`}>
                        {typeConf.icon}
                        {typeConf.label} ({typeSessions.length})
                      </Badge>
                      <div className="h-px flex-1 bg-gray-200" />
                    </div>
                    <div className="space-y-3">
                      {typeSessions.map(renderSessionCard)}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // Flat view
            <div className="space-y-3">
              {filteredSessions.map(renderSessionCard)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!sessionToDelete} onOpenChange={() => setSessionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-700">
              <LogOut className="h-5 w-5" />
              Derrubar Sessão
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Tem certeza que deseja derrubar a sessão de{' '}
                <strong className="text-foreground">{sessionToDelete?.user_name || sessionToDelete?.user_email}</strong>?
              </p>
              <p className="text-xs">
                O usuário será desconectado imediatamente e precisará fazer login novamente.
              </p>
              {sessionToDelete && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs space-y-1">
                  <p><span className="text-gray-500">Tipo:</span> <span className="font-medium">{getUserTypeConfig(sessionToDelete.user_type).label}</span></p>
                  <p><span className="text-gray-500">Email:</span> <span className="font-medium">{sessionToDelete.user_email || '—'}</span></p>
                  <p><span className="text-gray-500">IP:</span> <span className="font-medium">{sessionToDelete.ip_address || '—'}</span></p>
                  <p><span className="text-gray-500">Login:</span> <span className="font-medium">{format(new Date(sessionToDelete.login_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span></p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => sessionToDelete && handleForceLogout(sessionToDelete)}
              className="bg-destructive hover:bg-destructive/90"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Confirmar — Derrubar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SessionsManagement;
