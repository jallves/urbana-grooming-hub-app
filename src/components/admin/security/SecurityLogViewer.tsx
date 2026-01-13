import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Shield, 
  RefreshCw, 
  Search, 
  User, 
  Calendar,
  Activity,
  Trash2,
  Eye,
  Edit,
  Plus,
  LogOut,
  Settings,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Radio
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { toast as sonnerToast } from 'sonner';

interface SecurityLog {
  id: string;
  admin_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  new_data: Record<string, any> | null;
  old_data: Record<string, any> | null;
  created_at: string;
  admin_name?: string;
  admin_email?: string;
}

const actionIcons: Record<string, typeof Eye> = {
  view: Eye,
  create: Plus,
  update: Edit,
  delete: Trash2,
  login: LogOut,
  logout: LogOut,
  settings: Settings,
  cancel: XCircle,
  complete: CheckCircle,
  absent: AlertTriangle,
};

const actionColors: Record<string, string> = {
  view: 'bg-blue-600 text-white',
  create: 'bg-green-600 text-white',
  update: 'bg-amber-500 text-white',
  delete: 'bg-red-600 text-white',
  login: 'bg-purple-600 text-white',
  logout: 'bg-gray-600 text-white',
  cancel: 'bg-orange-600 text-white',
  complete: 'bg-emerald-600 text-white',
  absent: 'bg-slate-600 text-white',
};

const entityLabels: Record<string, string> = {
  client: 'Cliente',
  appointment: 'Agendamento',
  barber: 'Barbeiro',
  service: 'Serviço',
  staff: 'Funcionário',
  product: 'Produto',
  financial: 'Financeiro',
  financial_transaction: 'Transação Financeira',
  settings: 'Configurações',
  barber_access: 'Acesso Barbeiro',
  user: 'Usuário',
  session: 'Sessão',
};

const actionLabels: Record<string, string> = {
  view: 'Visualizou',
  create: 'Criou',
  update: 'Atualizou',
  delete: 'Deletou',
  login: 'Entrou',
  logout: 'Saiu',
  cancel: 'Cancelou',
  complete: 'Concluiu',
  absent: 'Marcou Ausente',
  grant: 'Concedeu acesso',
  revoke: 'Revogou acesso',
};

