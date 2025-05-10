
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button"
import { Shield, Scissors } from "lucide-react"; // Added Scissors icon for barbershop theme
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useShopSettings } from '@/hooks/useShopSettings';
import { ThemeToggle } from "@/components/theme/theme-toggle";
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
  const { user, isAdmin, signOut } = useAuth();
  const { toast } = useToast();
  const [scrolled, setScrolled] = useState(false);
  const { shopSettings } = useShopSettings();
  
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
    } catch (error) {
      toast({
        title: "Erro ao fazer logout",
        description: "Ocorreu um erro ao tentar desconectar.",
        variant: "destructive",
      });
    }
  };

  // Use shop name from settings or fallback to default
  const shopName = shopSettings?.shop_name || "Barbearia Costa Urbana";

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled 
        ? 'bg-urbana-black/95 backdrop-blur-sm shadow-md' 
        : 'bg-urbana-black/80 backdrop-blur-sm'
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
              <NavigationMenuLink 
                href="#" 
                className="text-white hover:text-urbana-gold transition-colors px-4 py-2"
              >
                Home
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink 
                href="#services" 
                className="text-white hover:text-urbana-gold transition-colors px-4 py-2"
              >
                Serviços
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink 
                href="#team" 
                className="text-white hover:text-urbana-gold transition-colors px-4 py-2"
              >
                Equipe
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink 
                href="#appointment" 
                className="text-white hover:text-urbana-gold transition-colors px-4 py-2"
              >
                Contato
              </NavigationMenuLink>
            </NavigationMenuItem>
            {user ? (
              <>
                <NavigationMenuItem>
                  <NavigationMenuLink 
                    className="text-white hover:text-urbana-gold transition-colors px-4 py-2"
                    href={isAdmin ? "/admin" : "/auth"}
                  >
                    <Shield size={18} className="inline-block mr-1" />
                    Painel
                  </NavigationMenuLink>
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
              <NavigationMenuItem>
                <NavigationMenuLink 
                  href="/auth" 
                  className="text-white hover:text-urbana-gold transition-colors px-4 py-2"
                  title="Admin"
                >
                  <Shield size={18} />
                </NavigationMenuLink>
              </NavigationMenuItem>
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
          {user && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSignOut}
              className="ml-2 border-urbana-gold text-urbana-gold hover:bg-urbana-gold/20"
            >
              Sair
            </Button>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
};

export default Navbar;
