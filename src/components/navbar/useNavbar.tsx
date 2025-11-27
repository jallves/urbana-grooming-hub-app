
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
    console.log('[useNavbar] 🚪 Iniciando logout da homepage...');
    console.log('[useNavbar] 📊 Usuário antes do logout:', user?.email);
    authSignOut(); // signOut limpa estado, localStorage e redireciona para /auth
    console.log('[useNavbar] ✅ authSignOut() chamado - aguardando redirecionamento...');
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
