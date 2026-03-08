import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity, User, Clock, ArrowRight, ChevronDown, ChevronUp, RefreshCw, Shield } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  SecurityLog,
  actionIcons,
  actionColors,
  actionBgColors,
  actionLabels,
  entityLabels,
  friendlyFieldName,
  formatDataValue,
  getLogSeverity,
  severityConfig,
} from './securityLogTypes';

interface Props {
  logs: SecurityLog[];
  loading: boolean;
}

const SecurityLogList: React.FC<Props> = ({ logs, loading }) => {
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());

  const toggleExpand = (logId: string) => {
    setExpandedLogs(prev => {
      const next = new Set(prev);
      if (next.has(logId)) next.delete(logId);
      else next.add(logId);
      return next;
    });
  };

  // Group logs by date
  const groupedLogs = useMemo(() => {
    const groups = new Map<string, SecurityLog[]>();
    logs.forEach(log => {
      const dateKey = log.created_at ? format(parseISO(log.created_at), 'yyyy-MM-dd') : 'sem-data';
      if (!groups.has(dateKey)) groups.set(dateKey, []);
      groups.get(dateKey)!.push(log);
    });
    return groups;
  }, [logs]);

  const buildDescription = (log: SecurityLog): string => {
    const who = log.admin_name || log.admin_email || 'Sistema';
    const action = actionLabels[log.action] || log.action;
    const entity = entityLabels[log.entity_type || ''] || log.entity_type || 'item';
    const data = log.new_data || log.old_data;
    let targetName = '';
    if (data) {
      targetName = data.nome || data.name || data.user_email || data.email || data.descricao || data.description || '';
      if (typeof targetName === 'string' && targetName.length > 40) targetName = targetName.substring(0, 40) + '...';
    }
    return targetName
      ? `${who} ${action.toLowerCase()} ${entity.toLowerCase()}: "${targetName}"`
      : `${who} ${action.toLowerCase()} ${entity.toLowerCase()}`;
  };

  const renderChanges = (log: SecurityLog) => {
    const { old_data, new_data } = log;
    if (!new_data && !old_data) return null;

    if (log.action === 'create' || log.action === 'login' || log.action === 'logout') {
      const data = new_data || old_data;
      if (!data) return null;
      const entries = Object.entries(data).filter(([k]) => !k.startsWith('_') && !['id', 'created_at', 'updated_at'].includes(k));
      if (entries.length === 0) return null;
      return (
        <div className="mt-2 space-y-1">
          {entries.slice(0, 8).map(([key, value]) => (
            <div key={key} className="flex items-center gap-2 text-xs">
              <span className="font-medium text-gray-500 min-w-[100px]">{friendlyFieldName(key)}:</span>
              <span className="text-gray-800">{formatDataValue(key, value)}</span>
            </div>
          ))}
          {entries.length > 8 && <span className="text-xs text-gray-400">+{entries.length - 8} campos</span>}
        </div>
      );
    }

    if (log.action === 'update' && old_data && new_data) {
      const changedKeys = Object.keys(new_data).filter(key => {
        if (key.startsWith('_') || ['id', 'created_at', 'updated_at'].includes(key)) return false;
        return JSON.stringify(old_data[key]) !== JSON.stringify(new_data[key]);
      });

      if (changedKeys.length === 0) {
        const entries = Object.entries(new_data).filter(([k]) => !k.startsWith('_') && !['id', 'created_at', 'updated_at'].includes(k));
        return (
          <div className="mt-2 space-y-1">
            {entries.slice(0, 6).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2 text-xs">
                <span className="font-medium text-gray-500 min-w-[100px]">{friendlyFieldName(key)}:</span>
                <span className="text-gray-800">{formatDataValue(key, value)}</span>
              </div>
            ))}
          </div>
        );
      }

      return (
        <div className="mt-2 space-y-1.5">
          {changedKeys.slice(0, 8).map(key => (
            <div key={key} className="flex items-center gap-2 text-xs flex-wrap">
              <span className="font-medium text-gray-500 min-w-[100px]">{friendlyFieldName(key)}:</span>
              <span className="text-red-600 line-through bg-red-50 px-1 rounded">{formatDataValue(key, old_data[key])}</span>
              <ArrowRight className="h-3 w-3 text-gray-400 flex-shrink-0" />
              <span className="text-green-700 font-medium bg-green-50 px-1 rounded">{formatDataValue(key, new_data[key])}</span>
            </div>
          ))}
          {changedKeys.length > 8 && <span className="text-xs text-gray-400">+{changedKeys.length - 8} alterações</span>}
        </div>
      );
    }

    if (log.action === 'delete' && old_data) {
      const entries = Object.entries(old_data).filter(([k]) => !k.startsWith('_') && !['id', 'created_at', 'updated_at'].includes(k));
      return (
        <div className="mt-2 space-y-1">
          <span className="text-xs text-red-600 font-medium">Dados removidos:</span>
          {entries.slice(0, 6).map(([key, value]) => (
            <div key={key} className="flex items-center gap-2 text-xs">
              <span className="font-medium text-gray-500 min-w-[100px]">{friendlyFieldName(key)}:</span>
              <span className="text-gray-800">{formatDataValue(key, value)}</span>
            </div>
          ))}
        </div>
      );
    }

    if (new_data) {
      const entries = Object.entries(new_data).filter(([k]) => !k.startsWith('_') && !['id', 'created_at', 'updated_at'].includes(k));
      if (entries.length === 0) return null;
      return (
        <div className="mt-2 space-y-1">
          {entries.slice(0, 6).map(([key, value]) => (
            <div key={key} className="flex items-center gap-2 text-xs">
              <span className="font-medium text-gray-500 min-w-[100px]">{friendlyFieldName(key)}:</span>
              <span className="text-gray-800">{formatDataValue(key, value)}</span>
            </div>
          ))}
        </div>
      );
    }

    return null;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Activity className="h-4 w-4 text-indigo-600" />
          Registro de Atividades
          <Badge variant="secondary" className="ml-2 text-[10px]">
            {logs.length} registros
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum log encontrado</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Array.from(groupedLogs.entries()).map(([dateKey, dayLogs]) => (
                <div key={dateKey}>
                  {/* Day separator */}
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-px flex-1 bg-gray-200" />
                    <span className="text-xs font-semibold text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
                      {dateKey !== 'sem-data' ? format(parseISO(dateKey), "EEEE, dd 'de' MMMM", { locale: ptBR }) : 'Sem data'}
                    </span>
                    <Badge variant="outline" className="text-[10px]">{dayLogs.length}</Badge>
                    <div className="h-px flex-1 bg-gray-200" />
                  </div>

                  <div className="space-y-1.5">
                    {dayLogs.map(log => {
                      const isExpanded = expandedLogs.has(log.id);
                      const hasDetails = log.new_data || log.old_data;
                      const bgClass = actionBgColors[log.action] || 'bg-gray-50 border-l-gray-400';
                      const severity = getLogSeverity(log);
                      const ActionIcon = actionIcons[log.action] || Activity;

                      return (
                        <div
                          key={log.id}
                          className={`rounded-lg border border-l-4 ${bgClass} p-3 cursor-pointer transition-all hover:shadow-sm`}
                          onClick={() => hasDetails && toggleExpand(log.id)}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-1.5 rounded-full border ${actionColors[log.action] || 'bg-gray-100 text-gray-800 border-gray-200'} flex-shrink-0 mt-0.5`}>
                              <ActionIcon className="h-3.5 w-3.5" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 leading-snug">
                                {buildDescription(log)}
                              </p>

                              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                <Badge className={`${actionColors[log.action] || 'bg-gray-100 text-gray-800'} border text-[10px] px-1.5 py-0`}>
                                  {actionLabels[log.action] || log.action}
                                </Badge>
                                {severity !== 'info' && (
                                  <Badge className={`${severityConfig[severity].bg} border text-[10px] px-1.5 py-0 ${severityConfig[severity].color}`}>
                                    {severityConfig[severity].label}
                                  </Badge>
                                )}
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                  {entityLabels[log.entity_type || ''] || log.entity_type}
                                </Badge>
                                <span className="flex items-center gap-1 text-[11px] text-gray-500">
                                  <User className="h-3 w-3" />
                                  {log.admin_name || log.admin_email || 'Sistema'}
                                </span>
                                <span className="flex items-center gap-1 text-[11px] text-gray-500">
                                  <Clock className="h-3 w-3" />
                                  {format(parseISO(log.created_at), "HH:mm:ss", { locale: ptBR })}
                                </span>
                                {log.entity_id && (
                                  <span className="text-[9px] text-gray-400 font-mono">
                                    #{log.entity_id.slice(0, 8)}
                                  </span>
                                )}
                              </div>

                              {isExpanded && hasDetails && (
                                <div className="mt-3 p-3 bg-white/90 rounded-md border border-gray-200">
                                  {renderChanges(log)}
                                </div>
                              )}
                            </div>

                            {hasDetails && (
                              <div className="flex-shrink-0 mt-1">
                                {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default SecurityLogList;
