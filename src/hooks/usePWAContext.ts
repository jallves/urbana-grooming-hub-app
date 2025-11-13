import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { detectPWAContext, getPWAManifest, type PWAContext, type PWAManifest } from '@/config/pwa-manifests';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const usePWAContext = () => {
  const location = useLocation();
  const [context, setContext] = useState<PWAContext>('public');
  const [manifest, setManifest] = useState<PWAManifest>(getPWAManifest('public'));
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    const newContext = detectPWAContext(location.pathname);
    setContext(newContext);
    setManifest(getPWAManifest(newContext));

    // Atualizar o manifest link dinamicamente
    updateManifestLink(newContext);
  }, [location.pathname]);

  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent);
    const android = /android/.test(userAgent);
    
    setIsIOS(ios);
    setIsAndroid(android);

    // Verificar se já está instalado
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsInstalled(isStandalone);

    // Capturar evento de instalação
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // iOS não dispara esse evento
    if (ios && !isStandalone) {
      setCanInstall(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const updateManifestLink = (ctx: PWAContext) => {
    // Remover manifest link existente
    const existingLink = document.querySelector('link[rel="manifest"]');
    if (existingLink) {
      existingLink.remove();
    }

    // Criar novo manifest dinamicamente
    const manifestData = getPWAManifest(ctx);
    const manifestBlob = new Blob([JSON.stringify(manifestData)], { type: 'application/json' });
    const manifestURL = URL.createObjectURL(manifestBlob);

    const link = document.createElement('link');
    link.rel = 'manifest';
    link.href = manifestURL;
    document.head.appendChild(link);

    // Atualizar theme-color
    let themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (!themeColorMeta) {
      themeColorMeta = document.createElement('meta');
      themeColorMeta.setAttribute('name', 'theme-color');
      document.head.appendChild(themeColorMeta);
    }
    themeColorMeta.setAttribute('content', manifestData.theme_color);
  };

  const installApp = async () => {
    if (!deferredPrompt) {
      if (isIOS) {
        window.location.href = `/install/${context}`;
      }
      return false;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        setIsInstalled(true);
        setCanInstall(false);
        return true;
      }

      setDeferredPrompt(null);
      return false;
    } catch (error) {
      console.error('Error installing PWA:', error);
      return false;
    }
  };

  return {
    context,
    manifest,
    deferredPrompt,
    isInstalled,
    isIOS,
    isAndroid,
    canInstall,
    installApp,
  };
};
