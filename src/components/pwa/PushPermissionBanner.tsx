import React, { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  isPushSupported,
  isIOS,
  isStandalonePWA,
  subscribeToPush,
  type SubscribeOptions,
} from '@/lib/push/pushClient';

interface Props extends SubscribeOptions {
  /** chave usada em localStorage para não reabrir após dispensar */
  storageKey?: string;
}

const DISMISS_TTL_DAYS = 3;

function wasDismissedRecently(key: string): boolean {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return false;
    const ts = parseInt(raw, 10);
    if (!Number.isFinite(ts)) return false;
    const days = (Date.now() - ts) / (1000 * 60 * 60 * 24);
    return days < DISMISS_TTL_DAYS;
  } catch { return false; }
}

export const PushPermissionBanner: React.FC<Props> = ({
  role, cliente_id, barbeiro_id, staff_id,
  storageKey = `push-banner-dismissed-${role}`,
}) => {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if (!isPushSupported()) return;
    if (Notification.permission === 'granted') return;
    if (Notification.permission === 'denied') return;
    if (wasDismissedRecently(storageKey)) return;

    // iOS: só faz sentido mostrar prompt se instalado como PWA
    if (isIOS() && !isStandalonePWA()) {
      setIosHint(true);
      setVisible(true);
      return;
    }
    setVisible(true);
  }, [storageKey]);

  if (!visible) return null;

  const handleEnable = async () => {
    setLoading(true);
    try {
      const res = await subscribeToPush({ role, cliente_id, barbeiro_id, staff_id });
      if (res.ok) {
        toast.success('🔔 Notificações ativadas!');
        setVisible(false);
      } else if (res.reason === 'denied') {
        toast.error('Permissão negada. Ative nas configurações do navegador.');
        setVisible(false);
      } else if (res.reason === 'ios-not-installed') {
        toast.info('Adicione o app à Tela de Início primeiro.');
      } else if (res.reason === 'unsupported') {
        toast.error('Este navegador não suporta notificações push.');
        setVisible(false);
      } else {
        toast.error('Não foi possível ativar. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    try { localStorage.setItem(storageKey, String(Date.now())); } catch {}
    setVisible(false);
  };

  return (
    <div className="fixed left-3 right-3 top-3 z-[9999] mx-auto max-w-md rounded-2xl border border-urbana-gold/40 bg-black/95 p-4 shadow-2xl backdrop-blur"
         style={{ paddingTop: 'calc(env(safe-area-inset-top) + 16px)' }}>
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-urbana-gold/20 p-2">
          <Bell className="h-5 w-5 text-urbana-gold" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">
            Ativar notificações
          </p>
          <p className="mt-0.5 text-xs text-white/70 leading-relaxed">
            {iosHint
              ? 'Adicione o app à Tela de Início (Compartilhar → Adicionar à Tela de Início) e depois toque em Ativar.'
              : role === 'cliente'
              ? 'Receba confirmações, lembretes e avisos de check-in do seu agendamento.'
              : role === 'barbeiro'
              ? 'Seja avisado de novos agendamentos, check-ins e cancelamentos em tempo real.'
              : 'Receba alertas de checkouts pendentes, falhas de pagamento e novos clientes.'}
          </p>
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              onClick={handleEnable}
              disabled={loading || iosHint}
              className="bg-urbana-gold text-black hover:bg-urbana-gold/90"
            >
              {loading ? 'Ativando…' : 'Ativar'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDismiss}
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              Agora não
            </Button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="rounded-full p-1 text-white/60 hover:bg-white/10 hover:text-white"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default PushPermissionBanner;