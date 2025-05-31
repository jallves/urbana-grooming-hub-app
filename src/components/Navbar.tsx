
import React from 'react';
import { Button } from './ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useClientAuth } from '@/contexts/ClientAuthContext';
import DesktopNavigation from './navbar/DesktopNavigation';
import MobileNavigation from './navbar/MobileNavigation';
import NavbarLogo from './navbar/NavbarLogo';

const Navbar: React.FC = () => {
  const { user: adminUser } = useAuth();
  const { user: clientUser } = useClientAuth();

  const handleClientAreaClick = () => {
    window.location.href = '/client-auth';
  };

  const handleAdminAreaClick = () => {
    window.location.href = '/auth';
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm border-b border-urbana-gold/20">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <NavbarLogo />
          
          <DesktopNavigation />
          <MobileNavigation />
          
          <div className="hidden lg:flex items-center space-x-4">
            {!clientUser && !adminUser && (
              <>
                <Button
                  onClick={handleClientAreaClick}
                  variant="outline"
                  className="border-urbana-gold/50 text-urbana-gold hover:bg-urbana-gold hover:text-white"
                >
                  Área do Cliente
                </Button>
                <Button
                  onClick={handleAdminAreaClick}
                  className="bg-urbana-gold hover:bg-urbana-gold/90 text-white"
                >
                  Área Administrativa
                </Button>
              </>
            )}
            
            {clientUser && (
              <Button
                onClick={() => window.location.href = '/client-dashboard'}
                className="bg-urbana-gold hover:bg-urbana-gold/90 text-white"
              >
                Meu Painel
              </Button>
            )}
            
            {adminUser && (
              <Button
                onClick={() => window.location.href = '/admin'}
                className="bg-urbana-gold hover:bg-urbana-gold/90 text-white"
              >
                Painel Admin
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
