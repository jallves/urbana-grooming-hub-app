/**
 * Força refresh completo da aplicação limpando cache
 */
export const forceApplicationRefresh = () => {
  // Limpa localStorage
  localStorage.clear();
  
  // Limpa sessionStorage
  sessionStorage.clear();
  
  // Força reload sem cache
  window.location.reload();
};

/**
 * Força atualização do Service Worker
 */
export const forceServiceWorkerUpdate = async () => {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      await registration.unregister();
    }
    console.log('[Refresh] Service Workers removidos, forçando reload...');
    window.location.reload();
  }
};