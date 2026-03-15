import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

interface UseAutoRedirectHomeOptions {
  seconds?: number;
  enabled?: boolean;
  redirectTo?: string;
  redirectState?: any;
  onBeforeRedirect?: () => void;
}

/**
 * Hook para auto-redirect ao home do totem após inatividade.
 * Mostra countdown visual e reseta ao detectar interação.
 */
export const useAutoRedirectHome = ({
  seconds = 10,
  enabled = true,
  redirectTo = '/totem/home',
  redirectState,
  onBeforeRedirect,
}: UseAutoRedirectHomeOptions = {}) => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(seconds);
  const intervalRef = useRef<NodeJS.Timeout>();
  const startTimeRef = useRef<number>(Date.now());

  const resetCountdown = useCallback(() => {
    setCountdown(seconds);
    startTimeRef.current = Date.now();
  }, [seconds]);

  const stopCountdown = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const events = ['mousedown', 'touchstart', 'keydown', 'scroll'];
    const handleActivity = () => resetCountdown();

    events.forEach(e => document.addEventListener(e, handleActivity));

    startTimeRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const remaining = Math.max(0, seconds - elapsed);
      setCountdown(remaining);

      if (remaining <= 0) {
        stopCountdown();
        onBeforeRedirect?.();
        navigate(redirectTo, { state: redirectState });
      }
    }, 500);

    return () => {
      stopCountdown();
      events.forEach(e => document.removeEventListener(e, handleActivity));
    };
  }, [enabled, seconds, redirectTo, redirectState, navigate, resetCountdown, stopCountdown, onBeforeRedirect]);

  return { countdown, resetCountdown, stopCountdown };
};
