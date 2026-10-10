import {
  claimConfirmation, claimApproval, markPaymentStarted, isWithinLateApprovalWindow,
  setActivePayment, clearActivePayment, shouldResume, LATE_APPROVAL_WINDOW_MS, ACTIVE_TTL,
} from '../tefGuards';

beforeEach(() => localStorage.clear());

test('mesmo confirmationTransactionId só é confirmado uma vez pelo frontend', () => {
  expect(claimConfirmation('abc')).toBe(true);
  expect(claimConfirmation('abc')).toBe(false);
  expect(claimConfirmation('def')).toBe(true);
});

test('aprovação repetida (mesmo NSU+autorização) é ignorada mesmo após 3 s', () => {
  const t = 1_000_000;
  expect(claimApproval('123', 'A1', t)).toBe(true);
  expect(claimApproval('123', 'A1', t + 5000)).toBe(false);
});

test('aprovação tardia aceita até 10 min após o início e recusada depois', () => {
  const t = Date.now();
  markPaymentStarted(t);
  expect(isWithinLateApprovalWindow(t + LATE_APPROVAL_WINDOW_MS - 1)).toBe(true);
  expect(isWithinLateApprovalWindow(t + LATE_APPROVAL_WINDOW_MS + 1)).toBe(false);
});

test('retomada só na mesma venda, dentro do prazo, e não após cancelamento', () => {
  const t = Date.now();
  setActivePayment('venda-1', t);
  expect(shouldResume('venda-1', t + 1000)).toBe(true);
  expect(shouldResume('venda-2', t + 1000)).toBe(false);
  expect(shouldResume('venda-1', t + ACTIVE_TTL + 1)).toBe(false);
  clearActivePayment();
  expect(shouldResume('venda-1', t + 1000)).toBe(false);
});
