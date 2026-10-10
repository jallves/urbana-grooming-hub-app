import {
  isConfirmed, markConfirmed, claimApproval, strongApprovalKey, markPaymentStarted, classifyLateApproval,
  matchOrdem, setActivePayment, clearActivePayment, shouldResume, registerPaymentOnce, isPaymentRegistered, correlateResult, registerThenFinalize, getRegistrationIssues,
  LATE_APPROVAL_WINDOW_MS, ACTIVE_TTL,
} from '../tefGuards';

const VENDA = '3f2b8c1e-1111-4a2b-9c3d-abcdefabcdef';
const OUTRA = '9a9a9a9a-2222-4b3c-8d4e-fedcbafedcba';

beforeEach(() => localStorage.clear());

test('confirmação só é marcada depois de enviada; id marcado não é reenviado', () => {
  expect(isConfirmed('abc')).toBe(false); // envio falhou → nada marcado → pode tentar de novo
  markConfirmed('abc');
  expect(isConfirmed('abc')).toBe(true);
  expect(isConfirmed('def')).toBe(false);
});

test('deduplicação só com NSU E autorização; chave fraca não deduplica', () => {
  expect(strongApprovalKey('123', '')).toBeNull();
  expect(claimApproval('123', '')).toBeNull();
  expect(claimApproval('', 'A1')).toBeNull();
  expect(claimApproval('123', 'A1')).toBe(true);
  expect(claimApproval('123', 'A1')).toBe(false);
});

test('aprovação tardia só aceita com ordemId da cobrança aberta, dentro de 10 min', () => {
  const t = Date.now();
  markPaymentStarted(VENDA, t);
  expect(classifyLateApproval(VENDA, t + 1000)).toBe('accept');
  expect(classifyLateApproval(OUTRA, t + 1000)).toBe('ambiguous');
  expect(classifyLateApproval('', t + 1000)).toBe('ambiguous');
  expect(classifyLateApproval(VENDA, t + LATE_APPROVAL_WINDOW_MS + 1)).toBe('expired');
});

test('ordem de fallback com "_" (APK trunca) nunca é aceita como correlação', () => {
  const t = Date.now();
  markPaymentStarted('PIX_1700000000', t);
  expect(classifyLateApproval('PIX', t + 1000)).toBe('ambiguous');
  expect(matchOrdem('PIX', 'PIX_1700000000')).toBe('unknown');
});

test('matchOrdem: igual, diferente e sem ordemId', () => {
  expect(matchOrdem(VENDA, VENDA)).toBe('match');
  expect(matchOrdem(OUTRA, VENDA)).toBe('mismatch');
  expect(matchOrdem('', VENDA)).toBe('unknown');
});

test('retomada só na mesma venda, dentro do prazo, e não após cancelamento', () => {
  const t = Date.now();
  setActivePayment(VENDA, t);
  expect(shouldResume(VENDA, t + 1000)).toBe(true);
  expect(shouldResume(OUTRA, t + 1000)).toBe(false);
  expect(shouldResume(VENDA, t + ACTIVE_TTL + 1)).toBe(false);
  clearActivePayment();
  expect(shouldResume(VENDA, t + 1000)).toBe(false);
});

test('aprovação com ordemId vazio/inconfiável/diferente na tela ativa é ambígua (não finaliza)', () => {
  expect(correlateResult('aprovado', '', VENDA)).toBe('ambiguous');
  expect(correlateResult('aprovado', undefined, VENDA)).toBe('ambiguous');
  expect(correlateResult('aprovado', 'PIX', VENDA)).toBe('ambiguous');
  expect(correlateResult('aprovado', OUTRA, VENDA)).toBe('ambiguous');
  expect(correlateResult('aprovado', VENDA, VENDA)).toBe('process');
  // tela sem venda conhecida: comportamento anterior
  expect(correlateResult('aprovado', '', null)).toBe('process');
});

test('cancelado/erro sem ordemId continua sendo tratado; de outra venda é ignorado', () => {
  expect(correlateResult('cancelado', '', VENDA)).toBe('process');
  expect(correlateResult('erro', '', VENDA)).toBe('process');
  expect(correlateResult('negado', VENDA, VENDA)).toBe('process');
  expect(correlateResult('cancelado', OUTRA, VENDA)).toBe('ignore');
  expect(correlateResult('cancelado', '', VENDA, true)).toBe('ignore'); // retomada sem ordemId
});

