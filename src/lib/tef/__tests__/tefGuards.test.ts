import {
  isConfirmed, markConfirmed, claimApproval, strongApprovalKey, markPaymentStarted, classifyLateApproval,
  matchOrdem, setActivePayment, clearActivePayment, shouldResume, registerPaymentOnce, isPaymentRegistered, correlateResult, registerThenFinalize, getRegistrationIssues, isRegistrationInFlight, isRegistrationConfirmed,
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

function deferred() {
  let resolve!: (v: { error: unknown }) => void; let reject!: (e: unknown) => void;
  const promise = new Promise<{ error: unknown }>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}
const flush = async () => { for (let i = 0; i < 5; i++) await Promise.resolve(); };

test('chamadas simultâneas aguardam a MESMA gravação (um insert, mesmo resultado)', async () => {
  const d = deferred();
  const insert = jest.fn(() => d.promise);
  const p1 = registerPaymentOnce(VENDA, insert);
  const p2 = registerPaymentOnce(VENDA, insert);
  let p2done = false; p2.then(() => { p2done = true; });
  await flush();
  expect(p2done).toBe(false); // não recebe "ignorado" antes de terminar
  expect(isRegistrationInFlight(VENDA)).toBe(true);
  d.resolve({ error: null });
  expect(await p1).toBe('inserted');
  expect(await p2).toBe('inserted');
  expect(insert).toHaveBeenCalledTimes(1);
  expect(await registerPaymentOnce(VENDA, insert)).toBe('already');
});

test('falha confirmada (erro ou exceção) não marca e permite nova tentativa explícita', async () => {
  expect(await registerPaymentOnce(VENDA, async () => ({ error: { message: 'rede' } }))).toBe('failed');
  expect(isPaymentRegistered(VENDA)).toBe(false);
  expect(await registerPaymentOnce(VENDA, () => Promise.reject(new Error('offline')))).toBe('failed');
  expect(isPaymentRegistered(VENDA)).toBe(false);
  expect(getRegistrationIssues().map((i) => i.motivo)).toEqual(['insert_erro', 'insert_excecao']);
  const ok = jest.fn().mockResolvedValue({ error: null });
  expect(await registerPaymentOnce(VENDA, ok)).toBe('inserted');
  expect(await registerPaymentOnce(VENDA, ok)).toBe('already');
  expect(ok).toHaveBeenCalledTimes(1);
});

test('finalização só começa depois que a gravação resolve', async () => {
  const d = deferred();
  const order: string[] = [];
  const finalize = jest.fn(async (reg: string) => { order.push(`finalize:${reg}`); return 'ok'; });
  const p = registerThenFinalize(VENDA, () => registerPaymentOnce(VENDA, () => d.promise), finalize);
  await flush();
  expect(finalize).not.toHaveBeenCalled();
  order.push('insert-resolve');
  d.resolve({ error: null });
  const out = await p;
  expect(order).toEqual(['insert-resolve', 'finalize:inserted']);
  expect(isRegistrationConfirmed(out.registration)).toBe(true);
});

test('erro na gravação: finaliza a venda, mas o registro NÃO é declarado confirmado', async () => {
  const finalize = jest.fn(async () => 'ok');
  const out = await registerThenFinalize(VENDA, () => registerPaymentOnce(VENDA, async () => ({ error: { message: 'x' } })), finalize);
  expect(out.registration).toBe('failed');
  expect(finalize).toHaveBeenCalledWith('failed');
  expect(isRegistrationConfirmed(out.registration)).toBe(false);
});

test('limite esgotado: status pendente (não sucesso), sem 2º insert, e conclusão tardia é registrada', async () => {
  jest.useFakeTimers();
  const d = deferred();
  const insert = jest.fn(() => d.promise);
  const finalize = jest.fn(async () => 'ok');
  const p = registerThenFinalize(VENDA, () => registerPaymentOnce(VENDA, insert), finalize, 5000);
  await flush();
  expect(finalize).not.toHaveBeenCalled();
  jest.advanceTimersByTime(5000);
  jest.useRealTimers();
  const out = await p;
  expect(out.registration).toBe('pending');
  expect(isRegistrationConfirmed(out.registration)).toBe(false);
  expect(isPaymentRegistered(VENDA)).toBe(false);
  // outra chamada durante a pendência aguarda a mesma gravação
  const again = registerPaymentOnce(VENDA, insert);
  d.resolve({ error: null });
  expect(await out.settled).toBe('inserted');
  expect(await again).toBe('inserted');
  expect(insert).toHaveBeenCalledTimes(1);
  await flush();
  expect(isPaymentRegistered(VENDA)).toBe(true);
  expect(getRegistrationIssues().map((i) => i.motivo)).toEqual(['pendente_apos_limite', 'tardio_gravado']);
});

test('limite esgotado e falha tardia: registrada como falha, nada marcado', async () => {
  jest.useFakeTimers();
  const d = deferred();
  const p = registerThenFinalize(VENDA, () => registerPaymentOnce(VENDA, () => d.promise), async () => 'ok', 5000);
  await flush();
  jest.advanceTimersByTime(5000);
  jest.useRealTimers();
  const out = await p;
  d.resolve({ error: { message: 'tarde' } });
  expect(await out.settled).toBe('failed');
  await flush();
  expect(isPaymentRegistered(VENDA)).toBe(false);
  expect(getRegistrationIssues().map((i) => i.motivo)).toEqual(['pendente_apos_limite', 'insert_erro', 'tardio_falhou']);
});

test('sem venda: não grava e não declara registro confirmado', async () => {
  const out = await registerThenFinalize(null, null, async () => 'ok');
  expect(out.registration).toBe('no_sale');
  expect(isRegistrationConfirmed(out.registration)).toBe(false);
});
