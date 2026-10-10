/**
 * Proteções do frontend para o fluxo TEF/PayGo (sem depender do APK).
 * - Aprovação tardia: aceita "aprovado" até 10 min após o início da cobrança.
 * - Confirmação única por confirmationTransactionId (evita reenvios por entregas repetidas).
 * - Aprovação única por NSU+autorização.
 * - Pagamento ativo vinculado à venda (retomada só na mesma venda).
 */

export const LATE_APPROVAL_WINDOW_MS = 10 * 60 * 1000;
export const ID_MEMORY_MS = 30 * 60 * 1000;
const MAX_IDS = 20;

const START_KEY = 'tef_last_payment_start_ts';
const CONFIRMED_KEY = 'tef_confirmed_ids';
const APPROVED_KEY = 'tef_approved_keys';
export const ACTIVE_KEY = 'tef_active_payment';
export const ACTIVE_TTL = 10 * 60 * 1000;

type Entry = { id: string; ts: number };

function readList(key: string, now: number): Entry[] {
  try {
    const raw = JSON.parse(localStorage.getItem(key) || '[]');
    if (!Array.isArray(raw)) return [];
    return raw.filter((e: Entry) => e && typeof e.id === 'string' && now - e.ts < ID_MEMORY_MS);
  } catch { return []; }
}
function writeList(key: string, list: Entry[]) {
  try { localStorage.setItem(key, JSON.stringify(list.slice(-MAX_IDS))); } catch { /* ignore */ }
}

export function markPaymentStarted(now = Date.now()) {
  try { localStorage.setItem(START_KEY, String(now)); } catch { /* ignore */ }
}
export function isWithinLateApprovalWindow(now = Date.now()): boolean {
  try {
    const t = parseInt(localStorage.getItem(START_KEY) || '0', 10);
    return t > 0 && now - t < LATE_APPROVAL_WINDOW_MS;
  } catch { return false; }
}

/** Retorna true se este id ainda não foi confirmado pelo frontend (e o registra). */
export function claimConfirmation(id: string, now = Date.now()): boolean {
  if (!id) return false;
  const list = readList(CONFIRMED_KEY, now);
  if (list.some((e) => e.id === id)) return false;
  writeList(CONFIRMED_KEY, [...list, { id, ts: now }]);
  return true;
}

/** Retorna true se esta aprovação (nsu+autorização) é nova (e a registra). */
export function claimApproval(nsu?: string | null, autorizacao?: string | null, now = Date.now()): boolean {
  if (!nsu && !autorizacao) return true; // sem chave: não dá para deduplicar com segurança
  const id = `${nsu || ''}_${autorizacao || ''}`;
  const list = readList(APPROVED_KEY, now);
  if (list.some((e) => e.id === id)) return false;
  writeList(APPROVED_KEY, [...list, { id, ts: now }]);
  return true;
}

export interface ActivePayment { ts: number; vendaId?: string | null }

export function setActivePayment(vendaId?: string | null, now = Date.now()) {
  try { localStorage.setItem(ACTIVE_KEY, JSON.stringify({ ts: now, vendaId: vendaId || null })); } catch { /* ignore */ }
}
export function getActivePayment(): ActivePayment | null {
  try {
    const raw = localStorage.getItem(ACTIVE_KEY);
    if (!raw) return null;
    if (/^\d+$/.test(raw)) return { ts: parseInt(raw, 10), vendaId: null }; // formato antigo
    const p = JSON.parse(raw);
    return typeof p?.ts === 'number' ? p : null;
  } catch { return null; }
}
export function clearActivePayment() {
  try { localStorage.removeItem(ACTIVE_KEY); } catch { /* ignore */ }
}
/** Retomar só se recente E da mesma venda (formato antigo sem venda não retoma). */
export function shouldResume(vendaId?: string | null, now = Date.now()): boolean {
  const a = getActivePayment();
  if (!a || now - a.ts >= ACTIVE_TTL) return false;
  return !!vendaId && !!a.vendaId && a.vendaId === vendaId;
}
