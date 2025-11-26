import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { sessionManager, ActiveSession } from '@/hooks/useSessionManager';
import { RefreshCw, LogOut, Users, Monitor, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const SessionManager: React.FC = () => {
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadSessions = async () => {
    setLoading(true);
    try {
      const activeSessions = await sessionManager.getActiveSessions();
      setSessions(activeSessions);
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
    
    return () => clearInterval(interval);
  }, []);

  const handleForceLogout = async (sessionId: string, userName: string) => {
    try {
      const success = await sessionManager.forceLogoutSession(sessionId);
      
      if (success) {
        toast({
          title: 'Sessão encerrada',
          description: `Sessão de ${userName} foi encerrada com sucesso`,
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
    }
  };

  const getUserTypeBadge = (userType: string) => {
    const types: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      admin: { label: 'Administrador', variant: 'destructive' },
      barber: { label: 'Barbeiro', variant: 'default' },
      client: { label: 'Cliente', variant: 'secondary' },
      painel_cliente: { label: 'Painel Cliente', variant: 'secondary' },
      totem: { label: 'Totem', variant: 'outline' },
    };
    
    const type = types[userType] || { label: userType, variant: 'outline' as const };
    
    return <Badge variant={type.variant}>{type.label}</Badge>;
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Controle de Sessões</h2>
          <p className="text-muted-foreground">
            Gerencie todas as sessões ativas dos usuários
          </p>
        </div>
        <Button onClick={loadSessions} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Sessões</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessions.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administradores</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sessions.filter(s => s.user_type === 'admin').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Barbeiros</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sessions.filter(s => s.user_type === 'barber').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sessions.filter(s => ['client', 'painel_cliente'].includes(s.user_type)).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sessões Ativas</CardTitle>
          <CardDescription>
            Lista de todas as sessões ativas no momento
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma sessão ativa no momento
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">
                        {session.user_name || session.user_email || 'Usuário sem nome'}
                      </span>
                      {getUserTypeBadge(session.user_type)}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {session.user_email && (
                        <span>{session.user_email}</span>
                      )}
                      
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
                      <div className="text-xs text-muted-foreground">
                        IP: {session.ip_address}
                      </div>
                    )}
                  </div>
                  
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleForceLogout(session.id, session.user_name || 'usuário')}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Encerrar
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
