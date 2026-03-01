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
  Radio,
  Clock,
  ArrowRight,
  ChevronDown,
  ChevronUp
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
  view: 'bg-blue-100 text-blue-800 border-blue-200',
  create: 'bg-green-100 text-green-800 border-green-200',
  update: 'bg-amber-100 text-amber-800 border-amber-200',
  delete: 'bg-red-100 text-red-800 border-red-200',
  login: 'bg-purple-100 text-purple-800 border-purple-200',
  logout: 'bg-gray-100 text-gray-800 border-gray-200',
  cancel: 'bg-orange-100 text-orange-800 border-orange-200',
  complete: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  absent: 'bg-slate-100 text-slate-800 border-slate-200',
};

const actionBgColors: Record<string, string> = {
  view: 'bg-blue-50 border-l-blue-400',
  create: 'bg-green-50 border-l-green-400',
  update: 'bg-amber-50 border-l-amber-400',
  delete: 'bg-red-50 border-l-red-400',
  login: 'bg-purple-50 border-l-purple-400',
  logout: 'bg-gray-50 border-l-gray-400',
  cancel: 'bg-orange-50 border-l-orange-400',
  complete: 'bg-emerald-50 border-l-emerald-400',
  absent: 'bg-slate-50 border-l-slate-400',
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

const formatDataValue = (key: string, value: any): string => {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const friendlyFieldName = (key: string): string => {
  const map: Record<string, string> = {
    nome: 'Nome', name: 'Nome', email: 'Email', telefone: 'Telefone', phone: 'Telefone',
    status: 'Status', preco: 'Preço', price: 'Preço', valor: 'Valor', amount: 'Valor',
    descricao: 'Descrição', description: 'Descrição', categoria: 'Categoria', category: 'Categoria',
    data: 'Data', date: 'Data', hora: 'Hora', time: 'Hora', ativo: 'Ativo', is_active: 'Ativo',
    user_email: 'Email', user_type: 'Tipo', forced: 'Forçado', sessions_closed: 'Sessões fechadas',
    _user_email: 'Email do usuário', forma_pagamento: 'Forma Pagamento', fornecedor: 'Fornecedor',
    observacoes: 'Observações', data_vencimento: 'Vencimento', data_pagamento: 'Data Pagamento',
    barbeiro_id: 'Barbeiro', cliente_id: 'Cliente', servico_id: 'Serviço',
    exibir_home: 'Visível na Home', duracao: 'Duração', commission_rate: 'Taxa Comissão',
    role: 'Cargo', barber_name: 'Barbeiro',
  };
  return map[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export const SecurityLogViewer = () => {
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEntity, setFilterEntity] = useState<string>('all');
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const toggleExpand = (logId: string) => {
    setExpandedLogs(prev => {
      const next = new Set(prev);
      if (next.has(logId)) next.delete(logId);
      else next.add(logId);
      return next;
    });
  };

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
        admin_email: log.admin_id ? adminInfo[log.admin_id]?.email : 'sistema',
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
          let adminEmail = 'sistema';
          if (payload.new.admin_id) {
            const { data: admin } = await supabase
              .from('admin_users')
              .select('name, email')
              .eq('id', payload.new.admin_id)
              .single();
            
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
      log.admin_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
    return actionColors[action] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const buildDescription = (log: SecurityLog): string => {
    const who = log.admin_name || log.admin_email || 'Sistema';
    const action = actionLabels[log.action] || log.action;
    const entity = entityLabels[log.entity_type || ''] || log.entity_type || 'item';
    
    // Try to extract a meaningful name from new_data or old_data
    const data = log.new_data || log.old_data;
    let targetName = '';
    if (data) {
      targetName = data.nome || data.name || data.user_email || data.email || data.descricao || data.description || '';
      if (typeof targetName === 'string' && targetName.length > 40) {
        targetName = targetName.substring(0, 40) + '...';
      }
    }

    if (targetName) {
      return `${who} ${action.toLowerCase()} ${entity.toLowerCase()}: "${targetName}"`;
    }
    return `${who} ${action.toLowerCase()} ${entity.toLowerCase()}`;
  };

  const renderChanges = (log: SecurityLog) => {
    const { old_data, new_data } = log;
    if (!new_data && !old_data) return null;

    // For create/delete, show the data
    if (log.action === 'create' || log.action === 'login' || log.action === 'logout') {
      const data = new_data || old_data;
      if (!data) return null;
      const entries = Object.entries(data).filter(([k]) => 
        !k.startsWith('_') && !['id', 'created_at', 'updated_at'].includes(k)
      );
      if (entries.length === 0) return null;

      return (
        <div className="mt-2 space-y-1">
          {entries.slice(0, 6).map(([key, value]) => (
            <div key={key} className="flex items-center gap-2 text-xs">
              <span className="font-medium text-gray-600 min-w-[100px]">{friendlyFieldName(key)}:</span>
              <span className="text-gray-800">{formatDataValue(key, value)}</span>
            </div>
          ))}
          {entries.length > 6 && (
            <span className="text-xs text-gray-400">+{entries.length - 6} campos</span>
          )}
        </div>
      );
    }

    // For updates, show before/after
    if (log.action === 'update' && old_data && new_data) {
      const changedKeys = Object.keys(new_data).filter(key => {
        if (key.startsWith('_') || ['id', 'created_at', 'updated_at'].includes(key)) return false;
        return JSON.stringify(old_data[key]) !== JSON.stringify(new_data[key]);
      });

      if (changedKeys.length === 0) {
        // Show new_data if no diff can be computed
        const entries = Object.entries(new_data).filter(([k]) => 
          !k.startsWith('_') && !['id', 'created_at', 'updated_at'].includes(k)
        );
        return (
          <div className="mt-2 space-y-1">
            {entries.slice(0, 6).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2 text-xs">
                <span className="font-medium text-gray-600 min-w-[100px]">{friendlyFieldName(key)}:</span>
                <span className="text-gray-800">{formatDataValue(key, value)}</span>
              </div>
            ))}
          </div>
        );
      }

      return (
        <div className="mt-2 space-y-1.5">
          {changedKeys.slice(0, 6).map(key => (
            <div key={key} className="flex items-center gap-2 text-xs flex-wrap">
              <span className="font-medium text-gray-600 min-w-[100px]">{friendlyFieldName(key)}:</span>
              <span className="text-red-600 line-through">{formatDataValue(key, old_data[key])}</span>
              <ArrowRight className="h-3 w-3 text-gray-400 flex-shrink-0" />
              <span className="text-green-700 font-medium">{formatDataValue(key, new_data[key])}</span>
            </div>
          ))}
          {changedKeys.length > 6 && (
            <span className="text-xs text-gray-400">+{changedKeys.length - 6} alterações</span>
          )}
        </div>
      );
    }

    // For delete, show old_data
    if (log.action === 'delete' && old_data) {
      const entries = Object.entries(old_data).filter(([k]) => 
        !k.startsWith('_') && !['id', 'created_at', 'updated_at'].includes(k)
      );
      return (
        <div className="mt-2 space-y-1">
          <span className="text-xs text-red-600 font-medium">Dados removidos:</span>
          {entries.slice(0, 4).map(([key, value]) => (
            <div key={key} className="flex items-center gap-2 text-xs">
              <span className="font-medium text-gray-600 min-w-[100px]">{friendlyFieldName(key)}:</span>
              <span className="text-gray-800">{formatDataValue(key, value)}</span>
            </div>
          ))}
        </div>
      );
    }

    // Fallback
    if (new_data) {
      const entries = Object.entries(new_data).filter(([k]) => 
        !k.startsWith('_') && !['id', 'created_at', 'updated_at'].includes(k)
      );
      if (entries.length === 0) return null;
      return (
        <div className="mt-2 space-y-1">
          {entries.slice(0, 6).map(([key, value]) => (
            <div key={key} className="flex items-center gap-2 text-xs">
              <span className="font-medium text-gray-600 min-w-[100px]">{friendlyFieldName(key)}:</span>
              <span className="text-gray-800">{formatDataValue(key, value)}</span>
            </div>
          ))}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-6">
      <Card className="border-l-4 border-l-indigo-500">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Shield className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-xl">Log de Segurança</CardTitle>
                  {isRealtimeConnected && (
                    <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 animate-pulse">
                      <Radio className="h-3 w-3 mr-1" />
                      Tempo Real
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Registro detalhado de todas as ações administrativas (últimos 30 dias)
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={cleanupOldLogs}
                className="text-red-600"
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
                  placeholder="Buscar por nome, email, ação, entidade..."
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

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { action: 'view', label: 'Visualizações', icon: Eye, bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', count: 'text-blue-800' },
          { action: 'create', label: 'Criações', icon: Plus, bg: 'bg-green-50 border-green-200', text: 'text-green-700', count: 'text-green-800' },
          { action: 'update', label: 'Atualizações', icon: Edit, bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', count: 'text-amber-800' },
          { action: 'delete', label: 'Exclusões', icon: Trash2, bg: 'bg-red-50 border-red-200', text: 'text-red-700', count: 'text-red-800' },
          { action: 'login', label: 'Logins', icon: LogOut, bg: 'bg-purple-50 border-purple-200', text: 'text-purple-700', count: 'text-purple-800' },
        ].map(stat => {
          const Icon = stat.icon;
          const logCount = stat.action === 'login' 
            ? logs.filter(l => l.action === 'login' || l.action === 'logout').length
            : logs.filter(l => l.action === stat.action).length;
          return (
            <Card key={stat.action} className={`${stat.bg} border`}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Icon className={`h-5 w-5 ${stat.text}`} />
                  <div>
                    <p className={`text-2xl font-bold ${stat.count}`}>{logCount}</p>
                    <p className={`text-xs ${stat.text}`}>{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Log List */}
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
          <ScrollArea className="h-[600px] pr-4">
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
              <div className="space-y-2">
                {filteredLogs.map((log) => {
                  const isExpanded = expandedLogs.has(log.id);
                  const hasDetails = log.new_data || log.old_data;
                  const bgClass = actionBgColors[log.action] || 'bg-gray-50 border-l-gray-400';

                  return (
                    <div 
                      key={log.id} 
                      className={`rounded-lg border border-l-4 ${bgClass} p-4 cursor-pointer`}
                      onClick={() => hasDetails && toggleExpand(log.id)}
                    >
                      {/* Main row */}
                      <div className="flex items-start gap-3">
                        <div className={`p-1.5 rounded-full border ${getActionBadgeClass(log.action)} flex-shrink-0 mt-0.5`}>
                          {getActionIcon(log.action)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          {/* Description */}
                          <p className="text-sm font-medium text-gray-900 leading-snug">
                            {buildDescription(log)}
                          </p>
                          
                          {/* Meta row */}
                          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                            <Badge className={`${getActionBadgeClass(log.action)} border text-[11px] px-1.5 py-0`}>
                              {actionLabels[log.action] || log.action}
                            </Badge>
                            <Badge variant="outline" className="text-[11px] px-1.5 py-0">
                              {entityLabels[log.entity_type || ''] || log.entity_type}
                            </Badge>
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                              <User className="h-3 w-3" />
                              {log.admin_name || log.admin_email || 'Sistema'}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                              <Clock className="h-3 w-3" />
                              {format(parseISO(log.created_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                            </span>
                            {log.entity_id && (
                              <span className="text-[10px] text-gray-400 font-mono">
                                #{log.entity_id.slice(0, 8)}
                              </span>
                            )}
                          </div>

                          {/* Expanded details */}
                          {isExpanded && hasDetails && (
                            <div className="mt-3 p-3 bg-white/80 rounded-md border border-gray-200">
                              {renderChanges(log)}
                            </div>
                          )}
                        </div>

                        {/* Expand toggle */}
                        {hasDetails && (
                          <div className="flex-shrink-0 mt-1">
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-gray-400" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityLogViewer;
