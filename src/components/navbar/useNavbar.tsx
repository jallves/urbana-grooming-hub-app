
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useNavbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signOut: authSignOut } = useAuth();


  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768); // md breakpoint
    };

    handleResize(); // Check initial size
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleSignOut = () => {
    console.log('[useNavbar] 🚪 Logout COMPLETO iniciado da homepage...');
    
    // 1. Limpar TODAS as sessões e caches locais IMEDIATAMENTE
    localStorage.removeItem('admin_last_route');
    localStorage.removeItem('barber_last_route');
    localStorage.removeItem('client_last_route');
    localStorage.removeItem('totem_last_route');
    localStorage.removeItem('user_role_cache');
    localStorage.removeItem('barber_session_token');
    localStorage.removeItem('client_session_token');
    
    // 2. Limpar qualquer cache do Supabase
    const supabaseKeys = Object.keys(localStorage).filter(key => 
      key.startsWith('sb-') || key.includes('supabase')
    );
    supabaseKeys.forEach(key => localStorage.removeItem(key));
    
    // 3. Chamar o signOut do contexto
    authSignOut();
    
    // 4. Forçar reload completo para garantir que tudo foi limpo
    console.log('[useNavbar] ✅ Limpeza completa realizada, forçando reload...');
    window.location.href = '/';
  };

  const handlePanelClick = () => {
    navigate('/admin');
  };

  return {
    user,
    scrolled,
    isDesktop,
    handleSignOut,
    handlePanelClick
  };
};
