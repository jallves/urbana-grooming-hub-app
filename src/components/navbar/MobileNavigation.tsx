
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Shield, Scissors, Menu, Home, X, User, Monitor } from "lucide-react";

interface MobileNavigationProps {
  user: any;
  handlePanelClick: (e?: React.MouseEvent) => void;
  handleSignOut: () => void;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({ 
  user, 
  handlePanelClick, 
  handleSignOut 
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const closeMenu = () => setIsMobileMenuOpen(false);

  const handleItemClick = (callback?: () => void) => {
    closeMenu();
    if (callback) callback();
  };

  const handlePanelClickMobile = () => {
    closeMenu();
    handlePanelClick();
  };

  const handleAdminLogin = () => {
    closeMenu();
    navigate('/auth');
  };

  const handleBarberLogin = () => {
    closeMenu();
    navigate('/barbeiro/login');
  };

  const handleTotemAccess = () => {
    closeMenu();
    navigate('/totem/login');
  };

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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm md:hidden" onClick={closeMenu} />
      )}

      {/* Mobile Sidebar */}
      <div className={`fixed inset-y-0 right-0 z-[51] w-[280px] bg-[#0d0d0d] transform transition-transform duration-300 ease-in-out md:hidden border-l border-urbana-gold/30 shadow-2xl ${
        isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex items-center justify-between p-4 border-b border-urbana-gold/30">
          <h2 className="text-lg font-semibold text-urbana-gold">Menu</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={closeMenu}
            className="text-urbana-gold hover:bg-urbana-gold/20 hover:text-urbana-gold"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        <div className="flex flex-col p-4 h-full">
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

            <Link 
              to="/painel-cliente/login"
              className="flex items-center space-x-3 text-urbana-gold hover:text-yellow-300 transition-colors py-3 px-2 rounded-md hover:bg-urbana-gold/20"
              onClick={() => handleItemClick()}
            >
              <User size={20} className="text-urbana-gold" />
              <span className="text-lg font-medium text-urbana-gold">Painel do Cliente</span>
            </Link>
          </div>

          <div className="border-t border-urbana-gold/30 pt-4 mt-auto rounded-t-lg -mx-4 px-4">
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
                <Button
                  variant="ghost"
                  className="w-full justify-start text-white hover:text-urbana-gold hover:bg-urbana-gold/20 text-lg py-3 h-auto"
                  onClick={handleAdminLogin}
                >
                  <Shield size={20} className="mr-3" />
                  <span className="text-lg font-medium">Admin</span>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-white hover:text-urbana-gold hover:bg-urbana-gold/20 text-lg py-3 h-auto"
                  onClick={handleBarberLogin}
                >
                  <Scissors size={20} className="text-urbana-gold mr-3" />
                  <span className="text-lg font-medium">Área do Barbeiro</span>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-white hover:text-urbana-gold hover:bg-urbana-gold/20 text-lg py-3 h-auto"
                  onClick={handleTotemAccess}
                >
                  <Monitor size={20} className="text-urbana-gold mr-3" />
                  <span className="text-lg font-medium">Totem</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileNavigation;
