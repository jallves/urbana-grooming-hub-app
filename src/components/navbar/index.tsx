import React, { useState, useEffect } from 'react';
import { useShopSettings } from '@/hooks/useShopSettings';
import NavbarLogo from './NavbarLogo';
import DesktopNavigation from './DesktopNavigation';
import MobileNavigation from './MobileNavigation';
import { Skeleton } from '@/components/ui/skeleton';
import throttle from 'lodash.throttle';
import { User } from '@/types'; // Assumindo que temos um tipo User definido

// Hook useNavbar agora incorporado diretamente no componente
const useNavbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null); // Estado do usuário

  useEffect(() => {
    // Simulação de carregamento do usuário
    const fetchUser = async () => {
      // Aqui viria sua lógica real de autenticação
      const mockUser: User = {
        id: '1',
        name: 'João Silva',
        email: 'joao@example.com',
        avatar: '/path/to/avatar.jpg'
      };
      setUser(mockUser);
    };

    fetchUser();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      setScrolled(isScrolled);
    };

    const throttledScroll = throttle(handleScroll, 100);
    window.addEventListener('scroll', throttledScroll);
    
    return () => window.removeEventListener('scroll', throttledScroll);
  }, []);

  const handlePanelClick = () => {
    // Lógica para abrir o painel do usuário
    console.log('Abrir painel do usuário');
  };

  const handleSignOut = () => {
    // Lógica de logout
    console.log('Usuário deslogado');
    setUser(null);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(prev => !prev);
    document.body.style.overflow = isMobileMenuOpen ? 'auto' : 'hidden';
  };

  return {
    user, 
    scrolled, 
    isMobileMenuOpen,
    handleSignOut, 
    handlePanelClick,
    toggleMobileMenu
  };
};

const Navbar: React.FC = () => {
  const { shopSettings, isLoading, error } = useShopSettings();
  const { 
    user, 
    scrolled, 
    isMobileMenuOpen,
    handleSignOut, 
    handlePanelClick,
    toggleMobileMenu
  } = useNavbar();
  
  // Tratamento de estados de loading
  if (isLoading) {
    return (
      <header className="fixed top-0 left-0 right-0 z-50 bg-urbana-black shadow-md">
        <div className="container mx-auto py-4 px-5 flex items-center justify-between">
          <Skeleton className="h-10 w-48 rounded-md" />
          <div className="hidden md:flex space-x-4">
            <Skeleton className="h-10 w-24 rounded-md" />
            <Skeleton className="h-10 w-24 rounded-md" />
          </div>
          <Skeleton className="md:hidden h-10 w-10 rounded-md" />
        </div>
      </header>
    );
  }

  // Fallback em caso de erro
  const shopName = error 
    ? "Barbearia Costa Urbana" 
    : shopSettings?.shop_name || "Barbearia Costa Urbana";

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-urbana-black/90 backdrop-blur-sm ${
        scrolled ? 'shadow-md bg-urbana-black' : ''
      }`}
      aria-label="Navegação principal"
    >
      <div className="container mx-auto py-3 md:py-4 px-4 md:px-5 flex items-center justify-between">
        <NavbarLogo shopName={shopName} />
        
        <DesktopNavigation 
          user={user} 
          onPanelClick={handlePanelClick} 
          onSignOut={handleSignOut} 
        />
        
        <MobileNavigation 
          user={user} 
          onPanelClick={handlePanelClick} 
          onSignOut={handleSignOut}
          isOpen={isMobileMenuOpen}
          onToggle={toggleMobileMenu}
        />
      </div>
    </header>
  );
};

export default Navbar;
