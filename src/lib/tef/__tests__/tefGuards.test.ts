import {
  isConfirmed, markConfirmed, claimApproval, strongApprovalKey, markPaymentStarted, classifyLateApproval,
  matchOrdem, setActivePayment, clearActivePayment, shouldResume, claimFinalization,
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

test('registro do pagamento acontece uma vez por venda', () => {
  expect(claimFinalization(VENDA)).toBe(true);
  expect(claimFinalization(VENDA)).toBe(false);
  expect(claimFinalization(OUTRA)).toBe(true);
});
