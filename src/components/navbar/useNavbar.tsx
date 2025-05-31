
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useClientAuth } from '@/contexts/ClientAuthContext';
import { useToast } from '@/hooks/use-toast';

export const useNavbar = () => {
  const { user, isAdmin, isBarber, signOut } = useAuth();
  const { user: clientUser, signOut: clientSignOut } = useClientAuth();
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
      if (clientUser) {
        await clientSignOut();
        toast({
          title: "Logout realizado com sucesso",
          description: "Você foi desconectado da área do cliente.",
        });
        navigate('/');
      } else if (user) {
        await signOut();
        toast({
          title: "Logout realizado com sucesso",
          description: "Você foi desconectado do sistema.",
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao fazer logout",
        description: "Ocorreu um erro ao tentar desconectar.",
        variant: "destructive",
      });
    }
  };

  const handlePanelClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (clientUser) {
      navigate('/client-dashboard');
    } else if (isAdmin) {
      navigate('/admin');
    } else if (isBarber) {
      navigate('/barbeiro/dashboard');
    } else {
      // If no user is logged in, show both options
      navigate('/auth');
    }
  };

  // Return the current user (either admin/barber or client)
  const currentUser = user || clientUser;

  return {
    user: currentUser,
    clientUser,
    adminUser: user,
    isAdmin,
    isBarber,
    scrolled,
    handleSignOut,
    handlePanelClick
  };
};
