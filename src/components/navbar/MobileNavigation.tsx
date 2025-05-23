
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Shield, Scissors, Calendar } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';

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
      <Button 
        variant="ghost" 
        size="sm" 
        className="text-white"
        asChild
      >
        <Link to={user ? "/appointment-booking" : "/register-auth"}>
          <Calendar size={16} className="text-urbana-gold" />
        </Link>
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
  );
};

export default MobileNavigation;
