/**
 * Gerenciamento de armazenamento de logs TEF com retenção de 30 dias
 */

export interface StoredTransactionLog {
  id: string;
  timestamp: string;
  date: string; // YYYY-MM-DD
  type: 'info' | 'success' | 'error' | 'warning' | 'transaction';
  message: string;
  data?: Record<string, unknown>;
}

export interface StoredAndroidLog {
  timestamp: string;
  date: string; // YYYY-MM-DD
  message: string;
}

interface LogStorage {
  transactionLogs: StoredTransactionLog[];
  androidLogs: StoredAndroidLog[];
  lastCleanup: string; // ISO date
}

const STORAGE_KEY = 'tef_homologacao_storage_v2';
const RETENTION_DAYS = 30;

/**
 * Remove logs mais antigos que 30 dias
 */
function filterByRetention<T extends { timestamp?: string; date?: string }>(logs: T[]): T[] {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);
  
  return logs.filter(log => {
    const logDate = log.timestamp ? new Date(log.timestamp) : 
                    log.date ? new Date(log.date) : new Date();
    return logDate >= cutoffDate;
  });
}

/**
 * Carrega logs do localStorage
 */
export function loadLogStorage(): LogStorage {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return {
        transactionLogs: [],
        androidLogs: [],
        lastCleanup: new Date().toISOString()
      };
    }
    
    const parsed: LogStorage = JSON.parse(stored);
    
    // Aplicar filtro de retenção
    const filtered: LogStorage = {
      transactionLogs: filterByRetention(parsed.transactionLogs || []),
      androidLogs: filterByRetention(parsed.androidLogs || []),
      lastCleanup: parsed.lastCleanup || new Date().toISOString()
    };
    
    return filtered;
  } catch (error) {
    console.error('[TEF LogStorage] Erro ao carregar logs:', error);
    return {
      transactionLogs: [],
      androidLogs: [],
      lastCleanup: new Date().toISOString()
    };
  }
}

/**
 * Salva logs no localStorage
 */
export function saveLogStorage(storage: LogStorage): void {
  try {
    // Aplicar filtro de retenção antes de salvar
    const filtered: LogStorage = {
      transactionLogs: filterByRetention(storage.transactionLogs),
      androidLogs: filterByRetention(storage.androidLogs),
      lastCleanup: new Date().toISOString()
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('[TEF LogStorage] Erro ao salvar logs:', error);
  }
}

/**
 * Adiciona um log de transação
 */
export function addTransactionLog(log: Omit<StoredTransactionLog, 'id' | 'date'>): StoredTransactionLog {
  const storage = loadLogStorage();
  
  const newLog: StoredTransactionLog = {
    ...log,
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    date: log.timestamp.split('T')[0]
  };
  
  storage.transactionLogs.push(newLog);
  saveLogStorage(storage);
  
  return newLog;
}

/**
 * Adiciona logs do Android (em batch, por data)
 */
export function addAndroidLogs(logs: string[], date?: string): StoredAndroidLog[] {
  const storage = loadLogStorage();
  const now = new Date();
  const dateStr = date || now.toISOString().split('T')[0];
  
  // Remover logs antigos do mesmo dia para evitar duplicação massiva
  storage.androidLogs = storage.androidLogs.filter(l => l.date !== dateStr);
  
  const newLogs: StoredAndroidLog[] = logs.map((message, index) => ({
    timestamp: new Date(now.getTime() + index).toISOString(),
    date: dateStr,
    message
  }));
  
  storage.androidLogs.push(...newLogs);
  saveLogStorage(storage);
  
  return newLogs;
}

/**
 * Retorna todas as datas disponíveis com logs (ordenadas do mais recente)
 */
export function getAvailableDates(): string[] {
  const storage = loadLogStorage();
  
  const dates = new Set<string>();
  
  storage.transactionLogs.forEach(log => {
    if (log.date) dates.add(log.date);
  });
  
  storage.androidLogs.forEach(log => {
    if (log.date) dates.add(log.date);
  });
  
  // Adicionar hoje se não existir
  const today = new Date().toISOString().split('T')[0];
  dates.add(today);
  
  return Array.from(dates).sort((a, b) => b.localeCompare(a));
}

/**
 * Retorna logs de uma data específica
 */
export function getLogsByDate(date: string): {
  transactionLogs: StoredTransactionLog[];
  androidLogs: StoredAndroidLog[];
} {
  const storage = loadLogStorage();
  
  return {
    transactionLogs: storage.transactionLogs.filter(l => l.date === date),
    androidLogs: storage.androidLogs.filter(l => l.date === date)
  };
}

/**
 * Retorna todos os logs (para exportação)
 */
export function getAllLogs(): LogStorage {
  return loadLogStorage();
}

/**
 * Limpa todos os logs
 */
export function clearAllLogs(): void {
  const emptyStorage: LogStorage = {
    transactionLogs: [],
    androidLogs: [],
    lastCleanup: new Date().toISOString()
  };
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(emptyStorage));
  
  // Também limpar o storage antigo se existir
  localStorage.removeItem('tef_homologacao_logs');
}

