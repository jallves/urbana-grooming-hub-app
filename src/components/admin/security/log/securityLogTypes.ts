import { Eye, Plus, Edit, Trash2, LogOut, Settings, XCircle, CheckCircle, AlertTriangle, Activity } from 'lucide-react';

export interface SecurityLog {
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

export const actionIcons: Record<string, typeof Eye> = {
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

export const actionColors: Record<string, string> = {
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

export const actionBgColors: Record<string, string> = {
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

export const entityLabels: Record<string, string> = {
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

export const actionLabels: Record<string, string> = {
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

export const friendlyFieldName = (key: string): string => {
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

export const formatDataValue = (key: string, value: any): string => {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

export type SeverityLevel = 'critical' | 'warning' | 'info';

export const getLogSeverity = (log: SecurityLog): SeverityLevel => {
  if (log.action === 'delete') return 'critical';
  if (log.action === 'revoke') return 'critical';
  if (log.action === 'update' && (log.entity_type === 'settings' || log.entity_type === 'barber_access')) return 'warning';
  if (log.action === 'cancel') return 'warning';
  if (log.action === 'login' || log.action === 'logout') return 'info';
  if (log.action === 'create') return 'info';
  return 'info';
};

export const severityConfig: Record<SeverityLevel, { label: string; color: string; bg: string }> = {
  critical: { label: 'Crítico', color: 'text-red-700', bg: 'bg-red-100 border-red-300' },
  warning: { label: 'Atenção', color: 'text-amber-700', bg: 'bg-amber-100 border-amber-300' },
  info: { label: 'Info', color: 'text-blue-700', bg: 'bg-blue-100 border-blue-300' },
};
