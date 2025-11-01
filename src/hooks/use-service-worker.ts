import { useEffect, useState } from 'react';

export function useServiceWorker() {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queuedRequests, setQueuedRequests] = useState<number>(0);

  useEffect(() => {
    // Registrar service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('Service Worker registrado:', reg);
          setRegistration(reg);

          // Background Sync
          if ('sync' in reg) {
            console.log('Background Sync disponível');
          }
        })
        .catch((error) => {
          console.error('Erro ao registrar Service Worker:', error);
        });

      // Ouvir mensagens do SW
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('Mensagem do SW:', event.data);
        
        if (event.data.type === 'QUEUE_PROCESSED') {
          // Atualizar contador de fila
          updateQueueCount();
        }
      });
    }

    // Monitorar status online/offline
    const handleOnline = () => {
      console.log('Conexão restaurada');
      setIsOnline(true);
      // Tentar reprocessar fila
      retryQueue();
    };

    const handleOffline = () => {
      console.log('Sem conexão');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Atualizar contador de fila inicialmente
    updateQueueCount();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const retryQueue = async () => {
    if (registration && 'sync' in registration) {
      try {
        const syncManager = (registration as any).sync;
        if (syncManager) {
          await syncManager.register('retry-queued-requests');
          console.log('Background sync registrado');
        }
      } catch (error) {
        console.error('Erro ao registrar background sync:', error);
        // Fallback: enviar mensagem para SW
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'RETRY_QUEUE'
          });
        }
      }
    }
  };

  const updateQueueCount = async () => {
    try {
      const cache = await caches.open('totem-requests-queue');
      const keys = await cache.keys();
      setQueuedRequests(keys.length);
    } catch (error) {
      console.error('Erro ao contar fila:', error);
    }
  };

  return {
    registration,
    isOnline,
    queuedRequests,
    retryQueue,
    updateQueueCount
  };
}
