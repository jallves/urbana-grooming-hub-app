import React, { useState, useEffect } from 'react';
import { X, Download, Share, Plus, MoreVertical, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWA } from '@/hooks/usePWA';
import costaUrbanaLogo from '@/assets/logo-costa-urbana.png';

interface PWAInstallBannerProps {
  context: 'cliente' | 'barbeiro';
}

const PWAInstallBanner: React.FC<PWAInstallBannerProps> = ({ context }) => {
  const { canInstall, isInstalled, isIOS, isAndroid, installApp } = usePWA();
  const [isVisible, setIsVisible] = useState(false);

  const storageKey = `pwa-install-banner-dismissed-${context}`;

  useEffect(() => {
    // Só mostra se pode instalar, não está instalado e não foi dispensado nesta sessão
    const dismissed = sessionStorage.getItem(storageKey);
    if (dismissed) return;

    if (canInstall && !isInstalled) {
      const timer = setTimeout(() => setIsVisible(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [canInstall, isInstalled, storageKey]);

  const handleInstall = async () => {
    const success = await installApp();
    if (success) {
      setIsVisible(false);
    }
    // Se iOS, não fecha — mostra as instruções
  };

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem(storageKey, 'true');
  };

  if (!isVisible || isInstalled) return null;

  const contextLabel = context === 'cliente' ? 'Cliente' : 'Barbeiro';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl border border-urbana-gold/40"
           style={{ background: 'linear-gradient(180deg, #1A1410 0%, #0D0B08 100%)' }}>
        
        {/* Botão fechar */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          aria-label="Fechar"
        >
          <X className="w-4 h-4 text-urbana-light/80" />
        </button>

        {/* Header com logo */}
        <div className="flex flex-col items-center pt-6 pb-4 px-6">
          <div className="w-20 h-20 rounded-2xl overflow-hidden mb-3 shadow-lg shadow-urbana-gold/30 border-2 border-urbana-gold/50">
            <img src={costaUrbanaLogo} alt="Costa Urbana" className="w-full h-full object-cover" />
          </div>
          <h2 className="text-lg font-bold text-urbana-gold text-center">
            Instale o App Costa Urbana
          </h2>
          <p className="text-sm text-urbana-light/70 text-center mt-1">
            Painel do {contextLabel}
          </p>
        </div>

        {/* Benefícios */}
        <div className="px-6 pb-4">
          <div className="space-y-2">
            {[
              { emoji: '⚡', text: 'Acesso rápido direto da tela inicial' },
              { emoji: '🔔', text: 'Receba notificações em tempo real' },
              { emoji: '📱', text: 'Experiência completa como um app nativo' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 bg-white/5 rounded-lg px-3 py-2.5">
                <span className="text-base">{item.emoji}</span>
                <span className="text-sm text-urbana-light/90">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Instruções específicas por plataforma */}
        <div className="px-6 pb-5">
          {isIOS ? (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-urbana-gold/90 uppercase tracking-wider text-center">
                Como instalar no iPhone / iPad
              </p>
              <div className="bg-white/5 rounded-xl p-4 space-y-3">
                <Step number={1}>
                  Toque no ícone <Share className="inline w-4 h-4 text-blue-400 mx-1 -mt-0.5" /> 
                  <span className="text-urbana-light font-medium">Compartilhar</span> na barra do Safari
                </Step>
                <Step number={2}>
                  Role para baixo e toque em{' '}
                  <span className="inline-flex items-center gap-1 text-urbana-light font-medium">
                    <Plus className="w-3.5 h-3.5" /> Adicionar à Tela de Início
                  </span>
                </Step>
                <Step number={3}>
                  Toque em <span className="text-urbana-light font-medium">Adicionar</span> no canto superior direito
                </Step>
              </div>
              <Button
                onClick={handleDismiss}
                className="w-full bg-urbana-gold hover:bg-urbana-gold-light text-urbana-black font-bold py-5 text-sm rounded-xl"
              >
                Entendi!
              </Button>
            </div>
          ) : isAndroid ? (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-urbana-gold/90 uppercase tracking-wider text-center">
                Como instalar no Android
              </p>
              <div className="bg-white/5 rounded-xl p-4 space-y-3">
                <Step number={1}>
                  Toque no botão abaixo <span className="text-urbana-light font-medium">Instalar Aplicativo</span>
                </Step>
                <Step number={2}>
                  Na janela que aparecer, toque em <span className="text-urbana-light font-medium">Instalar</span>
                </Step>
                <Step number={3}>
                  O app aparecerá na sua <span className="text-urbana-light font-medium">tela inicial</span>{' '}
                  <Smartphone className="inline w-4 h-4 text-urbana-gold mx-0.5 -mt-0.5" />
                </Step>
              </div>
              <Button
                onClick={handleInstall}
                className="w-full bg-urbana-gold hover:bg-urbana-gold-light text-urbana-black font-bold py-5 text-sm rounded-xl"
              >
                <Download className="w-4 h-4 mr-2" />
                Instalar Aplicativo
              </Button>
            </div>
          ) : (
            /* Desktop ou outro — botão genérico */
            <div className="space-y-3">
              <Button
                onClick={handleInstall}
                className="w-full bg-urbana-gold hover:bg-urbana-gold-light text-urbana-black font-bold py-5 text-sm rounded-xl"
              >
                <Download className="w-4 h-4 mr-2" />
                Instalar Aplicativo
              </Button>
            </div>
          )}

          <button
            onClick={handleDismiss}
            className="w-full mt-3 text-center text-xs text-urbana-light/40 hover:text-urbana-light/60 transition-colors py-1"
          >
            Agora não, obrigado
          </button>
        </div>
      </div>
    </div>
  );
};

const Step: React.FC<{ number: number; children: React.ReactNode }> = ({ number, children }) => (
  <div className="flex items-start gap-3">
    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-urbana-gold/20 text-urbana-gold text-xs font-bold flex items-center justify-center mt-0.5">
      {number}
    </span>
    <p className="text-sm text-urbana-light/70 leading-relaxed">{children}</p>
  </div>
);

export default PWAInstallBanner;
