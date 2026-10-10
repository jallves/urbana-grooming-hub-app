/**
 * Proteções do frontend para o fluxo TEF/PayGo (sem depender do APK).
 *
 * Dados reais disponíveis (PayGoService.kt parseResponseUri + TEFResultado):
 *  - ordemId: o APK devolve `pendingTransactionId.substringBefore("_")`, ou seja,
 *    o ordemId que o frontend enviou (venda_id/sale.id) TRUNCADO no primeiro "_".
 *    UUIDs não têm "_" → volta íntegro. Ordens de fallback como "PIX_123" voltam
 *    só "PIX" → não servem para distinguir tentativas.
 *  - nsu / autorizacao: podem vir vazios ("") dependendo do provedor.
 *  - confirmationTransactionId: id para confirmação.
 * Não existe id de tentativa além do ordemId. Por isso:
 *  - aprovação tardia só é aceita se o ordemId devolvido bater com o da cobrança aberta;
 *    sem ordemId confiável → caso ambíguo, registrado para revisão e NÃO finalizado.
 */

export const LATE_APPROVAL_WINDOW_MS = 10 * 60 * 1000;
export const ID_MEMORY_MS = 30 * 60 * 1000;
const MAX_IDS = 20;

const START_KEY = 'tef_last_payment_start';
const CONFIRMED_KEY = 'tef_confirmed_ids';
const APPROVED_KEY = 'tef_approved_keys';
const FINALIZED_KEY = 'tef_finalized_sales';
const AMBIGUOUS_KEY = 'tef_ambiguous_approvals';
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
function hasId(key: string, id: string, now: number) { return readList(key, now).some((e) => e.id === id); }
function addId(key: string, id: string, now: number) {
  const list = readList(key, now);
  if (!list.some((e) => e.id === id)) writeList(key, [...list, { id, ts: now }]);
}

// ─── ordemId ───────────────────────────────────────────────────────────────
/** ordemId como o APK devolve (truncado no primeiro "_"). */
export function nativeOrdemId(ordemId?: string | null): string {
  return String(ordemId || '').split('_')[0];
}
/** Um ordemId só identifica a tentativa se não tiver "_" (o APK trunca) e não for vazio. */
export function isReliableOrdemId(ordemId?: string | null): boolean {
  const s = String(ordemId || '');
  return s.length >= 8 && !s.includes('_');
}
/** Compara ordemId devolvido pelo APK com a venda esperada. */
export function matchOrdem(resultOrdemId: string | null | undefined, expected: string | null | undefined): 'match' | 'mismatch' | 'unknown' {
  const r = String(resultOrdemId || '');
  if (!r || !isReliableOrdemId(expected)) return 'unknown';
  return r === nativeOrdemId(expected) ? 'match' : 'mismatch';
}

// ─── Cobrança aberta / aprovação tardia ─────────────────────────────────────
export function markPaymentStarted(ordemId: string, now = Date.now()) {
  try { localStorage.setItem(START_KEY, JSON.stringify({ ts: now, ordemId })); } catch { /* ignore */ }
}
function readStart(): { ts: number; ordemId: string } | null {
  try {
    const p = JSON.parse(localStorage.getItem(START_KEY) || 'null');
    return p && typeof p.ts === 'number' ? p : null;
  } catch { return null; }
}
/**
 * Aprovação tardia (sem operação ativa no hook): só 'accept' se dentro da janela
 * E o ordemId devolvido corresponde, de forma confiável, à última cobrança aberta.
 */
export function classifyLateApproval(resultOrdemId?: string | null, now = Date.now()): 'accept' | 'ambiguous' | 'expired' {
  const s = readStart();
  if (!s || now - s.ts >= LATE_APPROVAL_WINDOW_MS) return 'expired';
  return matchOrdem(resultOrdemId, s.ordemId) === 'match' ? 'accept' : 'ambiguous';
}

/** Registra aprovação que não pôde ser atribuída com segurança (para revisão manual). */
export function recordAmbiguousApproval(data: Record<string, unknown>, now = Date.now()) {
  try {
    const list = JSON.parse(localStorage.getItem(AMBIGUOUS_KEY) || '[]');
    const arr = Array.isArray(list) ? list : [];
    arr.push({ ...data, ts: now, at: new Date(now).toISOString() });
    localStorage.setItem(AMBIGUOUS_KEY, JSON.stringify(arr.slice(-50)));
  } catch { /* ignore */ }
}
export function getAmbiguousApprovals(): Array<Record<string, unknown>> {
  try { const l = JSON.parse(localStorage.getItem(AMBIGUOUS_KEY) || '[]'); return Array.isArray(l) ? l : []; } catch { return []; }
}

// ─── Confirmação (frontend) ─────────────────────────────────────────────────
/**
 * Só marcar DEPOIS de confirmarTransacaoTEF() retornar true.
 * Limitação: `true` significa apenas que a chamada à bridge não lançou erro
 * (TEFBridge.confirmarTransacao é void). Não há retorno de sucesso da PayGo.
 */
export function isConfirmed(id: string, now = Date.now()): boolean { return !!id && hasId(CONFIRMED_KEY, id, now); }
export function markConfirmed(id: string, now = Date.now()) { if (id) addId(CONFIRMED_KEY, id, now); }

// ─── Deduplicação de aprovação ─────────────────────────────────────────────
/** Chave forte apenas com NSU E autorização presentes; caso contrário null (não deduplicar). */
export function strongApprovalKey(nsu?: string | null, autorizacao?: string | null): string | null {
  const n = String(nsu || '').trim();
  const a = String(autorizacao || '').trim();
  return n && a ? `${n}_${a}` : null;
}
/** true = nova (registrada); false = repetida; null = sem chave forte (não dá para afirmar). */
export function claimApproval(nsu?: string | null, autorizacao?: string | null, now = Date.now()): boolean | null {
  const key = strongApprovalKey(nsu, autorizacao);
  if (!key) return null;
  if (hasId(APPROVED_KEY, key, now)) return false;
  addId(APPROVED_KEY, key, now);
  return true;
}

// ─── Finalização por venda ─────────────────────────────────────────────────
/** true na primeira vez para esta venda (30 min); evita registrar o pagamento duas vezes após reload. */
export function claimFinalization(vendaId?: string | null, now = Date.now()): boolean {
  if (!vendaId) return true;
  if (hasId(FINALIZED_KEY, vendaId, now)) return false;
  addId(FINALIZED_KEY, vendaId, now);
  return true;
}

// ─── Pagamento ativo (retomada após reload) ────────────────────────────────
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
/** Retomar só se recente E da mesma venda com id confiável (formato antigo/sem venda não retoma). */
export function shouldResume(vendaId?: string | null, now = Date.now()): boolean {
  const a = getActivePayment();
  if (!a || now - a.ts >= ACTIVE_TTL) return false;
  return isReliableOrdemId(vendaId) && a.vendaId === vendaId;
}
