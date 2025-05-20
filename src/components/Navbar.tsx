
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Shield, Scissors } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useShopSettings } from '@/hooks/useShopSettings';
import { 
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

const Navbar: React.FC = () => {
  const { user, isAdmin, isBarber, signOut } = useAuth();
  const { toast } = useToast();
  const [scrolled, setScrolled] = useState(false);
  const { shopSettings } = useShopSettings();
  const navigate = useNavigate();
  const location = useLocation();
  
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

  const handlePanelClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent default action
    if (isAdmin) {
      navigate('/admin');
    } else if (isBarber) {
      navigate('/barbeiro/dashboard');
    } else {
      navigate('/auth');
    }
  };

  // Use shop name from settings or fallback to default
  const shopName = shopSettings?.shop_name || "Barbearia Costa Urbana";

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled 
        ? 'bg-urbana-black shadow-md' 
        : 'bg-urbana-black/90 backdrop-blur-sm'
    }`}>
      <div className="container mx-auto py-4 px-5 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Scissors className="text-urbana-gold h-6 w-6" />
          <span className="text-2xl font-bold text-urbana-gold font-playfair">
            {shopName}
          </span>
        </Link>
        
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList className="gap-1">
            <NavigationMenuItem>
              <Link 
                to="/" 
                className="text-white hover:text-urbana-gold transition-colors px-4 py-2 block"
              >
                Home
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <a 
                href="#services" 
                className="text-white hover:text-urbana-gold transition-colors px-4 py-2 block"
              >
                Serviços
              </a>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <a 
                href="#team" 
                className="text-white hover:text-urbana-gold transition-colors px-4 py-2 block"
              >
                Equipe
              </a>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <a 
                href="#appointment" 
                className="text-white hover:text-urbana-gold transition-colors px-4 py-2 block"
              >
                Contato
              </a>
            </NavigationMenuItem>
            {user ? (
              <>
                <NavigationMenuItem>
                  <Button
                    variant="ghost"
                    className="text-white hover:text-urbana-gold transition-colors px-4 py-2"
                    onClick={handlePanelClick}
                  >
                    <Shield size={18} className="inline-block mr-1" />
                    Painel
                  </Button>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleSignOut}
                    className="border-urbana-gold text-urbana-gold hover:bg-urbana-gold/20"
                  >
                    Sair
                  </Button>
                </NavigationMenuItem>
              </>
            ) : (
              <>
                <NavigationMenuItem>
                  <Link 
                    to="/auth" 
                    className="text-white hover:text-urbana-gold transition-colors px-4 py-2 block"
                    title="Admin"
                  >
                    <Shield size={18} />
                  </Link>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Link 
                    to="/barbeiro/login" 
                    className="text-white hover:text-urbana-gold transition-colors px-4 py-2 block"
                    title="Área do Barbeiro"
                  >
                    <Scissors size={18} className="text-urbana-gold" />
                  </Link>
                </NavigationMenuItem>
              </>
            )}
          </NavigationMenuList>
        </NavigationMenu>
        
        {/* Mobile navigation */}
        <div className="flex md:hidden items-center">
          <Button 
            variant="ghost" 
            size="sm"
            className="text-white"
            asChild
          >
            <Link to="/">Home</Link>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-white"
            asChild
          >
            <a href="#services">Serviços</a>
          </Button>
          {user ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="text-white"
                onClick={handlePanelClick}
              >
                <Shield size={16} className="mr-1" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSignOut}
                className="ml-2 border-urbana-gold text-urbana-gold hover:bg-urbana-gold/20"
              >
                Sair
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost" 
                size="sm"
                className="text-white"
                asChild
              >
                <Link to="/auth">
                  <Shield size={16} className="mr-1" />
                </Link>
              </Button>
              <Button
                variant="ghost" 
                size="sm"
                className="text-white"
                asChild
              >
                <Link to="/barbeiro/login">
                  <Scissors size={16} className="text-urbana-gold" />
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
