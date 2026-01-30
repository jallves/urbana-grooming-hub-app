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
  XCircle
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

const SessionsManagement: React.FC = () => {
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sessionToDelete, setSessionToDelete] = useState<ActiveSession | null>(null);
  const [cleaningAll, setCleaningAll] = useState(false);
  const [cleaningMy, setCleaningMy] = useState(false);
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
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(loadSessions, 30000);
    
    return () => {
      clearInterval(interval);
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
      // Usar sessionManager para forçar logout
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
      // Clear localStorage sessions
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
      // Clear local session data
      localStorage.removeItem('sessions');
      await supabase.auth.signOut();
      
      toast({
        title: 'Suas sessões foram limpas',
        description: 'Recarregue a página e faça login novamente',
        duration: 5000,
      });
      
      // Aguardar 2 segundos e redirecionar para login
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
        <div className="flex gap-2 flex-wrap">
          <Button 
            onClick={handleCleanupMySessions} 
            disabled={cleaningMy}
            variant="outline"
            size="sm"
          >
            <AlertCircle className={`mr-2 h-4 w-4 ${cleaningMy ? 'animate-spin' : ''}`} />
            Limpar Minhas Sessões
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

      {/* Help Card */}
      <Card className="border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/20">
        <CardHeader>
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div className="flex-1">
              <CardTitle className="text-base text-yellow-900 dark:text-yellow-100">
                Como resolver sessões presas ou problemas de cache
              </CardTitle>
              <CardDescription className="mt-2 text-yellow-800 dark:text-yellow-200">
                Se você está com problemas de sessão presa (banner ou galeria não carregam), use uma das opções:
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-yellow-900 dark:text-yellow-100">
          <div className="flex items-start gap-2">
            <span className="font-semibold min-w-[120px]">Opção 1:</span>
            <span>Clique em <strong>"Limpar Minhas Sessões"</strong> (recomendado) - Limpa suas sessões e te redireciona para login</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-semibold min-w-[120px]">Opção 2:</span>
            <span>Clique em <strong>"Limpar Todas"</strong> - Remove todas as sessões ativas (use com cuidado)</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-semibold min-w-[120px]">Opção 3:</span>
            <span>Abra o console do navegador (F12) e digite: <code className="bg-yellow-100 dark:bg-yellow-900 px-2 py-1 rounded">window.clearAuthCache()</code></span>
          </div>
        </CardContent>
      </Card>

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
            <div className="space-y-3">
              {filteredSessions.map((session) => {
                const status = getActivityStatus(session.last_activity_at);
                
                return (
                  <div 
                    key={session.id}
                    className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg gap-4"
                  >
                    <div className="flex items-start gap-4">
                      {status.icon}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium truncate">
                            {session.user_name || session.user_email || 'Usuário desconhecido'}
                          </span>
                          {getUserTypeBadge(session.user_type)}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {session.user_email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Última atividade: {getTimeSince(session.last_activity_at)}
                        </p>
                      </div>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSessionToDelete(session)}
                      className="text-destructive hover:text-destructive"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Encerrar
                    </Button>
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
