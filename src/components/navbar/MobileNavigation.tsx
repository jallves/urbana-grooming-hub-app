
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Shield, Scissors, Calendar, Menu, Home, Users, X, User } from "lucide-react";
import { useIsMobile } from '@/hooks/use-mobile';

interface MobileNavigationProps {
  user: any;
  handlePanelClick: (e?: React.MouseEvent) => void;
  handleSignOut: () => Promise<void>;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({ 
  user, 
  handlePanelClick, 
  handleSignOut 
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  const closeMenu = () => setIsMobileMenuOpen(false);

  const handleItemClick = (callback?: () => void) => {
    closeMenu();
    if (callback) callback();
  };

  const handlePanelClickMobile = () => {
    closeMenu();
    handlePanelClick();
  };

  if (!isMobile) return null;

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="flex md:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileMenuOpen(true)}
          className="text-white hover:text-urbana-gold"
        >
          <Menu size={24} />
        </Button>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 md:hidden" onClick={closeMenu} />
      )}

      {/* Mobile Sidebar */}
      <div className={`fixed inset-y-0 right-0 z-50 w-[280px] bg-urbana-black transform transition-transform duration-300 ease-in-out md:hidden border-l border-urbana-gold/30 ${
        isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex items-center justify-between p-4 border-b border-urbana-gold/30 bg-urbana-black">
          <h2 className="text-lg font-semibold text-urbana-gold">Menu</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={closeMenu}
            className="text-urbana-gold hover:bg-urbana-gold hover:text-urbana-black"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        <div className="flex flex-col p-4 h-full bg-urbana-black">
          <div className="flex flex-col space-y-3 flex-1">
            <Link 
              to="/" 
              className="flex items-center space-x-3 text-white hover:text-urbana-gold transition-colors py-3 px-2 rounded-md hover:bg-urbana-gold/20"
              onClick={() => handleItemClick()}
            >
              <Home size={20} />
              <span className="text-lg font-medium">Home</span>
            </Link>
            
            <a 
              href="#services" 
              className="flex items-center space-x-3 text-white hover:text-urbana-gold transition-colors py-3 px-2 rounded-md hover:bg-urbana-gold/20"
              onClick={() => handleItemClick()}
            >
              <Scissors size={20} />
              <span className="text-lg font-medium">Serviços</span>
            </a>
            
            <a 
              href="#team" 
              className="flex items-center space-x-3 text-white hover:text-urbana-gold transition-colors py-3 px-2 rounded-md hover:bg-urbana-gold/20"
              onClick={() => handleItemClick()}
            >
              <Users size={20} />
              <span className="text-lg font-medium">Equipe</span>
            </a>
            
            <Link 
              to="/agendar"
              className="flex items-center space-x-3 text-white hover:text-urbana-gold transition-colors py-3 px-2 rounded-md hover:bg-urbana-gold/20"
              onClick={() => handleItemClick()}
            >
              <Calendar size={20} className="text-urbana-gold" />
              <span className="text-lg font-medium">Agendamento</span>
            </Link>

            <Link 
              to="/cliente/login"
              className="flex items-center space-x-3 text-white hover:text-urbana-gold transition-colors py-3 px-2 rounded-md hover:bg-urbana-gold/20"
              onClick={() => handleItemClick()}
            >
              <User size={20} className="text-urbana-gold" />
              <span className="text-lg font-medium">Área do Cliente</span>
            </Link>
          </div>

          <div className="border-t border-urbana-gold/30 pt-4 mt-auto bg-urbana-black rounded-t-lg -mx-4 px-4">
            {user ? (
              <div className="space-y-3">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-white hover:text-urbana-gold hover:bg-urbana-gold/20 text-lg py-3 h-auto"
                  onClick={handlePanelClickMobile}
                >
                  <Shield size={20} className="mr-3" />
                  Painel Administrativo
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full border-urbana-gold text-urbana-gold hover:bg-urbana-gold hover:text-black transition-all text-lg py-3 h-auto"
                  onClick={() => handleItemClick(handleSignOut)}
                >
                  Sair
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Link 
                  to="/auth" 
                  className="flex items-center space-x-3 text-white hover:text-urbana-gold transition-colors py-3 px-2 rounded-md hover:bg-urbana-gold/20 w-full"
                  onClick={() => handleItemClick()}
                >
                  <Shield size={20} />
                  <span className="text-lg font-medium">Admin</span>
                </Link>
                <Link 
                  to="/barbeiro/login" 
                  className="flex items-center space-x-3 text-white hover:text-urbana-gold transition-colors py-3 px-2 rounded-md hover:bg-urbana-gold/20 w-full"
                  onClick={() => handleItemClick()}
                >
                  <Scissors size={20} className="text-urbana-gold" />
                  <span className="text-lg font-medium">Área do Barbeiro</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileNavigation;
