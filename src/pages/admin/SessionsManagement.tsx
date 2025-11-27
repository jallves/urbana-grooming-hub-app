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
  Calendar, 
  Clock, 
  Search,
  Filter,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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

const SessionsManagement: React.FC = () => {
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sessionToDelete, setSessionToDelete] = useState<ActiveSession | null>(null);
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
    
    // Configurar Realtime para atualizar automaticamente
    const channel = supabase
      .channel('sessions-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_sessions',
        },
        () => {
          console.log('🔄 Sessão atualizada - recarregando...');
          loadSessions();
        }
      )
      .subscribe();

    // Atualizar também a cada 30 segundos
    const interval = setInterval(loadSessions, 30000);
    
    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    applyFilters(sessions, searchTerm, typeFilter);
  }, [searchTerm, typeFilter, sessions]);

  const applyFilters = (sessionsList: ActiveSession[], search: string, type: string) => {
    let filtered = sessionsList;

    // Filtrar por tipo
    if (type !== 'all') {
      filtered = filtered.filter(s => s.user_type === type);
    }

    // Filtrar por busca
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
      // Chamar função do banco de dados
      const { data, error } = await supabase.rpc('force_user_logout', {
        p_user_id: session.user_id,
        p_reason: 'Logout forçado pelo administrador'
      });

      if (error) throw error;
      
      const result = data as { success: boolean; user_email: string; sessions_invalidated: number; message?: string };
      
      if (result && result.success) {
        toast({
          title: 'Sessão encerrada com sucesso',
          description: `${result.sessions_invalidated} sessão(ões) de ${result.user_email} foi(ram) encerrada(s)`,
        });
        loadSessions();
      } else {
        toast({
          title: 'Erro ao encerrar sessão',
          description: 'Não foi possível encerrar a sessão',
          variant: 'destructive',
        });
      }
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

  const getUserTypeBadge = (userType: string) => {
    const types: Record<string, { 
      label: string; 
      variant: 'default' | 'secondary' | 'destructive' | 'outline';
      icon: React.ReactNode;
    }> = {
      admin: { 
        label: 'Administrador', 
        variant: 'destructive',
        icon: <Monitor className="h-3 w-3" />
      },
      barber: { 
        label: 'Barbeiro', 
        variant: 'default',
        icon: <Users className="h-3 w-3" />
      },
      client: { 
        label: 'Cliente', 
        variant: 'secondary',
        icon: <Users className="h-3 w-3" />
      },
      painel_cliente: { 
        label: 'Painel Cliente', 
        variant: 'secondary',
        icon: <Users className="h-3 w-3" />
      },
      totem: { 
        label: 'Totem', 
        variant: 'outline',
        icon: <Monitor className="h-3 w-3" />
      },
    };
    
    const type = types[userType] || { 
      label: userType, 
      variant: 'outline' as const,
      icon: <Users className="h-3 w-3" />
    };
    
    return (
      <Badge variant={type.variant} className="flex items-center gap-1">
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
        icon: <CheckCircle className="h-4 w-4 text-green-500" />, 
        label: 'Ativo Agora', 
        color: 'text-green-500' 
      };
    } else if (diffMins < 10) {
      return { 
        icon: <CheckCircle className="h-4 w-4 text-blue-500" />, 
        label: 'Ativo', 
        color: 'text-blue-500' 
      };
    } else if (diffMins < 30) {
      return { 
        icon: <AlertCircle className="h-4 w-4 text-yellow-500" />, 
        label: 'Inativo Recente', 
        color: 'text-yellow-500' 
      };
    } else {
      return { 
        icon: <XCircle className="h-4 w-4 text-red-500" />, 
        label: 'Muito Inativo', 
        color: 'text-red-500' 
      };
    }
  };

  const stats = {
    total: sessions.length,
    admin: sessions.filter(s => s.user_type === 'admin').length,
    barber: sessions.filter(s => s.user_type === 'barber').length,
    client: sessions.filter(s => ['client', 'painel_cliente'].includes(s.user_type)).length,
    totem: sessions.filter(s => s.user_type === 'totem').length,
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Gerenciamento de Sessões</h2>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Monitore e gerencie todas as sessões ativas dos usuários
          </p>
        </div>
        <Button onClick={loadSessions} disabled={loading} size="sm" className="md:size-default">
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Total</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Admins</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">{stats.admin}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Barbeiros</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">{stats.barber}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">{stats.client}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Totens</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">{stats.totem}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Filtros</CardTitle>
              <CardDescription>Filtre as sessões por tipo ou busque por usuário</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
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
        <CardHeader>
          <CardTitle>Sessões Ativas ({filteredSessions.length})</CardTitle>
          <CardDescription>
            Lista de todas as sessões ativas no momento
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
            <div className="space-y-4">
              {filteredSessions.map((session) => {
                const activityStatus = getActivityStatus(session.last_activity_at);
                
                return (
                  <div
                    key={session.id}
                    className="flex flex-col gap-4 p-4 rounded-lg border bg-card md:flex-row md:items-center md:justify-between"
                  >
                      <div className="space-y-3 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-sm md:text-base">
                            {session.user_name || session.user_email || 'Usuário sem nome'}
                          </span>
                          {getUserTypeBadge(session.user_type)}
                          <div className={`flex items-center gap-1 ${activityStatus.color}`}>
                            {activityStatus.icon}
                            <span className="text-xs font-medium">{activityStatus.label}</span>
                          </div>
                        </div>
                      
                      <div className="grid gap-2 text-xs md:text-sm text-muted-foreground">
                        {session.user_email && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Email:</span>
                            <span>{session.user_email}</span>
                          </div>
                        )}
                        
                        <div className="flex flex-wrap items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>
                              Login: {format(new Date(session.login_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>
                              Atividade: {getTimeSince(session.last_activity_at)}
                            </span>
                          </div>
                        </div>
                        
                        {session.ip_address && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium">IP:</span>
                            <span className="font-mono">{session.ip_address}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setSessionToDelete(session)}
                      className="w-full md:w-auto"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Encerrar Sessão
                    </Button>
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
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a encerrar a sessão de{' '}
              <strong>{sessionToDelete?.user_name || sessionToDelete?.user_email}</strong>.
              <br /><br />
              O usuário será desconectado imediatamente e precisará fazer login novamente.
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => sessionToDelete && handleForceLogout(sessionToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sim, encerrar sessão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SessionsManagement;
