
import React from 'react';
import { Button } from '@/components/ui/button';
import { User, LogOut, Calendar } from 'lucide-react';

interface DesktopNavigationProps {
  user: any;
  handlePanelClick: (e: React.MouseEvent) => void;
  handleSignOut: () => void;
}

const DesktopNavigation: React.FC<DesktopNavigationProps> = ({
  user,
  handlePanelClick,
  handleSignOut,
}) => {
  return (
    <div className="hidden lg:flex items-center space-x-4">
      {!user && (
        <>
          <Button
            onClick={() => window.location.href = '/client-auth'}
            variant="outline"
            className="border-urbana-gold/50 text-urbana-gold hover:bg-urbana-gold hover:text-white"
          >
            <User className="h-4 w-4 mr-2" />
            Área do Cliente
          </Button>
          <Button
            onClick={() => window.location.href = '/auth'}
            className="bg-urbana-gold hover:bg-urbana-gold/90 text-white"
          >
            Área Administrativa
          </Button>
        </>
      )}
      
      {user && (
        <div className="flex items-center space-x-3">
          <Button
            onClick={handlePanelClick}
            className="bg-urbana-gold hover:bg-urbana-gold/90 text-white"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Painel
          </Button>
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="border-urbana-gold/50 text-urbana-gold hover:bg-urbana-gold hover:text-white"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default DesktopNavigation;
