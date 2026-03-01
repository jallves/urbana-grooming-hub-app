import React, { useState, useEffect } from 'react';
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
  Smartphone
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
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const SessionsManagement: React.FC = () => {
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sessionToDelete, setSessionToDelete] = useState<ActiveSession | null>(null);
  const [cleaningAll, setCleaningAll] = useState(false);
  const [cleaningMy, setCleaningMy] = useState(false);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const { toast } = useToast();

  const loadSessions = async () => {
    setLoading(true);
    try {
      const activeSessions = await sessionManager.getActiveSessions();
      setSessions(activeSessions);
      applyFilters(activeSessions, searchTerm, typeFilter);
    } catch (error) {
      console.error('Erro ao carregar sessões:', error);
      toast({
        title: 'Erro ao carregar sessões',
        description: 'Não foi possível carregar as sessões ativas',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
    
    // Real-time subscription for active_sessions changes
    const channel = supabase
      .channel('sessions-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'active_sessions'
        },
        () => {
          // Reload sessions on any change
          loadSessions();
        }
      )
      .subscribe((status) => {
        setIsRealtimeConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    applyFilters(sessions, searchTerm, typeFilter);
  }, [searchTerm, typeFilter, sessions]);

  const applyFilters = (sessionsList: ActiveSession[], search: string, type: string) => {
    let filtered = sessionsList;

    if (type !== 'all') {
      filtered = filtered.filter(s => s.user_type === type);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(s => 
        s.user_name?.toLowerCase().includes(searchLower) ||
        s.user_email?.toLowerCase().includes(searchLower) ||
        s.ip_address?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredSessions(filtered);
  };

  const handleForceLogout = async (session: ActiveSession) => {
    try {
      const success = await sessionManager.forceLogoutSession(session.id);

      if (!success) {
        throw new Error('Falha ao encerrar sessão');
      }
      
      toast({
        title: 'Sessão encerrada com sucesso',
        description: `A sessão de ${session.user_email || session.user_name} foi encerrada`,
      });
      loadSessions();
    } catch (error) {
      console.error('Erro ao forçar logout:', error);
      toast({
        title: 'Erro ao encerrar sessão',
        description: 'Ocorreu um erro ao tentar encerrar a sessão',
        variant: 'destructive',
      });
    } finally {
      setSessionToDelete(null);
    }
  };

  const handleCleanupAllSessions = async () => {
    setCleaningAll(true);
    try {
      localStorage.removeItem('sessions');
      toast({
        title: 'Todas as sessões limpas',
        description: 'Todas as sessões locais foram removidas',
      });
      await loadSessions();
    } catch (error) {
      console.error('Erro ao limpar sessões:', error);
      toast({
        title: 'Erro ao limpar sessões',
        description: 'Não foi possível limpar as sessões',
        variant: 'destructive',
      });
    } finally {
      setCleaningAll(false);
    }
  };

  const handleCleanupMySessions = async () => {
    setCleaningMy(true);
    try {
      localStorage.removeItem('sessions');
      await supabase.auth.signOut();
      toast({
        title: 'Suas sessões foram limpas',
        description: 'Recarregue a página e faça login novamente',
        duration: 5000,
      });
      setTimeout(() => {
        window.location.href = '/auth';
      }, 2000);
    } catch (error) {
      console.error('Erro ao limpar minhas sessões:', error);
      toast({
        title: 'Erro ao limpar sessões',
        description: 'Não foi possível limpar suas sessões',
        variant: 'destructive',
      });
      setCleaningMy(false);
    }
  };

  const getUserTypeBadge = (userType: string) => {
    const types: Record<string, { 
      label: string; 
      className: string;
      icon: React.ReactNode;
    }> = {
      admin: { 
        label: 'Administrador', 
        className: 'bg-red-100 text-red-800 border-red-200',
        icon: <Monitor className="h-3 w-3" />
      },
      barber: { 
        label: 'Barbeiro', 
        className: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: <Users className="h-3 w-3" />
      },
      client: { 
        label: 'Cliente', 
        className: 'bg-green-100 text-green-800 border-green-200',
        icon: <Users className="h-3 w-3" />
      },
      painel_cliente: { 
        label: 'Painel Cliente', 
        className: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        icon: <Users className="h-3 w-3" />
      },
      totem: { 
        label: 'Totem', 
        className: 'bg-purple-100 text-purple-800 border-purple-200',
        icon: <Smartphone className="h-3 w-3" />
      },
    };
    
    const type = types[userType] || { 
      label: userType, 
      className: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: <Users className="h-3 w-3" />
    };
    
    return (
      <Badge className={`${type.className} border flex items-center gap-1 text-[11px]`}>
        {type.icon}
        {type.label}
      </Badge>
    );
  };

  const getTimeSince = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Agora mesmo';
    if (diffMins < 60) return `${diffMins} min atrás`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h atrás`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d atrás`;
  };

  const getActivityStatus = (lastActivity: string) => {
    const diffMins = Math.floor((new Date().getTime() - new Date(lastActivity).getTime()) / 60000);
    
    if (diffMins < 2) {
      return { 
        icon: <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span></span>,
        label: 'Online agora', 
        color: 'text-green-600',
        bg: 'bg-green-50 border-green-200'
      };
    } else if (diffMins < 10) {
      return { 
        icon: <CheckCircle className="h-4 w-4 text-blue-500" />, 
        label: 'Ativo recentemente', 
        color: 'text-blue-600',
        bg: 'bg-blue-50 border-blue-200'
      };
    } else if (diffMins < 30) {
      return { 
        icon: <AlertCircle className="h-4 w-4 text-yellow-500" />, 
        label: 'Inativo', 
        color: 'text-yellow-600',
        bg: 'bg-yellow-50 border-yellow-200'
      };
    } else {
      return { 
        icon: <XCircle className="h-4 w-4 text-red-500" />, 
        label: 'Muito inativo', 
        color: 'text-red-600',
        bg: 'bg-red-50 border-red-200'
      };
    }
  };

  const stats = {
    total: sessions.length,
    online: sessions.filter(s => {
      const diffMins = Math.floor((new Date().getTime() - new Date(s.last_activity_at).getTime()) / 60000);
      return diffMins < 2;
    }).length,
    admin: sessions.filter(s => s.user_type === 'admin').length,
    barber: sessions.filter(s => s.user_type === 'barber').length,
    client: sessions.filter(s => ['client', 'painel_cliente'].includes(s.user_type)).length,
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Sessões Ativas</h2>
              {isRealtimeConnected && (
                <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 animate-pulse text-[11px]">
                  <Radio className="h-3 w-3 mr-1" />
                  Tempo Real
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Monitore quem está logado e gerencie sessões em tempo real
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button 
            onClick={handleCleanupMySessions} 
            disabled={cleaningMy}
            variant="outline"
            size="sm"
          >
            <AlertCircle className={`mr-2 h-4 w-4 ${cleaningMy ? 'animate-spin' : ''}`} />
            Limpar Minhas
          </Button>
          <Button 
            onClick={handleCleanupAllSessions} 
            disabled={cleaningAll}
            variant="destructive"
            size="sm"
          >
            <XCircle className={`mr-2 h-4 w-4 ${cleaningAll ? 'animate-spin' : ''}`} />
            Limpar Todas
          </Button>
          <Button onClick={loadSessions} disabled={loading} size="sm">
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-5">
        {[
          { label: 'Total Ativas', value: stats.total, icon: Users, bg: 'bg-slate-50 border-slate-200', text: 'text-slate-700' },
          { label: 'Online Agora', value: stats.online, icon: Radio, bg: 'bg-green-50 border-green-200', text: 'text-green-700' },
          { label: 'Admins', value: stats.admin, icon: Monitor, bg: 'bg-red-50 border-red-200', text: 'text-red-700' },
          { label: 'Barbeiros', value: stats.barber, icon: Users, bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700' },
          { label: 'Clientes', value: stats.client, icon: Users, bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className={`${stat.bg} border`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-3 px-4">
                <CardTitle className={`text-xs font-medium ${stat.text}`}>{stat.label}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.text}`} />
              </CardHeader>
              <CardContent className="px-4 pb-3">
                <div className={`text-2xl font-bold ${stat.text}`}>{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email ou IP..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
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
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            Sessões ({filteredSessions.length})
          </CardTitle>
          <CardDescription>
            Usuários conectados ao sistema — atualização em tempo real
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm || typeFilter !== 'all' 
                  ? 'Nenhuma sessão encontrada com os filtros aplicados'
                  : 'Nenhuma sessão ativa no momento'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredSessions.map((session) => {
                const status = getActivityStatus(session.last_activity_at);
                const loginDate = new Date(session.login_at);
                
                return (
                  <div 
                    key={session.id}
                    className={`rounded-lg border ${status.bg} p-4`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* Status indicator */}
                        <div className="mt-1 flex-shrink-0">
                          {status.icon}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          {/* Name + type */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-gray-900 truncate">
                              {session.user_name || 'Usuário desconhecido'}
                            </span>
                            {getUserTypeBadge(session.user_type)}
                            <span className={`text-xs font-medium ${status.color}`}>
                              {status.label}
                            </span>
                          </div>
                          
                          {/* Email */}
                          <p className="text-sm text-gray-600 truncate mt-0.5">
                            {session.user_email || '—'}
                          </p>
                          
                          {/* Details row */}
                          <div className="flex items-center gap-4 mt-1.5 flex-wrap text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Login: {format(loginDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </span>
                            <span className="flex items-center gap-1">
                              <RefreshCw className="h-3 w-3" />
                              Última atividade: {getTimeSince(session.last_activity_at)}
                            </span>
                            {session.ip_address && (
                              <span className="flex items-center gap-1">
                                <Globe className="h-3 w-3" />
                                {session.ip_address}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSessionToDelete(session)}
                        className="text-red-600 border-red-200 flex-shrink-0"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Encerrar
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de confirmação */}
      <AlertDialog open={!!sessionToDelete} onOpenChange={() => setSessionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Encerrar Sessão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja encerrar a sessão de{' '}
              <strong>{sessionToDelete?.user_name || sessionToDelete?.user_email}</strong>?
              O usuário será desconectado imediatamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => sessionToDelete && handleForceLogout(sessionToDelete)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Encerrar Sessão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SessionsManagement;
