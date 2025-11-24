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
    <div className="min-h-screen bg-gradient-to-br from-urbana-black via-urbana-brown/30 to-urbana-black flex items-center justify-center p-3 sm:p-4 font-poppins">
      <div className="max-w-4xl w-full space-y-5 sm:space-y-8">
        {/* Header */}
        <div className="text-center space-y-3 sm:space-y-4">
          <div className="flex justify-center">
            <img 
              src={costaUrbanaLogo} 
              alt="Costa Urbana Logo" 
              className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 object-contain drop-shadow-2xl"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-urbana-gold-vibrant via-urbana-gold to-urbana-gold-light px-2">
            Instale o App Costa Urbana
          </h1>
          <p className="text-base sm:text-lg text-urbana-light/70 px-2">
            Acesse rapidamente e tenha uma experiência como um app nativo
          </p>
        </div>

        {/* Install Status */}
        {isInstalled ? (
          <Card className="p-4 sm:p-6 bg-gradient-to-br from-emerald-500/20 to-green-500/20 border-2 border-emerald-500/50">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <Check className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-400" />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-emerald-400">App já instalado!</h3>
                <p className="text-sm sm:text-base text-urbana-light/70">Você pode encontrá-lo na tela inicial do seu dispositivo</p>
              </div>
            </div>
          </Card>
        ) : (
          <>
            {/* Desktop/Android Install Button */}
            {deferredPrompt && (
              <Card className="p-5 sm:p-6 md:p-8 bg-urbana-black-soft/50 backdrop-blur-sm border-2 border-urbana-gold/30">
                <div className="text-center space-y-4 sm:space-y-6">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-2xl bg-gradient-to-br from-urbana-gold to-urbana-gold-dark flex items-center justify-center">
                    <Download className="w-8 h-8 sm:w-10 sm:h-10 text-urbana-black" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-urbana-light mb-1 sm:mb-2">
                      Instalar Agora
                    </h3>
                    <p className="text-sm sm:text-base text-urbana-light/60">
                      Clique no botão abaixo para instalar o app
                    </p>
                  </div>
                  <Button
                    onClick={handleInstallClick}
                    className="w-full h-12 sm:h-14 md:h-16 text-base sm:text-lg md:text-xl font-bold bg-gradient-to-r from-urbana-gold to-urbana-gold-dark text-urbana-black hover:from-urbana-gold-dark hover:to-urbana-gold"
                  >
                    <Download className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
                    INSTALAR APP
                  </Button>
                </div>
              </Card>
            )}

            {/* Manual Instructions */}
            <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
              {/* iOS Instructions */}
              <Card className="p-4 sm:p-5 md:p-6 bg-urbana-black-soft/50 backdrop-blur-sm border-2 border-urbana-gray/30">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center flex-shrink-0">
                      <Smartphone className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-urbana-light">iPhone/iPad</h3>
                  </div>

                  <ol className="space-y-2.5 sm:space-y-3 text-urbana-light/70 text-sm sm:text-base">
                    <li className="flex items-start gap-2 sm:gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-urbana-gold/20 flex items-center justify-center text-xs sm:text-sm font-bold text-urbana-gold">
                        1
                      </span>
                      <span>Abra este site no Safari</span>
                    </li>
                    <li className="flex items-start gap-2 sm:gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-urbana-gold/20 flex items-center justify-center text-xs sm:text-sm font-bold text-urbana-gold">
                        2
                      </span>
                      <div>
                        <span>Toque no botão de compartilhar</span>
                        <Share2 className="w-4 h-4 sm:w-5 sm:h-5 text-urbana-gold inline ml-1 sm:ml-2" />
                      </div>
                    </li>
                    <li className="flex items-start gap-2 sm:gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-urbana-gold/20 flex items-center justify-center text-xs sm:text-sm font-bold text-urbana-gold">
                        3
                      </span>
                      <div>
                        <span>Selecione "Adicionar à Tela Inicial"</span>
                        <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-urbana-gold inline ml-1 sm:ml-2" />
                      </div>
                    </li>
                    <li className="flex items-start gap-2 sm:gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-urbana-gold/20 flex items-center justify-center text-xs sm:text-sm font-bold text-urbana-gold">
                        4
                      </span>
                      <span>Toque em "Adicionar"</span>
                    </li>
                  </ol>
                </div>
              </Card>

              {/* Android Instructions */}
              <Card className="p-4 sm:p-5 md:p-6 bg-urbana-black-soft/50 backdrop-blur-sm border-2 border-urbana-gray/30">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center flex-shrink-0">
                      <Smartphone className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-urbana-light">Android</h3>
                  </div>

                  <ol className="space-y-2.5 sm:space-y-3 text-urbana-light/70 text-sm sm:text-base">
                    <li className="flex items-start gap-2 sm:gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-urbana-gold/20 flex items-center justify-center text-xs sm:text-sm font-bold text-urbana-gold">
                        1
                      </span>
                      <span>Abra este site no Chrome</span>
                    </li>
                    <li className="flex items-start gap-2 sm:gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-urbana-gold/20 flex items-center justify-center text-xs sm:text-sm font-bold text-urbana-gold">
                        2
                      </span>
                      <span>Toque no menu (⋮) no canto superior direito</span>
                    </li>
                    <li className="flex items-start gap-2 sm:gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-urbana-gold/20 flex items-center justify-center text-xs sm:text-sm font-bold text-urbana-gold">
                        3
                      </span>
                      <div>
                        <span>Selecione "Instalar app" ou "Adicionar à tela inicial"</span>
                        <Download className="w-4 h-4 sm:w-5 sm:h-5 text-urbana-gold inline ml-1 sm:ml-2" />
                      </div>
                    </li>
                    <li className="flex items-start gap-2 sm:gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-urbana-gold/20 flex items-center justify-center text-xs sm:text-sm font-bold text-urbana-gold">
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
        <Card className="p-5 sm:p-6 md:p-8 bg-gradient-to-br from-urbana-black-soft/80 to-urbana-black/90 backdrop-blur-sm border-2 border-urbana-gold/30">
          <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-urbana-light mb-4 sm:mb-6 text-center">
            Benefícios do App Instalado
          </h3>
          <div className="grid sm:grid-cols-3 gap-4 sm:gap-6">
            <div className="text-center space-y-2 sm:space-y-3">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mx-auto rounded-2xl bg-urbana-gold/10 flex items-center justify-center">
                <Download className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-urbana-gold" />
              </div>
              <h4 className="font-bold text-urbana-light text-sm sm:text-base">Acesso Rápido</h4>
              <p className="text-xs sm:text-sm text-urbana-light/60">
                Ícone direto na tela inicial do seu celular
              </p>
            </div>
            <div className="text-center space-y-2 sm:space-y-3">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mx-auto rounded-2xl bg-urbana-gold/10 flex items-center justify-center">
                <Smartphone className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-urbana-gold" />
              </div>
              <h4 className="font-bold text-urbana-light text-sm sm:text-base">Modo App</h4>
              <p className="text-xs sm:text-sm text-urbana-light/60">
                Interface completa sem barras do navegador
              </p>
            </div>
            <div className="text-center space-y-2 sm:space-y-3">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mx-auto rounded-2xl bg-urbana-gold/10 flex items-center justify-center">
                <Check className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-urbana-gold" />
              </div>
              <h4 className="font-bold text-urbana-light text-sm sm:text-base">Performance</h4>
              <p className="text-xs sm:text-sm text-urbana-light/60">
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