export const SecurityLogViewer = () => {
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEntity, setFilterEntity] = useState<string>('all');
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const { toast } = useToast();

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data, error } = await supabase
        .from('admin_activity_log')
        .select('*')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(500);

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
        admin_email: log.admin_id ? adminInfo[log.admin_id]?.email : 'Sistema',
      }));

      setLogs(logsWithEmail);
    } catch (error) {
      console.error('Erro ao buscar logs:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os logs de segurança',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const cleanupOldLogs = async () => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { error } = await supabase
        .from('admin_activity_log')
        .delete()
        .lt('created_at', thirtyDaysAgo.toISOString());
        
      if (error) throw error;
      
      toast({
        title: 'Limpeza concluída',
        description: 'Logs com mais de 30 dias foram removidos',
      });
      
      fetchLogs();
    } catch (error) {
      console.error('Erro ao limpar logs:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível limpar os logs antigos',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchLogs();
    
    const channel = supabase
      .channel('security-logs-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'admin_activity_log'
        },
        async (payload) => {
          let adminName = 'Sistema';
          let adminEmail = 'Sistema';
          if (payload.new.admin_id) {
            const { data: admin } = await supabase
              .from('admin_users')
              .select('name, email')
              .eq('id', payload.new.admin_id)
              .single();
            
            adminName = admin?.name || 'Usuário';
            adminEmail = admin?.email || 'Usuário';
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
            admin_email: adminEmail
          };
          
          setLogs(prevLogs => [newLog, ...prevLogs.slice(0, 499)]);
          
          sonnerToast.info('🔔 Novo log registrado', {
            description: `${actionLabels[newLog.action] || newLog.action} em ${entityLabels[newLog.entity_type || ''] || newLog.entity_type}`,
            duration: 3000,
          });
        }
      )
      .subscribe((status) => {
        setIsRealtimeConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLogs]);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.admin_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.entity_type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity_id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesEntity = filterEntity === 'all' || log.entity_type === filterEntity;
    
    return matchesSearch && matchesEntity;
  });

  const uniqueEntities = [...new Set(logs.map(log => log.entity_type).filter(Boolean))];

  const getActionIcon = (action: string) => {
    const Icon = actionIcons[action] || Activity;
    return <Icon className="h-4 w-4" />;
  };

  const getActionBadgeClass = (action: string) => {
    return actionColors[action] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
  };

  return (
    <div className="space-y-6">
      <Card className="border-l-4 border-l-indigo-500">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                <Shield className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-xl">Log de Segurança</CardTitle>
                  {isRealtimeConnected && (
                    <Badge variant="outline" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-300 animate-pulse">
                      <Radio className="h-3 w-3 mr-1" />
                      Tempo Real
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Registro de todas as ações administrativas (últimos 30 dias)
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={cleanupOldLogs}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Limpar Antigos
              </Button>
              <Button variant="outline" size="sm" onClick={fetchLogs}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="pt-4">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por usuário, ação, entidade..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={filterEntity}
              onChange={(e) => setFilterEntity(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background text-sm min-w-[150px]"
            >
              <option value="all">Todas as entidades</option>
              {uniqueEntities.map(entity => (
                <option key={entity} value={entity || ''}>
                  {entityLabels[entity || ''] || entity}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-blue-600 border-blue-700">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-white" />
              <div>
                <p className="text-2xl font-bold text-white">
                  {logs.filter(l => l.action === 'view').length}
                </p>
                <p className="text-xs text-blue-100">Visualizações</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-600 border-green-700">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-white" />
              <div>
                <p className="text-2xl font-bold text-white">
                  {logs.filter(l => l.action === 'create').length}
                </p>
                <p className="text-xs text-green-100">Criações</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-amber-500 border-amber-600">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-white" />
              <div>
                <p className="text-2xl font-bold text-white">
                  {logs.filter(l => l.action === 'update').length}
                </p>
                <p className="text-xs text-amber-100">Atualizações</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-600 border-red-700">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-white" />
              <div>
                <p className="text-2xl font-bold text-white">
                  {logs.filter(l => l.action === 'delete').length}
                </p>
                <p className="text-xs text-red-100">Exclusões</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-orange-600 border-orange-700">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-white" />
              <div>
                <p className="text-2xl font-bold text-white">
                  {logs.filter(l => l.action === 'cancel' || l.action === 'complete' || l.action === 'absent').length}
                </p>
                <p className="text-xs text-orange-100">Status</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Atividades Recentes
            <Badge variant="secondary" className="ml-2">
              {filteredLogs.length} registros
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] pr-4">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum log encontrado</p>
                <p className="text-sm mt-1">As ações serão registradas automaticamente</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredLogs.map((log) => (
                  <div 
                    key={log.id} 
                    className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className={`p-2 rounded-full ${getActionBadgeClass(log.action)}`}>
                      {getActionIcon(log.action)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={getActionBadgeClass(log.action)}>
                          {actionLabels[log.action] || log.action}
                        </Badge>
                        <Badge variant="outline">
                          {entityLabels[log.entity_type || ''] || log.entity_type}
                        </Badge>
                        {log.entity_id && (
                          <span className="text-xs text-muted-foreground font-mono">
                            ID: {log.entity_id.slice(0, 8)}...
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 mt-2 text-sm flex-wrap">
                        <span className="flex items-center gap-1 font-medium text-foreground">
                          <User className="h-4 w-4 text-primary" />
                          {log.admin_name || log.admin_email || 'Desconhecido'}
                        </span>
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {format(parseISO(log.created_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                        </span>
                      </div>
                      
                      {log.new_data && Object.keys(log.new_data).length > 0 && (
                        <details className="mt-2">
                          <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                            Ver detalhes
                          </summary>
                          <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-32">
                            {JSON.stringify(log.new_data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 text-blue-700">
            <AlertTriangle className="h-5 w-5" />
            <p className="text-sm font-medium">
              Os logs são mantidos por 30 dias e depois removidos automaticamente.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityLogViewer;
