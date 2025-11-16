import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register service worker for PWA with immediate update
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      // Registra o PWA service worker
      const { registerSW } = await import('virtual:pwa-register');
      const updateSW = registerSW({
        immediate: true,
        onNeedRefresh() {
          updateSW(true);
        },
        onOfflineReady() {
          console.log('App pronto para funcionar offline');
        },
        onRegistered(registration) {
          if (registration) {
            registration.update();
          }
        }
      });

      // Registra o service worker customizado para push notifications
      if ('PushManager' in window) {
        const swRegistration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });
        console.log('Service Worker de notificações registrado:', swRegistration);
      }
    } catch (e) {
      console.log('PWA não disponível', e);
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
