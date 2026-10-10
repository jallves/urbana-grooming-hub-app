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

// ─── Correlação resultado ↔ venda da tela ───────────────────────────────────
/**
 * Decide o que fazer com um resultado TEF numa tela que conhece a venda (paymentKey).
 *  - sem paymentKey → 'process' (tela não informou venda; comportamento anterior)
 *  - APROVADO: só 'process' com ordemId que bate com a venda ('match');
 *    vazio/inconfiável/diferente → 'ambiguous' (NÃO finalizar; registrar para revisão)
 *  - NÃO aprovado (cancelado/negado/erro): ordemId de outra venda → 'ignore';
 *    sem ordemId → 'process' (ex.: aviso do vigia nativo não traz ordemId), exceto
 *    em retomada após reload, onde sem ordemId não dá para atribuir → 'ignore'.
 */
export type Correlation = 'process' | 'ignore' | 'ambiguous';
export function correlateResult(
  status: string, resultOrdemId: string | null | undefined, paymentKey: string | null | undefined, resumed = false,
): Correlation {
  if (!paymentKey) return 'process';
  const m = matchOrdem(resultOrdemId, paymentKey);
  if (status === 'aprovado') return m === 'match' ? 'process' : 'ambiguous';
  if (m === 'mismatch') return 'ignore';
  if (m === 'unknown' && resumed) return 'ignore';
  return 'process';
}

// ─── Registro do pagamento por venda (claim → insert → marca/libera) ───────
const inFlightRegistrations = new Set<string>();

/** Já registrado com sucesso nesta venda (30 min)? */
export function isPaymentRegistered(vendaId: string, now = Date.now()): boolean {
  return hasId(FINALIZED_KEY, vendaId, now);
}

/**
 * Executa o insert do pagamento no máximo uma vez com sucesso por venda.
 *  - 'skipped': já registrado (localStorage, sobrevive a reload) ou outro envio em andamento
 *    nesta mesma página (callbacks simultâneos).
 *  - 'inserted': insert retornou sem erro → só AGORA marca como registrado.
 *  - 'failed': insert retornou erro ou lançou → libera; o próximo processamento pode tentar de novo.
 * Reload durante o envio: a trava em memória some e a marca ainda não existe → nova tentativa
 * é permitida (preferimos possível repetição a perder o registro).
 */
export async function registerPaymentOnce(
  vendaId: string | null | undefined,
  insert: () => PromiseLike<{ error: unknown }>,
  now: () => number = Date.now,
): Promise<'inserted' | 'skipped' | 'failed'> {
  if (!vendaId) return 'skipped';
  if (isPaymentRegistered(vendaId, now()) || inFlightRegistrations.has(vendaId)) return 'skipped';
  inFlightRegistrations.add(vendaId);
  try {
    const res = await insert();
    if (res && res.error) return 'failed';
    addId(FINALIZED_KEY, vendaId, now());
    return 'inserted';
  } catch {
    return 'failed';
  } finally {
    inFlightRegistrations.delete(vendaId);
  }
}

// ─── Sequência: registro do pagamento → finalização ────────────────────────
const REG_FAIL_KEY = 'tef_payment_registration_failures';
export type RegistrationStatus = 'inserted' | 'skipped' | 'failed' | 'timeout';

/** Guarda no tablet as vendas cujo registro do pagamento não foi confirmado (diagnóstico/recuperação). */
export function recordRegistrationIssue(data: Record<string, unknown>, now = Date.now()) {
  try {
    const l = JSON.parse(localStorage.getItem(REG_FAIL_KEY) || '[]');
    const arr = Array.isArray(l) ? l : [];
    arr.push({ ...data, ts: now, at: new Date(now).toISOString() });
    localStorage.setItem(REG_FAIL_KEY, JSON.stringify(arr.slice(-50)));
  } catch { /* ignore */ }
}
export function getRegistrationIssues(): Array<Record<string, unknown>> {
  try { const l = JSON.parse(localStorage.getItem(REG_FAIL_KEY) || '[]'); return Array.isArray(l) ? l : []; } catch { return []; }
}

/**
 * Aguarda o registro do pagamento ANTES de iniciar a finalização.
 *  - 'inserted'/'skipped' (já registrado ou em andamento): segue para finalizar.
 *  - 'failed': registra diagnóstico (venda NÃO marcada → nova tentativa possível) e segue
 *    para finalizar — a finalização no servidor não depende desse registro e é idempotente;
 *    o retorno informa que o registro NÃO foi confirmado.
 *  - 'timeout' (registro não respondeu em `timeoutMs`): o envio continua em andamento com a
 *    trava ativa (sem duplicar); registra diagnóstico e segue para finalizar.
 */
export async function registerThenFinalize<T>(
  vendaId: string | null | undefined,
  register: () => Promise<'inserted' | 'skipped' | 'failed'>,
  finalize: (registration: RegistrationStatus) => Promise<T>,
  timeoutMs = 5000,
): Promise<{ registration: RegistrationStatus; result: T }> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const registration: RegistrationStatus = await Promise.race([
    register().catch(() => 'failed' as const),
    new Promise<'timeout'>((r) => { timer = setTimeout(() => r('timeout'), timeoutMs); }),
  ]);
  if (timer) clearTimeout(timer);
  if (registration === 'failed' || registration === 'timeout') {
    recordRegistrationIssue({ vendaId: vendaId || null, motivo: registration });
  }
  const result = await finalize(registration);
  return { registration, result };
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
