import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register service worker for PWA with aggressive update
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      // Primeiro, limpa service workers antigos
      const registrations = await navigator.serviceWorker.getRegistrations();
      console.log('[PWA] Service Workers encontrados:', registrations.length);
      
      // Desregistra todos os SWs antigos
      for (const registration of registrations) {
        await registration.unregister();
        console.log('[PWA] Service Worker antigo removido');
      }

      // Aguarda um pouco para garantir que desregistrou
      await new Promise(resolve => setTimeout(resolve, 100));

      // Registra o PWA service worker
      const { registerSW } = await import('virtual:pwa-register');
      const updateSW = registerSW({
        immediate: true,
        onNeedRefresh() {
          console.log('[PWA] Nova versão disponível, atualizando...');
          updateSW(true);
        },
        onOfflineReady() {
          console.log('[PWA] App pronto para funcionar offline');
        },
        onRegistered(registration) {
          console.log('[PWA] Service Worker registrado');
          if (registration) {
            // Força checagem de atualização a cada 30 segundos
            setInterval(() => {
              registration.update();
            }, 30000);
          }
        },
        onRegisterError(error) {
          console.error('[PWA] Erro ao registrar SW:', error);
        }
      });

      // Registra o service worker customizado para push notifications
      if ('PushManager' in window) {
        const swRegistration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none', // Nunca usa cache para o SW
        });
        console.log('[PWA] Service Worker de notificações registrado');
        
        // Força atualização imediata
        swRegistration.update();
      }
    } catch (e) {
      console.error('[PWA] Erro:', e);
    }
  });
}

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element not found");
}

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
