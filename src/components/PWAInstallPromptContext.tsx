import React, { useState, useEffect } from 'react';
import { usePWAContext } from '@/hooks/usePWAContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';

const PWAInstallPromptContext: React.FC = () => {
  const { context, manifest, canInstall, isInstalled, installApp } = usePWAContext();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(`pwa-install-dismissed-${context}`);
    
    if (canInstall && !isInstalled && !dismissed) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [canInstall, isInstalled, context]);

  const handleInstall = async () => {
    const success = await installApp();
    if (success || !success) {
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    localStorage.setItem(`pwa-install-dismissed-${context}`, 'true');
  };

  if (!isVisible || isDismissed || isInstalled) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-in slide-in-from-bottom-5">
      <Card className="p-4 shadow-lg border-primary/20 bg-card">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted transition-colors"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>
        
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Download className="h-5 w-5 text-primary" />
          </div>
          
          <div className="flex-1">
            <h3 className="font-semibold text-sm mb-1">
              Instalar {manifest.short_name}
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              {manifest.description}
            </p>
            <Button 
              onClick={handleInstall}
              size="sm"
              className="w-full"
            >
              Instalar Aplicativo
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PWAInstallPromptContext;
