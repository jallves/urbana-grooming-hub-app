import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Smartphone, 
  Download, 
  Check, 
  Apple, 
  Chrome,
  Monitor,
  Tablet,
  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import costaUrbanaLogo from '@/assets/logo-costa-urbana.png';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PWAInstall: React.FC = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    // Detectar plataforma
    const userAgent = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent);
    const android = /android/.test(userAgent);
    
    setIsIOS(ios);
    setIsAndroid(android);

    // Verificar se já está instalado
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Capturar evento de instalação
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
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
  };

  const features = [
    {
      icon: Smartphone,
      title: 'Acesso Instantâneo',
      description: 'Ícone na tela inicial como um app nativo'
    },
    {
      icon: Download,
      title: 'Funciona Offline',
      description: 'Use mesmo sem conexão com internet'
    },
    {
      icon: Sparkles,
      title: 'Carregamento Rápido',
      description: 'Performance otimizada e experiência fluida'
    },
    {
      icon: Monitor,
      title: 'Multi-Plataforma',
      description: 'Funciona em celular, tablet e desktop'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-urbana-dark via-urbana-brown to-urbana-black flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-2xl space-y-4 sm:space-y-6">
        {/* Logo e Header */}
        <div className="text-center space-y-3 sm:space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute -inset-3 sm:-inset-4 bg-urbana-gold/20 rounded-full blur-2xl" />
              <img 
                src={costaUrbanaLogo} 
                alt="Costa Urbana Logo" 
                className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 object-contain drop-shadow-2xl"
              />
            </div>
          </div>
          
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-urbana-light mb-1 sm:mb-2 px-2">
              Instalar App
            </h1>
            <p className="text-base sm:text-lg text-urbana-light/70 px-2">
              Costa Urbana Barbearia
            </p>
          </div>
        </div>

        {/* Status Card */}
        {isInstalled && (
          <Card className="bg-green-500/10 border-2 border-green-500/30 p-4 sm:p-6">
            <div className="flex items-center gap-3 text-green-400">
              <Check className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm sm:text-base">App já instalado!</p>
                <p className="text-xs sm:text-sm text-green-400/80">
                  Você pode acessar pelo ícone na tela inicial
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index}
                className="bg-white/5 backdrop-blur-xl border-2 border-urbana-gold/30 p-3 sm:p-4 hover:border-urbana-gold/50 transition-all"
              >
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-urbana-gold/20 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-urbana-gold" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-urbana-light mb-0.5 sm:mb-1 text-sm sm:text-base">
                      {feature.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-urbana-light/60">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Install Instructions */}
        <Card className="bg-white/10 backdrop-blur-xl border-2 border-urbana-gold/40 p-4 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-bold text-urbana-gold mb-3 sm:mb-4 flex items-center gap-2">
            {isIOS && <Apple className="w-5 h-5 sm:w-6 sm:h-6" />}
            {isAndroid && <Chrome className="w-5 h-5 sm:w-6 sm:h-6" />}
            Como Instalar
          </h2>

          {/* Chrome/Android Instructions */}
          {!isIOS && deferredPrompt && (
            <div className="space-y-3 sm:space-y-4">
              <p className="text-urbana-light/80 text-sm sm:text-base">
                Clique no botão abaixo para instalar o app:
              </p>
              <Button
                onClick={handleInstallClick}
                size="lg"
                className="w-full h-12 sm:h-14 text-base sm:text-lg bg-gradient-to-r from-urbana-gold via-urbana-gold-vibrant to-urbana-gold text-urbana-black font-bold hover:shadow-xl"
              >
                <Download className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Instalar Agora
              </Button>
            </div>
          )}

          {/* iOS Instructions */}
          {isIOS && (
            <ol className="space-y-2.5 sm:space-y-3 text-urbana-light/80 text-sm sm:text-base">
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-urbana-gold text-urbana-black flex items-center justify-center text-xs sm:text-sm font-bold">
                  1
                </span>
                <span>
                  Toque no botão <strong className="text-urbana-gold">Compartilhar</strong> (quadrado com seta para cima)
                </span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-urbana-gold text-urbana-black flex items-center justify-center text-xs sm:text-sm font-bold">
                  2
                </span>
                <span>
                  Role para baixo e toque em <strong className="text-urbana-gold">"Adicionar à Tela de Início"</strong>
                </span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-urbana-gold text-urbana-black flex items-center justify-center text-xs sm:text-sm font-bold">
                  3
                </span>
                <span>
                  Toque em <strong className="text-urbana-gold">"Adicionar"</strong> no canto superior direito
                </span>
              </li>
            </ol>
          )}

          {/* Android Chrome Manual Instructions */}
          {isAndroid && !deferredPrompt && (
            <ol className="space-y-2.5 sm:space-y-3 text-urbana-light/80 text-sm sm:text-base">
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-urbana-gold text-urbana-black flex items-center justify-center text-xs sm:text-sm font-bold">
                  1
                </span>
                <span>
                  Toque nos <strong className="text-urbana-gold">três pontos</strong> no canto superior direito
                </span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-urbana-gold text-urbana-black flex items-center justify-center text-xs sm:text-sm font-bold">
                  2
                </span>
                <span>
                  Toque em <strong className="text-urbana-gold">"Instalar app"</strong> ou <strong className="text-urbana-gold">"Adicionar à tela inicial"</strong>
                </span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-urbana-gold text-urbana-black flex items-center justify-center text-xs sm:text-sm font-bold">
                  3
                </span>
                <span>
                  Confirme tocando em <strong className="text-urbana-gold">"Instalar"</strong>
                </span>
              </li>
            </ol>
          )}

          {/* Desktop Instructions */}
          {!isIOS && !isAndroid && (
            <div className="space-y-3">
              {deferredPrompt ? (
                <>
                  <p className="text-urbana-light/80 text-sm sm:text-base">
                    Clique no botão abaixo para instalar o app no seu computador:
                  </p>
                  <Button
                    onClick={handleInstallClick}
                    size="lg"
                    className="w-full h-12 sm:h-14 text-base sm:text-lg bg-gradient-to-r from-urbana-gold via-urbana-gold-vibrant to-urbana-gold text-urbana-black font-bold hover:shadow-xl"
                  >
                    <Download className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Instalar Agora
                  </Button>
                </>
              ) : (
                <p className="text-urbana-light/80 text-sm sm:text-base">
                  No Chrome desktop, procure pelo ícone de instalação <Download className="w-4 h-4 inline" /> na barra de endereços ou no menu (três pontos) → <strong className="text-urbana-gold">"Instalar Costa Urbana Barbearia"</strong>
                </p>
              )}
            </div>
          )}
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            size="lg"
            className="flex-1 h-11 sm:h-12 text-sm sm:text-base border-2 border-urbana-gold/30 text-urbana-light hover:bg-urbana-gold/10"
          >
            Voltar ao Site
          </Button>
          {isInstalled && (
            <Button
              onClick={() => navigate('/totem/login')}
              size="lg"
              className="flex-1 h-11 sm:h-12 text-sm sm:text-base bg-gradient-to-r from-urbana-gold via-urbana-gold-vibrant to-urbana-gold text-urbana-black font-bold"
            >
              Abrir Totem
            </Button>
          )}
        </div>

        {/* Info Footer */}
        <p className="text-center text-xs sm:text-sm text-urbana-light/40 px-2">
          O app funciona offline e ocupa pouco espaço no seu dispositivo
        </p>
      </div>
    </div>
  );
};

export default PWAInstall;
