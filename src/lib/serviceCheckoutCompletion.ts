import { supabase } from '@/integrations/supabase/client';

const STORAGE_KEY = 'pending_service_checkout_completion';

export interface ServiceCheckoutTransactionData {
  nsu?: string;
  autorizacao?: string;
  bandeira?: string;
  confirmationId?: string;
}

export interface ServiceCheckoutFinishPayload {
  venda_id?: string;
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
type PendingCheckoutLookup = string | Pick<ServiceCheckoutFinishPayload, 'venda_id' | 'agendamento_id' | 'session_id'> | null | undefined;

const canUseStorage = () => typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';

const getPendingCheckoutKeys = (lookup?: PendingCheckoutLookup): string[] => {
  if (!lookup) return [];

  if (typeof lookup === 'string') {
    return lookup ? [lookup] : [];
  }

  return Array.from(
    new Set([
      lookup.venda_id,
      lookup.agendamento_id,
      lookup.session_id,
    ].filter((value): value is string => Boolean(value)))
  );
};

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
  const keys = getPendingCheckoutKeys(payload);
  if (keys.length === 0) return;

  const pending = readPendingCheckouts();

  for (const key of keys) {
    pending[key] = payload;
  }

  writePendingCheckouts(pending);
};

export const getPendingServiceCheckout = (lookup?: PendingCheckoutLookup): ServiceCheckoutFinishPayload | null => {
  const keys = getPendingCheckoutKeys(lookup);
  if (keys.length === 0) return null;

  const pending = readPendingCheckouts();

  for (const key of keys) {
    if (pending[key]) {
      return pending[key];
    }
  }

  return null;
};

export const clearPendingServiceCheckout = (lookup?: PendingCheckoutLookup) => {
  const keys = getPendingCheckoutKeys(lookup);
  if (keys.length === 0) return;

  const pending = readPendingCheckouts();

  let hasChanges = false;

  for (const key of keys) {
    if (!pending[key]) continue;
    delete pending[key];
    hasChanges = true;
  }

  if (!hasChanges) return;
  writePendingCheckouts(pending);
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const ensureCheckoutVendaId = async (payload: ServiceCheckoutFinishPayload) => {
  if (payload.venda_id) return payload.venda_id;

  if (!payload.agendamento_id) {
    throw new Error('agendamento_id é obrigatório para recuperar a venda do checkout');
  }

  console.warn('[ServiceCheckoutCompletion] venda_id ausente; recuperando venda via totem-checkout/start');

  const { data, error } = await supabase.functions.invoke('totem-checkout', {
    body: {
      action: 'start',
      agendamento_id: payload.agendamento_id,
      session_id: payload.session_id,
      extras: payload.extras,
      products: payload.products,
    },
  });

  if (error) throw error;

  if (!data?.venda_id) {
    throw new Error('Não foi possível recuperar a venda do checkout');
  }

  return data.venda_id as string;
};

export async function finalizeServiceCheckout(
  payload: ServiceCheckoutFinishPayload,
  options?: { retries?: number; retryDelayMs?: number }
) {
  const retries = Math.max(0, options?.retries ?? 0);
  const retryDelayMs = Math.max(250, options?.retryDelayMs ?? 1200);
  let lastError = 'Erro desconhecido ao finalizar checkout';
  let currentPayload = payload;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const vendaId = await ensureCheckoutVendaId(currentPayload);

      if (currentPayload.venda_id !== vendaId) {
        currentPayload = { ...currentPayload, venda_id: vendaId };
        persistPendingServiceCheckout(currentPayload);
      }

      const { data, error } = await supabase.functions.invoke('totem-checkout', {
        body: {
          action: 'finish',
          ...currentPayload,
        },
      });

      if (error) throw error;
      if (data?.success === false) {
        throw new Error(data?.error || 'Falha ao finalizar checkout');
      }

      clearPendingServiceCheckout(currentPayload);
      return { success: true as const, data, venda_id: currentPayload.venda_id };
    } catch (error: any) {
      lastError = error?.message || lastError;
      console.error(`[ServiceCheckoutCompletion] Tentativa ${attempt + 1} falhou:`, error);

      if (attempt < retries) {
        await wait(retryDelayMs);
      }
    }
  }

  return { success: false as const, error: lastError, venda_id: currentPayload.venda_id };
}