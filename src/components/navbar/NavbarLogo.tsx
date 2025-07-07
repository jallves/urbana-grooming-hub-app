
import React from 'react';
import { Link } from 'react-router-dom';
import { Scissors } from "lucide-react";

interface NavbarLogoProps {
  shopName: string;
}

const NavbarLogo: React.FC<NavbarLogoProps> = ({ shopName }) => {
  return (
    <div className="flex items-center gap-3">
      <Link to="/" className="transition-transform duration-300 hover:scale-110">
        <img 
          src="/lovable-uploads/201b1568-1698-4a5e-bbb8-ee35c5363960.png" 
          alt="Costa Urbana Logo" 
          className="h-12 w-12 object-contain drop-shadow-lg"
        />
      </Link>
      <Link 
        to="/barbeiro/login" 
        className="text-urbana-gold hover:text-urbana-gold/80 transition-all duration-300 hover:scale-110"
        title="Acesso para Barbeiros"
      >
        <Scissors className="h-6 w-6 drop-shadow-sm" />
      </Link>
      <Link to="/" className="text-2xl md:text-3xl font-bold text-urbana-gold font-playfair hover:text-urbana-gold/90 transition-all duration-300 drop-shadow-sm">
        {shopName}
      </Link>
    </div>
  );
};

export default NavbarLogo;
