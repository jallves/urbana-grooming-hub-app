import { supabase } from '@/integrations/supabase/client';

let cachedPublicKey: string | null = null;

export async function getVapidPublicKey(): Promise<string> {
  if (cachedPublicKey) return cachedPublicKey;
  const { data, error } = await supabase.functions.invoke('push-public-key', { method: 'POST' });
  if (error) throw error;
  cachedPublicKey = (data as any)?.publicKey || '';
  return cachedPublicKey;
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

export function isPushSupported(): boolean {
  return typeof window !== 'undefined'
    && 'serviceWorker' in navigator
    && 'PushManager' in window
    && 'Notification' in window;
}

export function isStandalonePWA(): boolean {
  if (typeof window === 'undefined') return false;
  const iosStandalone = (window.navigator as any).standalone === true;
  const displayStandalone = window.matchMedia?.('(display-mode: standalone)').matches;
  return !!(iosStandalone || displayStandalone);
}

export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iP(ad|hone|od)/.test(navigator.userAgent);
}

export async function registerPushServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isPushSupported()) return null;
  try {
    // Se já existe uma registration para /push-sw.js, reaproveita
    const existing = await navigator.serviceWorker.getRegistrations();
    for (const reg of existing) {
      const scriptURL = reg.active?.scriptURL || reg.installing?.scriptURL || reg.waiting?.scriptURL;
      if (scriptURL && scriptURL.endsWith('/push-sw.js')) {
        return reg;
      }
    }
    return await navigator.serviceWorker.register('/push-sw.js', { scope: '/' });
  } catch (e) {
    console.warn('[push] registrar service worker falhou', e);
    return null;
  }
}

export interface SubscribeOptions {
  role: 'cliente' | 'barbeiro' | 'admin';
  cliente_id?: string | null;
  barbeiro_id?: string | null;
  staff_id?: string | null;
}

export async function subscribeToPush(opts: SubscribeOptions): Promise<{ ok: boolean; reason?: string }> {
  if (!isPushSupported()) return { ok: false, reason: 'unsupported' };

  // iOS PWA só recebe push instalado na tela inicial
  if (isIOS() && !isStandalonePWA()) {
    return { ok: false, reason: 'ios-not-installed' };
  }

  const permission = Notification.permission === 'granted'
    ? 'granted'
    : await Notification.requestPermission();
  if (permission !== 'granted') return { ok: false, reason: 'denied' };

  const registration = await registerPushServiceWorker();
  if (!registration) return { ok: false, reason: 'no-sw' };

  const publicKey = await getVapidPublicKey();
  if (!publicKey) return { ok: false, reason: 'no-vapid-key' };

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey).buffer as ArrayBuffer,
    });
  }

  const json = subscription.toJSON();
  const endpoint = json.endpoint || subscription.endpoint;
  const p256dh = json.keys?.p256dh;
  const auth = json.keys?.auth;
  if (!endpoint || !p256dh || !auth) return { ok: false, reason: 'no-keys' };

  const { data: userData } = await supabase.auth.getUser();
  const user_id = userData?.user?.id || null;

  const record = {
    endpoint,
    p256dh,
    auth,
    user_id,
    role: opts.role,
    cliente_id: opts.cliente_id ?? null,
    barbeiro_id: opts.barbeiro_id ?? null,
    staff_id: opts.staff_id ?? null,
    user_agent: navigator.userAgent,
    active: true,
  };

  // Upsert por endpoint
  const { error } = await supabase
    .from('push_subscriptions')
    .upsert(record, { onConflict: 'endpoint' });
  if (error) {
    console.warn('[push] falha ao salvar subscription', error);
    return { ok: false, reason: 'db-error' };
  }

  return { ok: true };
}

export async function unsubscribeFromPush(): Promise<void> {
  if (!isPushSupported()) return;
  const regs = await navigator.serviceWorker.getRegistrations();
  for (const reg of regs) {
    const scriptURL = reg.active?.scriptURL || '';
    if (!scriptURL.endsWith('/push-sw.js')) continue;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await supabase.from('push_subscriptions').update({ active: false }).eq('endpoint', sub.endpoint);
      await sub.unsubscribe();
    }
  }
}