/**
 * Limpa logs de uma data específica
 */
export function clearLogsByDate(date: string): void {
  const storage = loadLogStorage();
  
  storage.transactionLogs = storage.transactionLogs.filter(l => l.date !== date);
  storage.androidLogs = storage.androidLogs.filter(l => l.date !== date);
  
  saveLogStorage(storage);
}

/**
 * Migra logs do formato antigo para o novo
 */
export function migrateOldLogs(): void {
  try {
    const oldLogs = localStorage.getItem('tef_homologacao_logs');
    if (!oldLogs) return;
    
    const parsed = JSON.parse(oldLogs);
    if (!Array.isArray(parsed) || parsed.length === 0) return;
    
    const storage = loadLogStorage();
    
    // Migrar logs antigos
    parsed.forEach((log: any) => {
      if (log.id && log.timestamp && log.message) {
        const exists = storage.transactionLogs.some(l => l.id === log.id);
        if (!exists) {
          storage.transactionLogs.push({
            id: log.id,
            timestamp: log.timestamp,
            date: log.date || log.timestamp.split('T')[0],
            type: log.type || 'info',
            message: log.message,
            data: log.data
          });
        }
      }
    });
    
    saveLogStorage(storage);
    
    // Remover storage antigo após migração
    localStorage.removeItem('tef_homologacao_logs');
    
    console.log('[TEF LogStorage] Migração de logs antigos concluída');
  } catch (error) {
    console.error('[TEF LogStorage] Erro na migração:', error);
  }
}

/**
 * Retorna estatísticas de armazenamento
 */
export function getStorageStats(): {
  totalTransactionLogs: number;
  totalAndroidLogs: number;
  oldestDate: string | null;
  newestDate: string | null;
  daysWithLogs: number;
} {
  const storage = loadLogStorage();
  const dates = getAvailableDates();
  
  return {
    totalTransactionLogs: storage.transactionLogs.length,
    totalAndroidLogs: storage.androidLogs.length,
    oldestDate: dates.length > 0 ? dates[dates.length - 1] : null,
    newestDate: dates.length > 0 ? dates[0] : null,
    daysWithLogs: dates.length
  };
}

/**
 * Formata data para exibição
 */
export function formatDateForDisplay(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const dateOnly = new Date(date);
  dateOnly.setHours(0, 0, 0, 0);
  
  if (dateOnly.getTime() === today.getTime()) {
    return 'Hoje';
  } else if (dateOnly.getTime() === yesterday.getTime()) {
    return 'Ontem';
  }
  
  return date.toLocaleDateString('pt-BR', { 
    weekday: 'short', 
    day: '2-digit', 
    month: '2-digit' 
  });
}
