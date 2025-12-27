export type TEFReportStatus = 'aprovado' | 'negado' | 'cancelado' | 'erro' | 'pendente';

export interface TEFTransactionRecord {
  id: string;
  timestamp: string; // ISO
  date?: string; // YYYY-MM-DD
  time?: string; // HH:mm:ss
  ordemId?: string;
  /** Campo crítico para homologação PayGo: saidaTransacao.obtemNsuLocal() / terminalNsu */
  nsuLocal?: string;
  nsuHost?: string;
  autorizacao?: string;
  bandeira?: string;
  valorCentavos?: number;
  valor?: number;
  metodo?: string;
  parcelas?: number;
  status: TEFReportStatus;
  codigoResposta?: string;
  mensagem?: string;
  rawData?: string;
}

function nowParts() {
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  const time = now.toLocaleTimeString('pt-BR');
  return { now, date, time };
}

/**
 * Extrai transações a partir das linhas de log do Android (PayGoService).
 * Observação: o valor "NSU Local" aparece como terminalNsu (URI) ou obtemNsuLocal().
 */
export function parseTransactionsFromAndroidLogs(logs: string[]): TEFTransactionRecord[] {
  const transactions: TEFTransactionRecord[] = [];
  let current: Partial<TEFTransactionRecord> | null = null;

  const finalize = (idx: number) => {
    if (!current) return;
    if (!current.nsuLocal && !current.ordemId && !current.nsuHost) {
      current = null;
      return;
    }

    const { now, date, time } = nowParts();
    const rec: TEFTransactionRecord = {
      id: current.id || `txn_${Date.now()}_${idx}`,
      timestamp: current.timestamp || now.toISOString(),
      date: current.date || date,
      time: current.time || time,
      ordemId: current.ordemId,
      nsuLocal: current.nsuLocal,
      nsuHost: current.nsuHost,
      autorizacao: current.autorizacao,
      bandeira: current.bandeira,
      valorCentavos: current.valorCentavos,
      valor: current.valor,
      metodo: current.metodo,
      parcelas: current.parcelas,
      status: (current.status || 'pendente') as TEFReportStatus,
      codigoResposta: current.codigoResposta,
      mensagem: current.mensagem,
      rawData: current.rawData,
    };

    transactions.push(rec);
    current = null;
  };

  for (let i = 0; i < logs.length; i++) {
    const log = logs[i];

    // Começo de transação
    if (log.includes('[TXN]') && (log.includes('INICIANDO') || log.includes('INICIAR') || log.includes('Iniciando'))) {
      const { now, date, time } = nowParts();
      current = {
        id: `txn_${Date.now()}_${i}`,
        timestamp: now.toISOString(),
        date,
        time,
        status: 'pendente',
      };

      const ordemMatch = log.match(/ordemId[:\s]*([^\s,}]+)/i);
      if (ordemMatch) current.ordemId = ordemMatch[1].replace(/["']/g, '');

      const valorMatch = log.match(/valor(?:Centavos)?[:\s]*(\d+)/i);
      if (valorMatch) {
        current.valorCentavos = parseInt(valorMatch[1], 10);
        current.valor = current.valorCentavos / 100;
      }

      const metodoMatch = log.match(/metodo[:\s]*([^\s,}]+)/i);
      if (metodoMatch) current.metodo = metodoMatch[1].replace(/["']/g, '');

      continue;
    }

    // Linha de resposta/resultado
    if (
      log.includes('[RESP]') ||
      log.includes('RESULTADO DO PAYGO') ||
      log.includes('saidaTransacao') ||
      log.includes('terminalNsu')
    ) {
      if (!current) {
        const { now, date, time } = nowParts();
        current = {
          id: `txn_${Date.now()}_${i}`,
          timestamp: now.toISOString(),
          date,
          time,
          status: 'pendente',
        };
      }

      // NSU Local (CRÍTICO)
      const nsuLocalMatch = log.match(/(?:terminalNsu|nsuLocal|obtemNsuLocal)[:\s]*["']?(\d+)["']?/i);
      if (nsuLocalMatch) current.nsuLocal = nsuLocalMatch[1];

      // NSU Host
      const nsuHostMatch = log.match(/(?:transactionNsu|nsuHost)[:\s]*["']?(\d+)["']?/i);
      if (nsuHostMatch) current.nsuHost = nsuHostMatch[1];

      // fallback: se só tiver nsu genérico e não tiver nsuLocal ainda
      const nsuGeneric = log.match(/\bnsu\b[:\s]*["']?(\d+)["']?/i);
      if (nsuGeneric && !current.nsuLocal) current.nsuHost = current.nsuHost || nsuGeneric[1];

      // Autorização
      const authMatch = log.match(/(?:authorizationCode|autorizacao|authorization)[:\s]*["']?([A-Z0-9]+)["']?/i);
      if (authMatch) current.autorizacao = authMatch[1];

      // Bandeira
      const bandeiraMatch = log.match(/(?:cardName|bandeira|card)[:\s]*["']?([A-Za-z]+)["']?/i);
      if (bandeiraMatch) current.bandeira = bandeiraMatch[1].toUpperCase();

      // Código resposta
      const codRespMatch = log.match(/(?:transactionResult|codigoResposta|resultCode)[:\s]*["']?(-?\d+)["']?/i);
      if (codRespMatch) current.codigoResposta = codRespMatch[1];

      // Mensagem
      const msgMatch = log.match(/(?:resultMessage|mensagem|message)[:\s]*["']?([^"',}]+)["']?/i);
      if (msgMatch) current.mensagem = msgMatch[1];

      // Status (heurística)
      if (log.includes('APROVADO') || log.includes('aprovado') || log.includes('transactionResult":0') || log.includes('transactionResult: 0')) {
        current.status = 'aprovado';
      } else if (log.includes('NEGADO') || log.includes('negado') || log.toLowerCase().includes('recusad')) {
        current.status = 'negado';
      } else if (log.includes('CANCELADO') || log.includes('cancelado')) {
        current.status = 'cancelado';
      } else if (log.includes('ERRO') || log.includes('erro')) {
        current.status = 'erro';
      }

      // rawData
      current.rawData = logs.slice(Math.max(0, i - 12), i + 1).join('\n');

      // se já temos um NSU Local, podemos considerar “finalizável” quando aparecer status
      if (current.nsuLocal && current.status !== 'pendente') {
        finalize(i);
      }

      continue;
    }

    // Finalizações explícitas
    if (current && (log.includes('FINALIZADO') || log.includes('CONFIRMADO') || log.includes('APROVADO') || log.includes('NEGADO') || log.includes('CANCELADO') || log.includes('ERRO'))) {
      finalize(i);
    }
  }

  // finaliza a última se tiver algo útil
  if (current) finalize(logs.length);

  // remover duplicatas por (nsuLocal+ordemId) ou id
  const unique = transactions.filter((t, idx, self) => {
    return idx === self.findIndex(o => (o.id && o.id === t.id) || ((o.nsuLocal || o.nsuHost) === (t.nsuLocal || t.nsuHost) && o.ordemId === t.ordemId));
  });

  // ordenar (mais recente primeiro)
  unique.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return unique;
}

const STORAGE_KEY = 'tef_transactions_log';

export function getStoredTEFTransactions(): TEFTransactionRecord[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed as TEFTransactionRecord[];
  } catch {
    return [];
  }
}

export function storeTEFTransaction(txn: TEFTransactionRecord) {
  try {
    const existing = getStoredTEFTransactions();
    const updated = [txn, ...existing].slice(0, 500);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // noop
  }
}

export function mergeUniqueTEFTransactions(a: TEFTransactionRecord[], b: TEFTransactionRecord[]) {
  const all = [...a, ...b];
  const unique = all.filter((t, idx, self) => {
    return idx === self.findIndex(o => (o.id && o.id === t.id) || ((o.nsuLocal || o.nsuHost) === (t.nsuLocal || t.nsuHost) && o.ordemId === t.ordemId));
  });
  unique.sort((x, y) => new Date(y.timestamp).getTime() - new Date(x.timestamp).getTime());
  return unique;
}
