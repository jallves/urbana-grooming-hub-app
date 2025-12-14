import { useState, useEffect } from 'react';
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
  AlertTriangle
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

interface SecurityLog {
  id: string;
  admin_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  details: Record<string, any> | null;
  ip_address: string | null;
  created_at: string;
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
  cancel: AlertTriangle,
};

const actionColors: Record<string, string> = {
  view: 'bg-blue-100 text-blue-800',
  create: 'bg-green-100 text-green-800',
  update: 'bg-amber-100 text-amber-800',
  delete: 'bg-red-100 text-red-800',
  login: 'bg-purple-100 text-purple-800',
  logout: 'bg-gray-100 text-gray-800',
  cancel: 'bg-orange-100 text-orange-800',
};

const entityLabels: Record<string, string> = {
  client: 'Cliente',
  appointment: 'Agendamento',
  barber: 'Barbeiro',
  service: 'Serviço',
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
  grant: 'Concedeu acesso',
  revoke: 'Revogou acesso',
};

export const SecurityLogViewer = () => {
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEntity, setFilterEntity] = useState<string>('all');
  const { toast } = useToast();

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('admin_activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;

      // Buscar emails dos admins
      const adminIds = [...new Set((data || []).map(log => log.admin_id).filter(Boolean))];
      
      let adminEmails: Record<string, string> = {};
      if (adminIds.length > 0) {
        const { data: admins } = await supabase
          .from('admin_users')
          .select('user_id, email')
          .in('user_id', adminIds);
        
        if (admins) {
          adminEmails = admins.reduce((acc, admin) => {
            if (admin.user_id) acc[admin.user_id] = admin.email;
            return acc;
          }, {} as Record<string, string>);
        }
      }

      const logsWithEmail = (data || []).map(log => ({
        ...log,
        admin_email: log.admin_id ? adminEmails[log.admin_id] : 'Sistema',
        details: log.details as Record<string, any> | null,
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
  };

  const cleanupOldLogs = async () => {
    try {
      const { error } = await supabase.rpc('cleanup_old_security_logs');
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
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.admin_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity_id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesEntity = filterEntity === 'all' || log.entity === filterEntity;
    
    return matchesSearch && matchesEntity;
  });

  const uniqueEntities = [...new Set(logs.map(log => log.entity))];

  const getActionIcon = (action: string) => {
    const Icon = actionIcons[action] || Activity;
    return <Icon className="h-4 w-4" />;
  };

  const getActionBadgeClass = (action: string) => {
    return actionColors[action] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-l-4 border-l-indigo-500">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Shield className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <CardTitle className="text-xl">Log de Segurança</CardTitle>
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

      {/* Filtros */}
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
                <option key={entity} value={entity}>
                  {entityLabels[entity] || entity}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-blue-700">
                  {logs.filter(l => l.action === 'view').length}
                </p>
                <p className="text-xs text-blue-600">Visualizações</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-700">
                  {logs.filter(l => l.action === 'create').length}
                </p>
                <p className="text-xs text-green-600">Criações</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-amber-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-amber-600" />
              <div>
                <p className="text-2xl font-bold text-amber-700">
                  {logs.filter(l => l.action === 'update').length}
                </p>
                <p className="text-xs text-amber-600">Atualizações</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-2xl font-bold text-red-700">
                  {logs.filter(l => l.action === 'delete' || l.action === 'cancel').length}
                </p>
                <p className="text-xs text-red-600">Exclusões/Cancelamentos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Logs */}
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
                          {entityLabels[log.entity] || log.entity}
                        </Badge>
                        {log.entity_id && (
                          <span className="text-xs text-muted-foreground font-mono">
                            ID: {log.entity_id.slice(0, 8)}...
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {log.admin_email || 'Desconhecido'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(parseISO(log.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      
                      {log.details && Object.keys(log.details).length > 0 && (
                        <details className="mt-2">
                          <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                            Ver detalhes
                          </summary>
                          <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-32">
                            {JSON.stringify(log.details, null, 2)}
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

      {/* Informação sobre retenção */}
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">Política de Retenção</p>
              <p className="text-sm text-amber-700">
                Os logs de segurança são mantidos por 30 dias. Após esse período, são automaticamente 
                removidos para otimizar o armazenamento do banco de dados.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
