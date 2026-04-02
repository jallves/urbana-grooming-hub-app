import { supabase } from '@/integrations/supabase/client';

const STORAGE_KEY = 'pending_service_checkout_completion';

export interface ServiceCheckoutTransactionData {
  nsu?: string;
  autorizacao?: string;
  bandeira?: string;
  confirmationId?: string;
}

export interface ServiceCheckoutFinishPayload {
  venda_id: string;
  agendamento_id?: string;
  session_id?: string;
  payment_method?: string;
  tipAmount?: number;
  extras?: Array<{ id: string }>;
  products?: Array<{ id: string; quantidade?: number }>;
  combo_discount?: number;
  combo_name?: string | null;
  transaction_data?: ServiceCheckoutTransactionData | null;
}

type PendingCheckoutMap = Record<string, ServiceCheckoutFinishPayload>;

const canUseStorage = () => typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';

const readPendingCheckouts = (): PendingCheckoutMap => {
  if (!canUseStorage()) return {};

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (error) {
    console.warn('[ServiceCheckoutCompletion] Erro ao ler pendências:', error);
    return {};
  }
};

const writePendingCheckouts = (payload: PendingCheckoutMap) => {
  if (!canUseStorage()) return;

  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn('[ServiceCheckoutCompletion] Erro ao salvar pendências:', error);
  }
};

export const persistPendingServiceCheckout = (payload: ServiceCheckoutFinishPayload) => {
  if (!payload.venda_id) return;

  const pending = readPendingCheckouts();
  pending[payload.venda_id] = payload;
  writePendingCheckouts(pending);
};

export const getPendingServiceCheckout = (vendaId?: string | null): ServiceCheckoutFinishPayload | null => {
  if (!vendaId) return null;

  const pending = readPendingCheckouts();
  return pending[vendaId] || null;
};

export const clearPendingServiceCheckout = (vendaId?: string | null) => {
  if (!vendaId) return;

  const pending = readPendingCheckouts();
  if (!pending[vendaId]) return;

  delete pending[vendaId];
  writePendingCheckouts(pending);
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function finalizeServiceCheckout(
  payload: ServiceCheckoutFinishPayload,
  options?: { retries?: number; retryDelayMs?: number }
) {
  const retries = Math.max(0, options?.retries ?? 0);
  const retryDelayMs = Math.max(250, options?.retryDelayMs ?? 1200);
  let lastError = 'Erro desconhecido ao finalizar checkout';

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const { data, error } = await supabase.functions.invoke('totem-checkout', {
        body: {
          action: 'finish',
          ...payload,
        },
      });

      if (error) throw error;
      if (data?.success === false) {
        throw new Error(data?.error || 'Falha ao finalizar checkout');
      }

      clearPendingServiceCheckout(payload.venda_id);
      return { success: true as const, data };
    } catch (error: any) {
      lastError = error?.message || lastError;
      console.error(`[ServiceCheckoutCompletion] Tentativa ${attempt + 1} falhou:`, error);

      if (attempt < retries) {
        await wait(retryDelayMs);
      }
    }
  }

  return { success: false as const, error: lastError };
}