
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const useNavbar = () => {
  const { user, isAdmin, isBarber, signOut } = useAuth();
  const { toast } = useToast();
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  
  // Effect to detect scrolling and add shadow/background when scrolled
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled]);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Logout realizado com sucesso",
        description: "Você foi desconectado do sistema.",
      });
      // Don't navigate here - let Auth context handle it
    } catch (error) {
      toast({
        title: "Erro ao fazer logout",
        description: "Ocorreu um erro ao tentar desconectar.",
        variant: "destructive",
      });
    }
  };

  const handlePanelClick = (e?: React.MouseEvent) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    
    if (isAdmin) {
      navigate('/admin');
    } else if (isBarber) {
      navigate('/barbeiro/dashboard');
    } else {
      navigate('/auth');
    }
  };

  return {
    user,
    isAdmin,
    isBarber,
    scrolled,
    handleSignOut,
    handlePanelClick
  };
};
