import React, { useState, useEffect } from 'react';
import { Download, Smartphone, CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const InstallPWA: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    // Detecta se o app já está instalado
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Captura o evento de instalação
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
    }

    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-urbana-black via-urbana-brown/20 to-urbana-black flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full bg-urbana-black/40 backdrop-blur-2xl border-urbana-gold/20">
        <CardContent className="p-6 sm:p-8 md:p-10">
          <div className="text-center mb-8">
            <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 bg-gradient-to-br from-urbana-gold/20 to-urbana-gold-vibrant/10 rounded-3xl flex items-center justify-center border-2 border-urbana-gold/30">
              <Smartphone className="h-10 w-10 sm:h-12 sm:w-12 text-urbana-gold" />
            </div>
            
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-urbana-light mb-4">
              {isInstalled ? 'App Instalado!' : 'Instale Nosso App'}
            </h1>
            
            <p className="text-sm sm:text-base text-urbana-light/70 max-w-lg mx-auto">
              {isInstalled 
                ? 'Obrigado por instalar nosso app! Você pode acessá-lo diretamente da sua tela inicial.' 
                : 'Tenha acesso rápido e offline à Barbearia Costa Urbana. Instale agora e aproveite uma experiência nativa no seu dispositivo.'
              }
            </p>
          </div>

          {isInstalled ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                <CheckCircle className="h-6 w-6 text-green-400 flex-shrink-0" />
                <p className="text-sm text-green-300">App instalado com sucesso!</p>
              </div>
              
              <Button
                onClick={() => window.location.href = '/'}
                className="w-full bg-urbana-gold text-urbana-black hover:bg-urbana-gold/90 h-12"
              >
                Ir para o App
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          ) : isInstallable ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-urbana-black/30 rounded-xl border border-urbana-gold/10">
                  <Download className="h-6 w-6 text-urbana-gold mx-auto mb-2" />
                  <p className="text-xs text-urbana-light/70">Acesso Rápido</p>
                </div>
                <div className="text-center p-4 bg-urbana-black/30 rounded-xl border border-urbana-gold/10">
                  <Smartphone className="h-6 w-6 text-urbana-gold mx-auto mb-2" />
                  <p className="text-xs text-urbana-light/70">Modo Offline</p>
                </div>
                <div className="text-center p-4 bg-urbana-black/30 rounded-xl border border-urbana-gold/10">
                  <CheckCircle className="h-6 w-6 text-urbana-gold mx-auto mb-2" />
                  <p className="text-xs text-urbana-light/70">Sem Anúncios</p>
                </div>
              </div>

              <Button
                onClick={handleInstallClick}
                className="w-full bg-urbana-gold text-urbana-black hover:bg-urbana-gold/90 h-12 text-base font-semibold"
              >
                <Download className="mr-2 h-5 w-5" />
                Instalar Agora
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                <h3 className="text-sm font-semibold text-blue-300 mb-3">Como Instalar:</h3>
                <div className="space-y-2 text-xs sm:text-sm text-blue-200">
                  <p><strong>iPhone/iPad:</strong> Toque em <strong>Compartilhar (📤)</strong> → <strong>"Adicionar à Tela Inicial"</strong></p>
                  <p><strong>Android:</strong> Toque no <strong>menu (⋮)</strong> → <strong>"Instalar app"</strong> ou <strong>"Adicionar à tela inicial"</strong></p>
                  <p><strong>Desktop:</strong> Clique no ícone de instalação na barra de endereço ou no menu do navegador</p>
                </div>
              </div>

              <Button
                onClick={() => window.location.href = '/'}
                variant="outline"
                className="w-full border-urbana-gold/30 text-urbana-light hover:bg-urbana-gold/10 h-12"
              >
                Continuar no Navegador
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InstallPWA;
