import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { toast } from '@/hooks/use-toast';

export function PWAUpdateManager() {
  const [isUpdating, setIsUpdating] = useState(false);

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(registration) {
      console.log('[PWA Manager] Service Worker registrado');
      
      // Verifica atualizações a cada 30 segundos
      if (registration) {
        setInterval(() => {
          registration.update();
        }, 30000);
      }
    },
    onRegisterError(error) {
      console.error('[PWA Manager] Erro:', error);
    },
  });

  useEffect(() => {
    if (needRefresh) {
      setIsUpdating(true);
      
      // Mostra toast de atualização
      toast({
        title: "🔄 Atualizando aplicação",
        description: "Nova versão detectada. Aplicando atualização...",
        duration: 2000,
      });

      // Aguarda 1 segundo e atualiza
      setTimeout(() => {
        updateServiceWorker(true);
      }, 1000);
    }
  }, [needRefresh, updateServiceWorker]);

  // Verifica quando a janela volta ao foco
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!document.hidden) {
        const registration = await navigator.serviceWorker?.getRegistration();
        if (registration) {
          registration.update();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Verifica quando volta online
  useEffect(() => {
    const handleOnline = async () => {
      const registration = await navigator.serviceWorker?.getRegistration();
      if (registration) {
        registration.update();
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  if (isUpdating) {
    return (
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
        }}
      >
        <div 
          style={{
            background: '#DAA520',
            color: '#000',
            padding: '24px 48px',
            borderRadius: '12px',
            fontSize: '18px',
            fontWeight: '600',
            textAlign: 'center',
          }}
        >
          <div style={{ marginBottom: '12px' }}>🔄</div>
          Atualizando aplicação...
        </div>
      </div>
    );
  }

  return null;
}
