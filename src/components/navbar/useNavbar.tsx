
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useClientAuth } from '@/contexts/ClientAuthContext';
import { useToast } from '@/hooks/use-toast';

export const useNavbar = () => {
  const { user: adminUser, isAdmin, isBarber, signOut: adminSignOut } = useAuth();
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
      } else if (adminUser) {
        await adminSignOut();
        toast({
          title: "Logout realizado com sucesso",
          description: "Você foi desconectado do sistema.",
        });
        navigate('/');
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
      navigate('/barber');
    }
  };

  // Return the appropriate user for display
  const currentUser = adminUser || clientUser;

  return {
    user: currentUser,
    clientUser,
    adminUser,
    isAdmin,
    isBarber,
    scrolled,
    handleSignOut,
    handlePanelClick
  };
};
