import { useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface UseTotemTimeoutOptions {
  timeoutMinutes?: number;
  warningMinutes?: number;
  enabled?: boolean;
  onTimeout?: () => void;
}

/**
 * Hook para gerenciar timeout de inatividade no Totem
 * Fase 1: Segurança e UX
 */
export const useTotemTimeout = ({
  timeoutMinutes = 3,
  warningMinutes = 2.5,
  enabled = true,
  onTimeout,
}: UseTotemTimeoutOptions = {}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const timeoutRef = useRef<NodeJS.Timeout>();
  const warningRef = useRef<NodeJS.Timeout>();
  const lastActivityRef = useRef<number>(Date.now());

  const cleanup = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
  }, []);

  const handleTimeout = useCallback(() => {
    cleanup();
    
    if (onTimeout) {
      onTimeout();
    } else {
      toast({
        title: "Sessão expirada",
        description: "Retornando à tela inicial por inatividade",
        variant: "default",
      });
      navigate('/totem/home');
    }
  }, [cleanup, onTimeout, navigate, toast]);

  const showWarning = useCallback(() => {
    toast({
      title: "Atenção",
      description: "A sessão irá expirar em breve. Toque na tela para continuar.",
      duration: 10000,
    });
  }, [toast]);

  const resetTimeout = useCallback(() => {
    if (!enabled) return;

    cleanup();
    lastActivityRef.current = Date.now();

    // Warning timeout
    warningRef.current = setTimeout(() => {
      showWarning();
    }, warningMinutes * 60 * 1000);

    // Final timeout
    timeoutRef.current = setTimeout(() => {
      handleTimeout();
    }, timeoutMinutes * 60 * 1000);
  }, [enabled, cleanup, showWarning, handleTimeout, timeoutMinutes, warningMinutes]);

  useEffect(() => {
    if (!enabled) return;

    // Events que resetam o timeout
    const events = ['mousedown', 'touchstart', 'keydown', 'scroll'];
    
    events.forEach(event => {
      document.addEventListener(event, resetTimeout);
    });

    resetTimeout(); // Iniciar timeout

    return () => {
      cleanup();
      events.forEach(event => {
        document.removeEventListener(event, resetTimeout);
      });
    };
  }, [enabled, resetTimeout, cleanup]);

  return {
    resetTimeout,
    lastActivity: lastActivityRef.current,
  };
};
