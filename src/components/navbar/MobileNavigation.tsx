
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Shield, Scissors, Calendar, Menu, Home, Users } from "lucide-react";

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
  const [isOpen, setIsOpen] = useState(false);

  const closeSheet = () => setIsOpen(false);

  const handleItemClick = (callback?: () => void) => {
    closeSheet();
    if (callback) callback();
  };

  const handlePanelClickMobile = () => {
    closeSheet();
    handlePanelClick();
  };

  return (
    <div className="flex md:hidden">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="sm" className="text-white hover:text-urbana-gold">
            <Menu size={24} />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[280px] bg-urbana-black border-l border-urbana-gold/20">
          <div className="flex flex-col space-y-4 mt-8">
            <Link 
              to="/" 
              className="flex items-center space-x-3 text-white hover:text-urbana-gold transition-colors py-3 px-2 rounded-md hover:bg-urbana-gold/10"
              onClick={() => handleItemClick()}
            >
              <Home size={20} />
              <span className="text-lg">Home</span>
            </Link>
            
            <a 
              href="#services" 
              className="flex items-center space-x-3 text-white hover:text-urbana-gold transition-colors py-3 px-2 rounded-md hover:bg-urbana-gold/10"
              onClick={() => handleItemClick()}
            >
              <Scissors size={20} />
              <span className="text-lg">Serviços</span>
            </a>
            
            <a 
              href="#team" 
              className="flex items-center space-x-3 text-white hover:text-urbana-gold transition-colors py-3 px-2 rounded-md hover:bg-urbana-gold/10"
              onClick={() => handleItemClick()}
            >
              <Users size={20} />
              <span className="text-lg">Equipe</span>
            </a>
            
            <Link 
              to="/agendar"
              className="flex items-center space-x-3 text-white hover:text-urbana-gold transition-colors py-3 px-2 rounded-md hover:bg-urbana-gold/10"
              onClick={() => handleItemClick()}
            >
              <Calendar size={20} className="text-urbana-gold" />
              <span className="text-lg">Agendamento</span>
            </Link>

            <div className="border-t border-urbana-gold/20 pt-4 mt-6">
              {user ? (
                <div className="space-y-3">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-white hover:text-urbana-gold hover:bg-urbana-gold/10 text-lg py-3 h-auto"
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
                    className="flex items-center space-x-3 text-white hover:text-urbana-gold transition-colors py-3 px-2 rounded-md hover:bg-urbana-gold/10 w-full"
                    onClick={() => handleItemClick()}
                  >
                    <Shield size={20} />
                    <span className="text-lg">Admin</span>
                  </Link>
                  <Link 
                    to="/barbeiro/login" 
                    className="flex items-center space-x-3 text-white hover:text-urbana-gold transition-colors py-3 px-2 rounded-md hover:bg-urbana-gold/10 w-full"
                    onClick={() => handleItemClick()}
                  >
                    <Scissors size={20} className="text-urbana-gold" />
                    <span className="text-lg">Área do Barbeiro</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default MobileNavigation;
