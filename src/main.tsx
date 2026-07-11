import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { cleanupLegacyAppServiceWorkers } from './utils/pwaServiceWorker';

cleanupLegacyAppServiceWorkers();

const container = document.getElementById("root");
const initialLoader = document.getElementById("initial-loader");

if (!container) {
  throw new Error("Root element not found");
}

// Aguardar 1 segundo antes de remover o loading inicial para garantir que o React carregou
setTimeout(() => {
  if (initialLoader) {
    initialLoader.style.transition = "opacity 0.3s ease-out";
    initialLoader.style.opacity = "0";
    setTimeout(() => {
      initialLoader.style.display = "none";
    }, 300);
  }
}, 1000);

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
