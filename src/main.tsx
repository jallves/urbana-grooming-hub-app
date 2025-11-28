import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Sistema de atualização automática do PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      // Registra o PWA com atualização automática e imediata
      const { registerSW } = await import('virtual:pwa-register');
      
      const updateSW = registerSW({
        immediate: true,
        onNeedRefresh() {
          console.log('[PWA] 🔄 Nova versão detectada - Atualizando automaticamente...');
          
          // Mostra notificação visual rápida antes de recarregar
          const notification = document.createElement('div');
          notification.innerHTML = '🔄 Atualizando aplicação...';
          notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #DAA520;
            color: #000;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 600;
            z-index: 99999;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          `;
          document.body.appendChild(notification);
          
          // Aguarda 500ms e recarrega
          setTimeout(() => {
            window.location.reload();
          }, 500);
        },
        onOfflineReady() {
          console.log('[PWA] ✅ Aplicação pronta para uso offline');
        },
        onRegistered(registration) {
          console.log('[PWA] ✅ Service Worker registrado com sucesso');
          
          if (registration) {
            // Verifica atualizações a cada 30 segundos
            setInterval(() => {
              console.log('[PWA] 🔍 Verificando atualizações...');
              registration.update();
            }, 30000);
            
            // Verifica imediatamente ao registrar
            registration.update();
          }
        },
        onRegisterError(error) {
          console.error('[PWA] ❌ Erro ao registrar Service Worker:', error);
        }
      });

      // Força atualização quando a aba ganha foco
      document.addEventListener('visibilitychange', async () => {
        if (!document.hidden) {
          console.log('[PWA] 👁️ Aba ativa - Verificando atualizações...');
          const registration = await navigator.serviceWorker.getRegistration();
          if (registration) {
            registration.update();
          }
        }
      });

      // Verifica atualizações quando volta online
      window.addEventListener('online', async () => {
        console.log('[PWA] 🌐 Conexão restaurada - Verificando atualizações...');
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          registration.update();
        }
      });

    } catch (e) {
      console.error('[PWA] ❌ Erro na configuração do PWA:', e);
    }
  });
}

const container = document.getElementById("root");
const initialLoader = document.getElementById("initial-loader");

if (!container) {
  throw new Error("Root element not found");
}

// Remover o loading screen inicial quando o React carregar
if (initialLoader) {
  initialLoader.style.display = "none";
}

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
