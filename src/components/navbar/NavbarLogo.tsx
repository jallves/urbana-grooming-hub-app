
import React from 'react';
import { Link } from 'react-router-dom';
import { Scissors } from "lucide-react";

interface NavbarLogoProps {
  shopName: string;
}

const NavbarLogo: React.FC<NavbarLogoProps> = ({ shopName }) => {
  return (
    <div className="flex items-center gap-3">
      <Link to="/">
        <img 
          src="/lovable-uploads/201b1568-1698-4a5e-bbb8-ee35c5363960.png" 
          alt="Costa Urbana Logo" 
          className="h-10 w-10 object-contain"
        />
      </Link>
      <Link 
        to="/barbeiro/login" 
        className="text-urbana-gold hover:text-urbana-gold/80 transition-colors"
        title="Acesso para Barbeiros"
      >
        <Scissors className="h-6 w-6" />
      </Link>
      <Link to="/" className="text-2xl font-bold text-urbana-gold font-playfair hover:text-urbana-gold/90 transition-colors">
        {shopName}
      </Link>
    </div>
  );
};

export default NavbarLogo;
