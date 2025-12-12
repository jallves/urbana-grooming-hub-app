import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bug, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTEFAndroid } from '@/hooks/useTEFAndroid';

/**
 * Botão flutuante de debug para o Totem
 * Aparece apenas quando há 5 toques rápidos no canto superior direito
 * ou pode ser habilitado permanentemente em modo desenvolvimento
 */
const TotemDebugButton: React.FC = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const [lastTapTime, setLastTapTime] = useState(0);
  
  const { isAndroidAvailable, isPinpadConnected } = useTEFAndroid();

  // Detectar 5 toques rápidos para mostrar botão de debug
  useEffect(() => {
    const handleTap = (e: TouchEvent | MouseEvent) => {
      const target = e.target as HTMLElement;
      const rect = document.body.getBoundingClientRect();
      
      // Coordenadas do toque/click
      let x: number, y: number;
      if ('touches' in e) {
        x = e.touches[0].clientX;
        y = e.touches[0].clientY;
      } else {
        x = e.clientX;
        y = e.clientY;
      }
      
      // Verificar se o toque é no canto superior direito (área de 100x100px)
      if (x > rect.width - 100 && y < 100) {
        const now = Date.now();
        
        // Se o último toque foi há menos de 500ms, incrementar contador
        if (now - lastTapTime < 500) {
          setTapCount(prev => prev + 1);
        } else {
          setTapCount(1);
        }
        
        setLastTapTime(now);
      }
    };

    window.addEventListener('touchstart', handleTap);
    window.addEventListener('click', handleTap);

    return () => {
      window.removeEventListener('touchstart', handleTap);
      window.removeEventListener('click', handleTap);
    };
  }, [lastTapTime]);

  // Mostrar botão quando atingir 5 toques
  useEffect(() => {
    if (tapCount >= 5) {
      setIsVisible(true);
      setTapCount(0);
    }
  }, [tapCount]);

  // Também mostrar se estamos em desenvolvimento ou se TEF não está disponível
  useEffect(() => {
    // Se window.TEF não existe, mostrar botão de debug automaticamente após 3 segundos
    const timeout = setTimeout(() => {
      // @ts-ignore
      if (typeof window.TEF === 'undefined') {
        setIsVisible(true);
      }
    }, 3000);

    return () => clearTimeout(timeout);
  }, []);

  if (!isVisible) {
    return null;
  }

  const getStatusColor = () => {
    if (!isAndroidAvailable) return 'bg-red-500';
    if (!isPinpadConnected) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 items-end">
      {/* Status Indicator */}
      <div className="flex items-center gap-2 bg-gray-800/90 rounded-full px-3 py-1 text-xs text-white">
        <div className={`w-2 h-2 rounded-full ${getStatusColor()} animate-pulse`} />
        <span>
          {!isAndroidAvailable ? 'TEF Offline' : !isPinpadConnected ? 'Pinpad Off' : 'TEF OK'}
        </span>
      </div>

      {/* Debug Button */}
      <div className="flex gap-2">
        <Button
          onClick={() => navigate('/totem/debug')}
          className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg rounded-full h-12 w-12 p-0"
        >
          <Bug className="h-5 w-5" />
        </Button>
        <Button
          onClick={() => setIsVisible(false)}
          variant="ghost"
          className="bg-gray-800/90 text-white rounded-full h-12 w-12 p-0"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default TotemDebugButton;
