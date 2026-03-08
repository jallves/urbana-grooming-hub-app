import React from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, RefreshCw, Trash2, Radio, Download } from 'lucide-react';
import { SecurityLog } from './securityLogTypes';
import * as XLSX from 'xlsx';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { actionLabels, entityLabels } from './securityLogTypes';

interface Props {
  isRealtimeConnected: boolean;
  loading: boolean;
  onRefresh: () => void;
  onCleanup: () => void;
  logs: SecurityLog[];
}

const SecurityLogHeader: React.FC<Props> = ({ isRealtimeConnected, loading, onRefresh, onCleanup, logs }) => {

  const handleExport = () => {
    const rows = logs.map(log => ({
      'Data/Hora': log.created_at ? format(parseISO(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR }) : '',
      'Usuário': log.admin_name || log.admin_email || 'Sistema',
      'Email': log.admin_email || '',
      'Ação': actionLabels[log.action] || log.action,
      'Entidade': entityLabels[log.entity_type || ''] || log.entity_type || '',
      'ID Entidade': log.entity_id || '',
      'Dados Anteriores': log.old_data ? JSON.stringify(log.old_data) : '',
      'Dados Novos': log.new_data ? JSON.stringify(log.new_data) : '',
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Logs de Segurança');

    // Auto-size columns
    const colWidths = Object.keys(rows[0] || {}).map(key => ({
      wch: Math.max(key.length, 20)
    }));
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, `logs-seguranca-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  return (
    <Card className="border-l-4 border-l-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-100 rounded-xl shadow-sm">
              <Shield className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl font-bold">Log de Segurança</CardTitle>
                {isRealtimeConnected && (
                  <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 text-[10px] px-2 py-0.5">
                    <Radio className="h-2.5 w-2.5 mr-1 animate-pulse" />
                    AO VIVO
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Auditoria completa de ações administrativas
              </p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={handleExport} disabled={logs.length === 0} className="text-indigo-600 border-indigo-200 hover:bg-indigo-50">
              <Download className="h-4 w-4 mr-1.5" />
              Exportar
            </Button>
            <Button variant="outline" size="sm" onClick={onCleanup} className="text-red-600 border-red-200 hover:bg-red-50">
              <Trash2 className="h-4 w-4 mr-1.5" />
              Limpar +30d
            </Button>
            <Button variant="outline" size="sm" onClick={onRefresh} className="border-gray-200">
              <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
};

export default SecurityLogHeader;
