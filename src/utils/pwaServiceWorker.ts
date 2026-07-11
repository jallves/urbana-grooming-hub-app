const APP_SERVICE_WORKER_PATHS = ['/sw.js', '/service-worker.js'];

function isLovablePreviewHost(hostname: string) {
  return (
    hostname.startsWith('id-preview--') ||
    hostname.startsWith('preview--') ||
    hostname === 'lovableproject.com' ||
    hostname.endsWith('.lovableproject.com') ||
    hostname === 'lovableproject-dev.com' ||
    hostname.endsWith('.lovableproject-dev.com') ||
    hostname === 'beta.lovable.dev' ||
    hostname.endsWith('.beta.lovable.dev')
  );
}

function isAppShellServiceWorker(registration: ServiceWorkerRegistration) {
  const scriptUrl = registration.active?.scriptURL || registration.installing?.scriptURL || registration.waiting?.scriptURL || '';
  return APP_SERVICE_WORKER_PATHS.some((path) => scriptUrl.endsWith(path));
}

export async function cleanupLegacyAppServiceWorkers() {
  if (!('serviceWorker' in navigator)) return;

  const shouldCleanup =
    !import.meta.env.PROD ||
    window.self !== window.top ||
    isLovablePreviewHost(window.location.hostname) ||
    new URLSearchParams(window.location.search).get('sw') === 'off';

  if (!shouldCleanup) return;

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.allSettled(
      registrations
        .filter(isAppShellServiceWorker)
        .map((registration) => registration.unregister()),
    );

    if (window.caches) {
      const cacheNames = await caches.keys();
      await Promise.allSettled(
        cacheNames
          .filter((name) => /(^|-)precache-v\d+-|(^|-)runtime-|(^|-)googleAnalytics-|^workbox-|^totem-|^api-cache$|^images-cache$/.test(name))
          .map((name) => caches.delete(name)),
      );
    }
  } catch (error) {
    console.warn('[PWA] Não foi possível limpar service workers antigos:', error);
  }
}