/**
 * TEF Transaction Logger
 * 
 * Centraliza o registro de logs de transações TEF (checkout de serviço e produto)
 * para análise na tela de logs do PDV de homologação.
 */

export interface TEFTransactionLog {
  id: string;
  timestamp: string;
  source: 'checkout_servico' | 'checkout_produto' | 'pdv_homologacao';
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
  data?: Record<string, unknown>;
}

const STORAGE_KEY = 'tef_checkout_transaction_logs';
const MAX_LOGS = 500;

/**
 * Salva um log de transação TEF no localStorage
 */
export function logTEFTransaction(
  source: TEFTransactionLog['source'],
  type: TEFTransactionLog['type'],
  message: string,
  data?: Record<string, unknown>
): void {
  try {
    const log: TEFTransactionLog = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString(),
      source,
      type,
      message,
      data
    };

    const existing = getTEFTransactionLogs();
    const updated = [log, ...existing].slice(0, MAX_LOGS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('[TEFLogger] Erro ao salvar log:', e);
  }
}

/**
 * Recupera todos os logs de transações TEF
 */
export function getTEFTransactionLogs(): TEFTransactionLog[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('[TEFLogger] Erro ao ler logs:', e);
  }
  return [];
}

/**
 * Limpa todos os logs de transações TEF
 */
export function clearTEFTransactionLogs(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Filtra logs por fonte (serviço, produto ou PDV)
 */
export function getTEFLogsBySource(source: TEFTransactionLog['source']): TEFTransactionLog[] {
  return getTEFTransactionLogs().filter(log => log.source === source);
}
