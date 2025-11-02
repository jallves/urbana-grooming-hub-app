import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, Smartphone, Share2, Plus, Check } from 'lucide-react';
import costaUrbanaLogo from '@/assets/costa-urbana-logo.png';

const Install: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Capture the beforeinstallprompt event
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
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
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-urbana-black via-urbana-brown/30 to-urbana-black flex items-center justify-center p-4 font-poppins">
      <div className="max-w-4xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <img 
              src={costaUrbanaLogo} 
              alt="Costa Urbana Logo" 
              className="w-32 h-32 object-contain drop-shadow-2xl"
            />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-urbana-gold-vibrant via-urbana-gold to-urbana-gold-light">
            Instale o App Costa Urbana
          </h1>
          <p className="text-lg text-urbana-light/70">
            Acesse rapidamente e tenha uma experiência como um app nativo
          </p>
        </div>

        {/* Install Status */}
        {isInstalled ? (
          <Card className="p-6 bg-gradient-to-br from-emerald-500/20 to-green-500/20 border-2 border-emerald-500/50">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Check className="w-8 h-8 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-emerald-400">App já instalado!</h3>
                <p className="text-urbana-light/70">Você pode encontrá-lo na tela inicial do seu dispositivo</p>
              </div>
            </div>
          </Card>
        ) : (
          <>
            {/* Desktop/Android Install Button */}
            {deferredPrompt && (
              <Card className="p-8 bg-urbana-black-soft/50 backdrop-blur-sm border-2 border-urbana-gold/30">
                <div className="text-center space-y-6">
                  <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-urbana-gold to-urbana-gold-dark flex items-center justify-center">
                    <Download className="w-10 h-10 text-urbana-black" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-urbana-light mb-2">
                      Instalar Agora
                    </h3>
                    <p className="text-urbana-light/60">
                      Clique no botão abaixo para instalar o app
                    </p>
                  </div>
                  <Button
                    onClick={handleInstallClick}
                    className="w-full h-16 text-xl font-bold bg-gradient-to-r from-urbana-gold to-urbana-gold-dark text-urbana-black hover:from-urbana-gold-dark hover:to-urbana-gold"
                  >
                    <Download className="w-6 h-6 mr-3" />
                    INSTALAR APP
                  </Button>
                </div>
              </Card>
            )}

            {/* Manual Instructions */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* iOS Instructions */}
              <Card className="p-6 bg-urbana-black-soft/50 backdrop-blur-sm border-2 border-urbana-gray/30">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
                      <Smartphone className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-urbana-light">iPhone/iPad</h3>
                  </div>

                  <ol className="space-y-3 text-urbana-light/70">
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-urbana-gold/20 flex items-center justify-center text-sm font-bold text-urbana-gold">
                        1
                      </span>
                      <span>Abra este site no Safari</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-urbana-gold/20 flex items-center justify-center text-sm font-bold text-urbana-gold">
                        2
                      </span>
                      <div>
                        <span>Toque no botão de compartilhar</span>
                        <Share2 className="w-5 h-5 text-urbana-gold inline ml-2" />
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-urbana-gold/20 flex items-center justify-center text-sm font-bold text-urbana-gold">
                        3
                      </span>
                      <div>
                        <span>Selecione "Adicionar à Tela Inicial"</span>
                        <Plus className="w-5 h-5 text-urbana-gold inline ml-2" />
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-urbana-gold/20 flex items-center justify-center text-sm font-bold text-urbana-gold">
                        4
                      </span>
                      <span>Toque em "Adicionar"</span>
                    </li>
                  </ol>
                </div>
              </Card>

              {/* Android Instructions */}
              <Card className="p-6 bg-urbana-black-soft/50 backdrop-blur-sm border-2 border-urbana-gray/30">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                      <Smartphone className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-urbana-light">Android</h3>
                  </div>

                  <ol className="space-y-3 text-urbana-light/70">
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-urbana-gold/20 flex items-center justify-center text-sm font-bold text-urbana-gold">
                        1
                      </span>
                      <span>Abra este site no Chrome</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-urbana-gold/20 flex items-center justify-center text-sm font-bold text-urbana-gold">
                        2
                      </span>
                      <span>Toque no menu (⋮) no canto superior direito</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-urbana-gold/20 flex items-center justify-center text-sm font-bold text-urbana-gold">
                        3
                      </span>
                      <div>
                        <span>Selecione "Instalar app" ou "Adicionar à tela inicial"</span>
                        <Download className="w-5 h-5 text-urbana-gold inline ml-2" />
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-urbana-gold/20 flex items-center justify-center text-sm font-bold text-urbana-gold">
                        4
                      </span>
                      <span>Confirme tocando em "Instalar"</span>
                    </li>
                  </ol>
                </div>
              </Card>
            </div>
          </>
        )}

        {/* Benefits */}
        <Card className="p-8 bg-gradient-to-br from-urbana-black-soft/80 to-urbana-black/90 backdrop-blur-sm border-2 border-urbana-gold/30">
          <h3 className="text-2xl font-bold text-urbana-light mb-6 text-center">
            Benefícios do App Instalado
          </h3>
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-urbana-gold/10 flex items-center justify-center">
                <Download className="w-8 h-8 text-urbana-gold" />
              </div>
              <h4 className="font-bold text-urbana-light">Acesso Rápido</h4>
              <p className="text-sm text-urbana-light/60">
                Ícone direto na tela inicial do seu celular
              </p>
            </div>
            <div className="text-center space-y-3">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-urbana-gold/10 flex items-center justify-center">
                <Smartphone className="w-8 h-8 text-urbana-gold" />
              </div>
              <h4 className="font-bold text-urbana-light">Modo App</h4>
              <p className="text-sm text-urbana-light/60">
                Interface completa sem barras do navegador
              </p>
            </div>
            <div className="text-center space-y-3">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-urbana-gold/10 flex items-center justify-center">
                <Check className="w-8 h-8 text-urbana-gold" />
              </div>
              <h4 className="font-bold text-urbana-light">Performance</h4>
              <p className="text-sm text-urbana-light/60">
                Carregamento mais rápido e experiência fluida
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Install;
