
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Shield, Scissors, Calendar } from "lucide-react";

interface MobileNavigationProps {
  user: any;
  handlePanelClick: (e: React.MouseEvent) => void;
  handleSignOut: () => Promise<void>;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({ 
  user, 
  handlePanelClick, 
  handleSignOut 
}) => {
  return (
    <div className="flex md:hidden items-center space-x-2">
      <Button 
        variant="ghost" 
        size="sm"
        className="text-white hover:text-urbana-gold transition-colors"
        asChild
      >
        <Link to="/">Home</Link>
      </Button>
      <Button 
        variant="ghost" 
        size="sm" 
        className="text-white hover:text-urbana-gold transition-colors"
        asChild
      >
        <a href="#services">Serviços</a>
      </Button>
      <Button 
        variant="ghost" 
        size="sm" 
        className="text-white hover:text-urbana-gold transition-colors"
        asChild
      >
        <Link to="/agendar">
          <Calendar size={16} className="text-urbana-gold" />
        </Link>
      </Button>
      {user ? (
        <>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:text-urbana-gold transition-colors"
            onClick={handlePanelClick}
          >
            <Shield size={16} />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSignOut}
            className="border-urbana-gold text-urbana-gold hover:bg-urbana-gold hover:text-black transition-all"
          >
            Sair
          </Button>
        </>
      ) : (
        <>
          <Button
            variant="ghost" 
            size="sm"
            className="text-white hover:text-urbana-gold transition-colors"
            asChild
          >
            <Link to="/auth">
              <Shield size={16} />
            </Link>
          </Button>
          <Button
            variant="ghost" 
            size="sm"
            className="text-white hover:text-urbana-gold transition-colors"
            asChild
          >
            <Link to="/barbeiro/login">
              <Scissors size={16} className="text-urbana-gold" />
            </Link>
          </Button>
        </>
      )}
    </div>
  );
};

export default MobileNavigation;
