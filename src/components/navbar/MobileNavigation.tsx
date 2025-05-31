
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, User, LogOut, Calendar } from 'lucide-react';

interface MobileNavigationProps {
  user: any;
  handlePanelClick: (e: React.MouseEvent) => void;
  handleSignOut: () => void;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({
  user,
  handlePanelClick,
  handleSignOut,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleNavigation = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  return (
    <div className="lg:hidden">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="text-urbana-gold hover:bg-urbana-gold/10"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent 
          side="right" 
          className="w-[300px] bg-urbana-dark border-urbana-gold/20"
        >
          <div className="flex flex-col space-y-4 mt-8">
            {!user && (
              <>
                <Button
                  onClick={() => handleNavigation(() => window.location.href = '/client-auth')}
                  variant="outline"
                  className="w-full border-urbana-gold/50 text-urbana-gold hover:bg-urbana-gold hover:text-white"
                >
                  <User className="h-4 w-4 mr-2" />
                  Área do Cliente
                </Button>
                <Button
                  onClick={() => handleNavigation(() => window.location.href = '/auth')}
                  className="w-full bg-urbana-gold hover:bg-urbana-gold/90 text-white"
                >
                  Área Administrativa
                </Button>
              </>
            )}
            
            {user && (
              <>
                <Button
                  onClick={(e) => handleNavigation(() => handlePanelClick(e))}
                  className="w-full bg-urbana-gold hover:bg-urbana-gold/90 text-white"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Painel
                </Button>
                <Button
                  onClick={() => handleNavigation(handleSignOut)}
                  variant="outline"
                  className="w-full border-urbana-gold/50 text-urbana-gold hover:bg-urbana-gold hover:text-white"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </Button>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default MobileNavigation;