test('falha no insert não bloqueia: nova tentativa registra e depois fica idempotente', async () => {
  const fail = jest.fn().mockResolvedValue({ error: { message: 'rede' } });
  expect(await registerPaymentOnce(VENDA, fail)).toBe('failed');
  expect(isPaymentRegistered(VENDA)).toBe(false);

  const throws = jest.fn().mockRejectedValue(new Error('offline'));
  expect(await registerPaymentOnce(VENDA, throws)).toBe('failed');
  expect(isPaymentRegistered(VENDA)).toBe(false);

  const ok = jest.fn().mockResolvedValue({ error: null });
  expect(await registerPaymentOnce(VENDA, ok)).toBe('inserted');
  expect(isPaymentRegistered(VENDA)).toBe(true);
  expect(await registerPaymentOnce(VENDA, ok)).toBe('skipped');
  expect(ok).toHaveBeenCalledTimes(1);
  expect(await registerPaymentOnce(OUTRA, ok)).toBe('inserted');
});

test('callbacks simultâneos fazem um único insert', async () => {
  let resolve!: (v: { error: unknown }) => void;
  const insert = jest.fn(() => new Promise<{ error: unknown }>((r) => { resolve = r; }));
  const p1 = registerPaymentOnce(VENDA, insert);
  const p2 = registerPaymentOnce(VENDA, insert);
  expect(await p2).toBe('skipped');
  resolve({ error: null });
  expect(await p1).toBe('inserted');
  expect(insert).toHaveBeenCalledTimes(1);
});

test('finalização só começa depois que o insert do pagamento resolve', async () => {
  const order: string[] = [];
  let resolveInsert!: (v: { error: unknown }) => void;
  const insert = jest.fn(() => new Promise<{ error: unknown }>((r) => { resolveInsert = r; }));
  const finalize = jest.fn(async (reg: string) => { order.push(`finalize:${reg}`); return 'ok'; });
  const p = registerThenFinalize(VENDA, () => registerPaymentOnce(VENDA, insert), finalize);
  await Promise.resolve(); await Promise.resolve();
  expect(insert).toHaveBeenCalledTimes(1);
  expect(finalize).not.toHaveBeenCalled();
  order.push('insert-resolve');
  resolveInsert({ error: null });
  const out = await p;
  expect(order).toEqual(['insert-resolve', 'finalize:inserted']);
  expect(out.registration).toBe('inserted');
  expect(getRegistrationIssues()).toHaveLength(0);
});

test('insert com erro: finaliza mesmo assim, informa não confirmado, salva diagnóstico e permite retry', async () => {
  const finalize = jest.fn(async () => 'ok');
  const out = await registerThenFinalize(VENDA, () => registerPaymentOnce(VENDA, async () => ({ error: { message: 'x' } })), finalize);
  expect(out.registration).toBe('failed');
  expect(finalize).toHaveBeenCalledWith('failed');
  expect(getRegistrationIssues()).toHaveLength(1);
  expect(isPaymentRegistered(VENDA)).toBe(false);
  expect(await registerPaymentOnce(VENDA, async () => ({ error: null }))).toBe('inserted');
});

test('insert sem resposta: segue após o limite sem liberar trava (sem insert duplicado)', async () => {
  jest.useFakeTimers();
  const insert = jest.fn(() => new Promise<{ error: unknown }>(() => {}));
  const finalize = jest.fn(async () => 'ok');
  const p = registerThenFinalize(VENDA, () => registerPaymentOnce(VENDA, insert), finalize, 5000);
  await Promise.resolve();
  expect(finalize).not.toHaveBeenCalled();
  jest.advanceTimersByTime(5000);
  jest.useRealTimers();
  const out = await p;
  expect(out.registration).toBe('timeout');
  expect(await registerPaymentOnce(VENDA, insert)).toBe('skipped');
  expect(insert).toHaveBeenCalledTimes(1);
});
