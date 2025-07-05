
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Scissors, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";

interface DesktopNavigationProps {
  user: any;
  handlePanelClick: (e: React.MouseEvent) => void;
  handleSignOut: () => Promise<void>;
}

const DesktopNavigation: React.FC<DesktopNavigationProps> = ({ 
  user, 
  handlePanelClick, 
  handleSignOut 
}) => {
  const navigate = useNavigate();

  const handleAdminLogin = () => {
    navigate('/auth');
  };

  const handleBarberLogin = () => {
    navigate('/barbeiro/login');
  };

  return (
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
        
        {/* Painel do Cliente */}
        <NavigationMenuItem>
          <Link 
            to="/painel-cliente/login"
            className="text-white hover:text-urbana-gold transition-colors px-4 py-2 block"
            title="Painel do Cliente"
          >
            <User size={18} className="inline-block mr-1 text-urbana-gold" />
            Painel Cliente
          </Link>
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
              <Button
                variant="ghost"
                className="text-white hover:text-urbana-gold transition-colors px-4 py-2"
                onClick={handleAdminLogin}
                title="Admin Login"
              >
                <Shield size={18} className="text-urbana-gold" />
              </Button>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Button
                variant="ghost"
                className="text-white hover:text-urbana-gold transition-colors px-4 py-2"
                onClick={handleBarberLogin}
                title="Área do Barbeiro"
              >
                <Scissors size={18} className="text-urbana-gold" />
              </Button>
            </NavigationMenuItem>
          </>
        )}
      </NavigationMenuList>
    </NavigationMenu>
  );
};

export default DesktopNavigation;
