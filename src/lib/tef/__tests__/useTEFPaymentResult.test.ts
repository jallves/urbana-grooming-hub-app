import { renderHook, act } from '@testing-library/react';
import { useTEFPaymentResult } from '@/hooks/useTEFPaymentResult';
import { getAmbiguousApprovals } from '../tefGuards';

const VENDA = '3f2b8c1e-1111-4a2b-9c3d-abcdefabcdef';

beforeEach(() => { localStorage.clear(); sessionStorage.clear(); jest.spyOn(console, 'log').mockImplementation(() => {}); jest.spyOn(console, 'warn').mockImplementation(() => {}); });
afterEach(() => jest.restoreAllMocks());

function send(detail: Record<string, unknown>) {
  act(() => { window.dispatchEvent(new CustomEvent('tefPaymentResult', { detail })); });
}

test('tela ativa: aprovação com ordemId vazio NÃO chama onResult e fica registrada como ambígua', () => {
  const onResult = jest.fn();
  renderHook(() => useTEFPaymentResult({ enabled: true, onResult, paymentKey: VENDA }));
  send({ status: 'aprovado', ordemId: '', nsu: '111', autorizacao: 'A1', timestamp: 1 });
  expect(onResult).not.toHaveBeenCalled();
  const amb = getAmbiguousApprovals();
  expect(amb).toHaveLength(1);
  expect(amb[0].motivo).toBe('aprovado_sem_ordemId_confiavel');
});

test('tela ativa: aprovação com ordemId da venda chama onResult', () => {
  const onResult = jest.fn();
  renderHook(() => useTEFPaymentResult({ enabled: true, onResult, paymentKey: VENDA }));
  send({ status: 'aprovado', ordemId: VENDA, nsu: '222', autorizacao: 'A2', timestamp: 2 });
  expect(onResult).toHaveBeenCalledTimes(1);
  expect(getAmbiguousApprovals()).toHaveLength(0);
});

test('tela ativa: cancelamento sem ordemId continua chegando à tela', () => {
  const onResult = jest.fn();
  renderHook(() => useTEFPaymentResult({ enabled: true, onResult, paymentKey: VENDA }));
  send({ status: 'cancelado', ordemId: '', timestamp: 3 });
  expect(onResult).toHaveBeenCalledTimes(1);
  expect(onResult.mock.calls[0][0].status).toBe('cancelado');
});

test('aprovação antiga guardada no tablet (de antes deste pagamento) NÃO finaliza a venda', () => {
  const old = Date.now() - 3 * 60 * 1000; // 3 minutos antes
  localStorage.setItem('lastTefResult', JSON.stringify({ status: 'aprovado', ordemId: VENDA, nsu: '333', autorizacao: 'A3', timestamp: old }));
  localStorage.setItem('lastTefResultTime', String(old));
  const onResult = jest.fn();
  renderHook(() => useTEFPaymentResult({ enabled: true, onResult, paymentKey: VENDA }));
  expect(onResult).not.toHaveBeenCalled();
});
