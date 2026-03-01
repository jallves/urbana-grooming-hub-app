import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { sessionManager, ActiveSession } from '@/hooks/useSessionManager';
import { supabase } from '@/integrations/supabase/client';
import { 
  RefreshCw, 
  LogOut, 
  Users, 
  Monitor, 
  Search,
  Filter,
  AlertCircle,
  CheckCircle,
  XCircle,
  Radio,
  Clock,
  Globe,
  Smartphone,
  Shield,
  Activity,
  Timer,
  Zap,
  Eye,
  Trash2
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const SessionsManagement: React.FC = () => {
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sessionToDelete, setSessionToDelete] = useState<ActiveSession | null>(null);
  const [cleaningAll, setCleaningAll] = useState(false);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [now, setNow] = useState(new Date());
  const { toast } = useToast();

  // Tick every 30s for live timestamps
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const activeSessions = await sessionManager.getActiveSessions();
      setSessions(activeSessions);
    } catch (error) {
      console.error('Erro ao carregar sessões:', error);
      toast({ title: 'Erro ao carregar sessões', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
    const channel = supabase
      .channel('sessions-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'active_sessions' }, () => loadSessions())
      .subscribe((status) => setIsRealtimeConnected(status === 'SUBSCRIBED'));
    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    let filtered = sessions;
    if (typeFilter !== 'all') filtered = filtered.filter(s => s.user_type === typeFilter);
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(s =>
        s.user_name?.toLowerCase().includes(q) ||
        s.user_email?.toLowerCase().includes(q) ||
        s.ip_address?.toLowerCase().includes(q)
      );
    }
    setFilteredSessions(filtered);
  }, [searchTerm, typeFilter, sessions]);

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
      // Invalidate all active sessions in DB
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

  // Helpers
  const getDiffMins = (dateStr: string) => Math.floor((now.getTime() - new Date(dateStr).getTime()) / 60000);

  const getActivityStatus = (lastActivity: string) => {
    const diffMins = getDiffMins(lastActivity);
    if (diffMins < 2) return { key: 'online', label: 'Online agora', color: 'text-green-600', dotColor: 'bg-green-500', ringColor: 'ring-green-300', cardBorder: 'border-green-300', cardBg: 'bg-green-50/60' };
    if (diffMins < 10) return { key: 'active', label: 'Ativo recentemente', color: 'text-sky-600', dotColor: 'bg-sky-500', ringColor: 'ring-sky-300', cardBorder: 'border-sky-200', cardBg: 'bg-sky-50/40' };
    if (diffMins < 30) return { key: 'idle', label: 'Inativo', color: 'text-amber-600', dotColor: 'bg-amber-500', ringColor: 'ring-amber-300', cardBorder: 'border-amber-200', cardBg: 'bg-amber-50/40' };
    return { key: 'offline', label: 'Muito inativo', color: 'text-red-600', dotColor: 'bg-red-500', ringColor: 'ring-red-300', cardBorder: 'border-red-200', cardBg: 'bg-red-50/40' };
  };

  const getSessionDuration = (loginAt: string) => {
    return formatDistanceToNow(new Date(loginAt), { locale: ptBR });
  };

  const getUserTypeConfig = (userType: string) => {
    const map: Record<string, { label: string; icon: React.ReactNode; bg: string; text: string; border: string }> = {
      admin: { label: 'Admin', icon: <Shield className="h-3.5 w-3.5" />, bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
      barber: { label: 'Barbeiro', icon: <Users className="h-3.5 w-3.5" />, bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
      client: { label: 'Cliente', icon: <Users className="h-3.5 w-3.5" />, bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
      painel_cliente: { label: 'Painel Cliente', icon: <Monitor className="h-3.5 w-3.5" />, bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-200' },
      totem: { label: 'Totem', icon: <Smartphone className="h-3.5 w-3.5" />, bg: 'bg-violet-100', text: 'text-violet-700', border: 'border-violet-200' },
    };
    return map[userType] || { label: userType, icon: <Users className="h-3.5 w-3.5" />, bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' };
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

  // Stats
  const stats = useMemo(() => {
    const online = sessions.filter(s => getDiffMins(s.last_activity_at) < 2).length;
    const active = sessions.filter(s => { const d = getDiffMins(s.last_activity_at); return d >= 2 && d < 10; }).length;
    const idle = sessions.filter(s => { const d = getDiffMins(s.last_activity_at); return d >= 10 && d < 30; }).length;
    const veryIdle = sessions.filter(s => getDiffMins(s.last_activity_at) >= 30).length;
    const byType = {
      admin: sessions.filter(s => s.user_type === 'admin').length,
      barber: sessions.filter(s => s.user_type === 'barber').length,
      client: sessions.filter(s => ['client', 'painel_cliente'].includes(s.user_type)).length,
      totem: sessions.filter(s => s.user_type === 'totem').length,
    };
    const browsers: Record<string, number> = {};
    const devices: Record<string, number> = {};
    sessions.forEach(s => {
      const b = parseBrowser(s.user_agent);
      const d = parseDevice(s.user_agent);
      browsers[b] = (browsers[b] || 0) + 1;
      devices[d] = (devices[d] || 0) + 1;
    });
    return { total: sessions.length, online, active, idle, veryIdle, byType, browsers, devices };
  }, [sessions, now]);

  return (
    <div className="space-y-6 p-4 md:p-6">
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
              Monitore, gerencie e derrube sessões de qualquer usuário em tempo real
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={handleCleanupAllSessions} disabled={cleaningAll || sessions.length === 0} variant="destructive" size="sm">
            <Trash2 className={`mr-2 h-4 w-4 ${cleaningAll ? 'animate-spin' : ''}`} />
            Derrubar Todas ({stats.total})
          </Button>
          <Button onClick={loadSessions} disabled={loading} size="sm" variant="outline">
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Dashboard Stats Row 1 — Activity Status */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        {[
          { label: 'Online Agora', value: stats.online, icon: Zap, bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', dot: 'bg-green-500' },
          { label: 'Ativos Recente', value: stats.active, icon: CheckCircle, bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-700', dot: 'bg-sky-500' },
          { label: 'Inativos', value: stats.idle, icon: AlertCircle, bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500' },
          { label: 'Muito Inativos', value: stats.veryIdle, icon: XCircle, bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', dot: 'bg-red-500' },
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

      {/* Dashboard Stats Row 2 — By Type + Device + Browser */}
      <div className="grid gap-3 grid-cols-1 md:grid-cols-3">
        {/* By User Type */}
        <Card className="border border-amber-200 bg-amber-50/30 shadow-sm">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-sm font-semibold text-amber-800 flex items-center gap-2">
              <Users className="h-4 w-4" /> Por Tipo de Usuário
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="space-y-2">
              {[
                { label: 'Administradores', value: stats.byType.admin, color: 'bg-red-500' },
                { label: 'Barbeiros', value: stats.byType.barber, color: 'bg-blue-500' },
                { label: 'Clientes', value: stats.byType.client, color: 'bg-emerald-500' },
                { label: 'Totens', value: stats.byType.totem, color: 'bg-violet-500' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                    <span className="text-sm text-gray-700">{item.label}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{item.value}</span>
                </div>
              ))}
              <div className="border-t border-amber-200 pt-2 mt-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-amber-800">Total</span>
                <span className="text-lg font-bold text-amber-900">{stats.total}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* By Device */}
        <Card className="border border-slate-200 bg-slate-50/30 shadow-sm">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Smartphone className="h-4 w-4" /> Por Dispositivo
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="space-y-2">
              {Object.entries(stats.devices).sort(([,a],[,b]) => b - a).map(([device, count]) => (
                <div key={device} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {device === 'Desktop' ? <Monitor className="h-3.5 w-3.5 text-slate-500" /> : <Smartphone className="h-3.5 w-3.5 text-slate-500" />}
                    <span className="text-sm text-gray-700">{device}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-slate-500 rounded-full" style={{ width: `${stats.total ? (count / stats.total) * 100 : 0}%` }} />
                    </div>
                    <span className="text-sm font-bold text-gray-900 w-6 text-right">{count}</span>
                  </div>
                </div>
              ))}
              {Object.keys(stats.devices).length === 0 && <p className="text-xs text-muted-foreground">Sem dados</p>}
            </div>
          </CardContent>
        </Card>

        {/* By Browser */}
        <Card className="border border-slate-200 bg-slate-50/30 shadow-sm">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Globe className="h-4 w-4" /> Por Navegador
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="space-y-2">
              {Object.entries(stats.browsers).sort(([,a],[,b]) => b - a).map(([browser, count]) => (
                <div key={browser} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{browser}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${stats.total ? (count / stats.total) * 100 : 0}%` }} />
                    </div>
                    <span className="text-sm font-bold text-gray-900 w-6 text-right">{count}</span>
                  </div>
                </div>
              ))}
              {Object.keys(stats.browsers).length === 0 && <p className="text-xs text-muted-foreground">Sem dados</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border border-amber-200/60 bg-amber-50/20 shadow-sm">
        <CardContent className="pt-4">
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email ou IP..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-[200px] bg-white">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filtrar por tipo" />
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
                {searchTerm || typeFilter !== 'all' 
                  ? 'Nenhuma sessão encontrada com os filtros aplicados'
                  : 'Nenhuma sessão ativa no momento'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSessions.map((session) => {
                const status = getActivityStatus(session.last_activity_at);
                const typeConf = getUserTypeConfig(session.user_type);
                const loginDate = new Date(session.login_at);
                const lastActivityDate = new Date(session.last_activity_at);
                const browser = parseBrowser(session.user_agent);
                const device = parseDevice(session.user_agent);
                
                return (
                  <div 
                    key={session.id}
                    className={`rounded-xl border-2 ${status.cardBorder} ${status.cardBg} p-4 transition-all hover:shadow-md`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                      {/* Left: User info */}
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* Pulsing status dot */}
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
                            <Badge className={`${typeConf.bg} ${typeConf.text} ${typeConf.border} border text-[10px] gap-1 px-2 py-0`}>
                              {typeConf.icon}
                              {typeConf.label}
                            </Badge>
                            <span className={`text-xs font-semibold ${status.color} px-2 py-0.5 rounded-full ${status.cardBg} border ${status.cardBorder}`}>
                              {status.label}
                            </span>
                          </div>
                          
                          {/* Email */}
                          <p className="text-sm text-gray-600 truncate mt-0.5">
                            {session.user_email || 'Email não informado'}
                          </p>
                          
                          {/* Details grid */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-gray-400" />
                              <span className="text-gray-400">Login:</span>
                              <span className="font-medium text-gray-700">{format(loginDate, "dd/MM 'às' HH:mm", { locale: ptBR })}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <Activity className="h-3 w-3 text-gray-400" />
                              <span className="text-gray-400">Atividade:</span>
                              <span className={`font-medium ${status.color}`}>{formatDistanceToNow(lastActivityDate, { locale: ptBR, addSuffix: true })}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <Timer className="h-3 w-3 text-gray-400" />
                              <span className="text-gray-400">Duração:</span>
                              <span className="font-medium text-gray-700">{getSessionDuration(session.login_at)}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <Globe className="h-3 w-3 text-gray-400" />
                              <span className="text-gray-400">IP:</span>
                              <span className="font-medium text-gray-700">{session.ip_address || '—'}</span>
                            </span>
                          </div>

                          {/* Browser/Device info */}
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
                      
                      {/* Right: Action */}
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
              })}
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
