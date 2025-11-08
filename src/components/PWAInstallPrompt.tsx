import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, X } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';
import { useNavigate } from 'react-router-dom';

/**
 * Prompt flutuante para instalação do PWA
 * Aparece apenas quando o app pode ser instalado e ainda não foi
 */
export const PWAInstallPrompt: React.FC = () => {
  const { canInstall, isInstalled, installApp } = usePWA();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar se o usuário já dispensou o prompt
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      setIsDismissed(true);
      return;
    }

    // Mostrar o prompt após 10 segundos se pode instalar e não está instalado
    if (canInstall && !isInstalled) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [canInstall, isInstalled]);

  const handleInstall = async () => {
    const success = await installApp();
    if (success) {
      setIsVisible(false);
    } else {
      // Se não conseguiu instalar automaticamente, redirecionar para página de instruções
      navigate('/pwa-install');
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!isVisible || isDismissed || isInstalled) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-slide-up">
      <Card className="bg-urbana-black-soft/95 backdrop-blur-xl border-2 border-urbana-gold/50 p-4 shadow-2xl shadow-urbana-gold/20">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 text-urbana-light/60 hover:text-urbana-light"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-urbana-gold/20 flex items-center justify-center">
              <Download className="w-5 h-5 text-urbana-gold" />
            </div>
            <div>
              <h3 className="font-bold text-urbana-light">
                Instalar App
              </h3>
              <p className="text-xs text-urbana-light/60">
                Acesso rápido e offline
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleInstall}
              size="sm"
              className="flex-1 bg-urbana-gold text-urbana-black hover:bg-urbana-gold-light font-semibold"
            >
              Instalar
            </Button>
            <Button
              onClick={handleDismiss}
              size="sm"
              variant="ghost"
              className="text-urbana-light/60 hover:text-urbana-light"
            >
              Agora não
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
