import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

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
    try {
      const pinHash = await hashPin(pin);
      
      const { data, error } = await supabase
        .from('totem_auth')
        .select('*')
        .eq('pin_hash', pinHash)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        toast({
          title: "PIN Inválido",
          description: "O PIN digitado está incorreto",
          variant: "destructive",
        });
        return false;
      }

      // Atualizar último login
      await supabase
        .from('totem_auth')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', data.id);

      // Salvar token com expiração de 8 horas
      const expiryTime = new Date();
      expiryTime.setHours(expiryTime.getHours() + 8);
      
      localStorage.setItem('totem_auth_token', data.id);
      localStorage.setItem('totem_auth_expiry', expiryTime.toISOString());
      
      setIsAuthenticated(true);
      
      toast({
        title: "Login realizado",
        description: `Bem-vindo, ${data.device_name}`,
      });
      
      return true;
    } catch (error) {
      console.error('Erro no login do totem:', error);
      toast({
        title: "Erro no login",
        description: "Ocorreu um erro ao tentar fazer login",
        variant: "destructive",
      });
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('totem_auth_token');
    localStorage.removeItem('totem_auth_expiry');
    setIsAuthenticated(false);
    
    toast({
      title: "Logout realizado",
      description: "Sessão do totem encerrada",
    });
  };

  return (
    <TotemAuthContext.Provider value={{ isAuthenticated, loading, login, logout }}>
      {children}
    </TotemAuthContext.Provider>
  );
};
