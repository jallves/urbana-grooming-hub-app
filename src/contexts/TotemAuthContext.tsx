import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { sessionManager } from '@/hooks/useSessionManager';
import { useForceLogoutListener } from '@/hooks/useForceLogoutListener';

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

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    const totemToken = localStorage.getItem('totem_auth_token');
    const totemExpiry = localStorage.getItem('totem_auth_expiry');
    
    if (totemToken && totemExpiry) {
      const expiryTime = new Date(totemExpiry).getTime();
      const now = new Date().getTime();
      
      if (now < expiryTime) {
        setIsAuthenticated(true);
        setTotemUserId(totemToken);
      } else {
        localStorage.removeItem('totem_auth_token');
        localStorage.removeItem('totem_auth_expiry');
      }
    }
    
    setLoading(false);
  };

  const hashPin = async (pin: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(pin);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const login = async (pin: string): Promise<boolean> => {
    console.log('🔐 [TotemAuth] Iniciando login...');
    try {
      const pinHash = await hashPin(pin);
      console.log('🔐 [TotemAuth] PIN hash gerado');
      
      const { data, error } = await supabase
        .from('totem_auth')
        .select('*')
        .eq('pin_hash', pinHash)
        .eq('is_active', true)
        .single();

      console.log('🔐 [TotemAuth] Resposta do Supabase:', { hasData: !!data, error });

      if (error || !data) {
        console.error('❌ [TotemAuth] Falha na autenticação:', error);
        toast({
          title: "PIN Inválido",
          description: "O PIN digitado está incorreto",
          variant: "destructive",
        });
        return false;
      }

      console.log('✅ [TotemAuth] Autenticação bem-sucedida');
      
      // Atualizar último login
      console.log('🔐 [TotemAuth] Atualizando último login...');
      await supabase
        .from('totem_auth')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', data.id);

      // Salvar token com expiração de 8 horas
      const expiryTime = new Date();
      expiryTime.setHours(expiryTime.getHours() + 8);
      
      console.log('🔐 [TotemAuth] Salvando token no localStorage...');
      localStorage.setItem('totem_auth_token', data.id);
      localStorage.setItem('totem_auth_expiry', expiryTime.toISOString());
      
      console.log('🔐 [TotemAuth] Definindo isAuthenticated = true');
      setIsAuthenticated(true);
      setTotemUserId(data.id);
      
      console.log('🔐 [TotemAuth] Mostrando toast de sucesso');
      toast({
        title: "Login realizado",
        description: `Bem-vindo, ${data.device_name}`,
      });
      
      // Criar sessão no sistema de controle (não bloqueante - não interrompe o login se falhar)
      console.log('🔐 [TotemAuth] Criando sessão (não bloqueante)...');
      sessionManager.createSession({
        userId: data.id,
        userType: 'totem',
        userName: data.device_name,
        expiresInHours: 8,
      }).catch(err => console.warn('[Totem] ⚠️ Erro ao criar sessão (não crítico):', err));
      
      console.log('✅ [TotemAuth] Login completo!');
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
    
    // 1. Limpar estado IMEDIATAMENTE
    setIsAuthenticated(false);
    setTotemUserId(null);
    setLoading(false);
    
    // 2. Invalidar sessão (não bloqueante - não interrompe o logout se falhar)
    sessionManager.invalidateSession('totem').catch(err => 
      console.warn('[TotemAuthContext] ⚠️ Erro ao invalidar sessão (não crítico):', err)
    );
    
    // 3. Limpar localStorage
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
