import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

interface TotemTimeoutOptions {
  timeout?: number; // Tempo em ms até o timeout
  warningTime?: number; // Tempo em ms para mostrar aviso antes do timeout
  onWarning?: () => void;
  onTimeout?: () => void;
  enabled?: boolean;
}

const DEFAULT_TIMEOUT = 5 * 60 * 1000; // 5 minutos
const DEFAULT_WARNING_TIME = 30 * 1000; // 30 segundos

export const useTotemTimeout = (options: TotemTimeoutOptions = {}) => {
  const {
    timeout = DEFAULT_TIMEOUT,
    warningTime = DEFAULT_WARNING_TIME,
    onWarning,
    onTimeout,
    enabled = true,
  } = options;

  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(timeout);
  const [showWarning, setShowWarning] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const warningRef = useRef<NodeJS.Timeout>();
  const intervalRef = useRef<NodeJS.Timeout>();

  const resetTimer = useCallback(() => {
    if (!enabled) return;

    // Limpar timers existentes
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);

    // Resetar estado
    setTimeLeft(timeout);
    setShowWarning(false);

    // Configurar aviso
    warningRef.current = setTimeout(() => {
      setShowWarning(true);
      onWarning?.();

      // Iniciar contagem regressiva
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          const newTime = prev - 1000;
          if (newTime <= 0) {
            if (intervalRef.current) clearInterval(intervalRef.current);
          }
          return Math.max(0, newTime);
        });
      }, 1000);
    }, timeout - warningTime);

    // Configurar timeout
    timeoutRef.current = setTimeout(() => {
      onTimeout?.();
      navigate('/totem/home');
    }, timeout);
  }, [timeout, warningTime, onWarning, onTimeout, navigate, enabled]);

  const extendTime = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  const cancelTimeout = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setShowWarning(false);
  }, []);

  useEffect(() => {
    if (!enabled) {
      cancelTimeout();
      return;
    }

    // Eventos para resetar o timer
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];

    const handleActivity = () => {
      if (!showWarning) {
        resetTimer();
      }
    };

    events.forEach((event) => {
      document.addEventListener(event, handleActivity);
    });

    resetTimer();

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
      cancelTimeout();
    };
  }, [enabled, resetTimer, cancelTimeout, showWarning]);

  const formatTimeLeft = useCallback(() => {
    const seconds = Math.floor(timeLeft / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, [timeLeft]);

  return {
    timeLeft,
    showWarning,
    formatTimeLeft: formatTimeLeft(),
    resetTimer,
    extendTime,
    cancelTimeout,
  };
};
