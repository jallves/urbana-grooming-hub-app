import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, TOTEM_TOKEN_STORAGE_KEY } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { sessionManager } from '@/hooks/useSessionManager';
import { useForceLogoutListener } from '@/hooks/useForceLogoutListener';
import { useForceLogoutWatcher } from '@/hooks/useForceLogoutWatcher';

interface TotemAuthContextType {
  isAuthenticated: boolean;
  loading: boolean;
  login: (pin: string) => Promise<boolean>;
  logout: () => void;
}

const TotemAuthContext = createContext<TotemAuthContextType | undefined>(undefined);

export const useTotemAuth = () => {
  const context = useContext(TotemAuthContext);
  if (!context) {
    throw new Error('useTotemAuth deve ser usado dentro de TotemAuthProvider');
  }
  return context;
};

interface TotemAuthProviderProps {
  children: ReactNode;
}

export const TotemAuthProvider: React.FC<TotemAuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [totemUserId, setTotemUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Listener para logout forçado
  useForceLogoutListener(totemUserId || undefined);
  useForceLogoutWatcher(totemUserId, 'totem', '/totem/login');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    const totemToken = localStorage.getItem('totem_auth_token');
    const totemExpiry = localStorage.getItem('totem_auth_expiry');
    const sessionToken = localStorage.getItem(TOTEM_TOKEN_STORAGE_KEY);

    if (totemToken && totemExpiry && sessionToken) {
      const expiryTime = new Date(totemExpiry).getTime();
      const now = new Date().getTime();
      
      if (now < expiryTime) {
        setIsAuthenticated(true);
        setTotemUserId(totemToken);
      } else {
        localStorage.removeItem(TOTEM_TOKEN_STORAGE_KEY);
        localStorage.removeItem('totem_auth_token');
        localStorage.removeItem('totem_auth_expiry');
      }
    } else if (totemToken || sessionToken) {
      // Sessão antiga (antes do token de servidor): força novo login.
      localStorage.removeItem(TOTEM_TOKEN_STORAGE_KEY);
      localStorage.removeItem('totem_auth_token');
      localStorage.removeItem('totem_auth_expiry');
    }
    
    setLoading(false);
  };

  const login = async (pin: string): Promise<boolean> => {
    console.log('🔐 [TotemAuth] Iniciando login...');
    try {
      // O PIN nunca é validado no navegador: quem confere é o servidor,
      // que devolve um token de sessão assinado para o totem.
      const { data, error } = await supabase.functions.invoke('totem-login', {
        body: { pin },
      });

      console.log('🔐 [TotemAuth] Resposta do servidor:', { ok: !!data?.success });

      if (error || !data?.success || !data?.token) {
        console.error('❌ [TotemAuth] Falha na autenticação');
        toast({
          title: "PIN Inválido",
          description: "O PIN digitado está incorreto",
          variant: "destructive",
        });
        return false;
      }

      console.log('✅ [TotemAuth] Autenticação bem-sucedida');

      const expiryTime = data.expiresAt
        ? new Date(data.expiresAt)
        : new Date(Date.now() + 8 * 60 * 60 * 1000);

      console.log('🔐 [TotemAuth] Salvando token no localStorage...');
      localStorage.setItem(TOTEM_TOKEN_STORAGE_KEY, data.token);
      localStorage.setItem('totem_auth_token', data.totemAuthId);
      localStorage.setItem('totem_auth_expiry', expiryTime.toISOString());

      // O token do totem é enviado como cabeçalho fixo do cliente Supabase,
      // que é criado no carregamento da página. Recarregamos para que todas
      // as telas do totem já saiam autorizadas.
      window.location.replace('/totem/welcome');
      return true;
    } catch (error) {
      console.error('❌ [TotemAuth] Erro CRÍTICO no login:', error);
      toast({
        title: "Erro no login",
        description: "Ocorreu um erro ao tentar fazer login",
        variant: "destructive",
      });
      return false;
    }
  };

  const logout = (): void => {
    console.log('[TotemAuthContext] 🚪 Iniciando logout IMEDIATO do totem...');

    const token = localStorage.getItem(TOTEM_TOKEN_STORAGE_KEY);

    // 1. Limpar estado IMEDIATAMENTE
    setIsAuthenticated(false);
    setTotemUserId(null);
    setLoading(false);

    // 2. Invalidar o token no servidor (não bloqueante)
    if (token) {
      supabase.functions
        .invoke('totem-logout', { body: { token } })
        .catch(err => console.warn('[TotemAuthContext] ⚠️ Erro ao invalidar token:', err));
    }

    // 2. Invalidar sessão (não bloqueante - não interrompe o logout se falhar)
    sessionManager.invalidateSession('totem').catch(err => 
      console.warn('[TotemAuthContext] ⚠️ Erro ao invalidar sessão (não crítico):', err)
    );

    // 3. Limpar localStorage
    localStorage.removeItem(TOTEM_TOKEN_STORAGE_KEY);
    localStorage.removeItem('totem_auth_token');
    localStorage.removeItem('totem_auth_expiry');
    localStorage.removeItem('totem_last_route');
    
    // 4. Toast rápido
    toast({
      title: "Logout realizado",
      description: "Sessão do totem encerrada",
      duration: 2000,
    });
    
    // 5. Redirecionar IMEDIATAMENTE
    console.log('[TotemAuthContext] ✅ Logout concluído - redirecionando...');
    window.location.href = '/totem/login';
  };

  return (
    <TotemAuthContext.Provider value={{ isAuthenticated, loading, login, logout }}>
      {children}
    </TotemAuthContext.Provider>
  );
};
