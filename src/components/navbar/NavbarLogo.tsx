
import React from 'react';
import { Link } from 'react-router-dom';
import { Scissors } from "lucide-react";

interface NavbarLogoProps {
  shopName: string;
}

const NavbarLogo: React.FC<NavbarLogoProps> = ({ shopName }) => {
  return (
    <Link to="/" className="flex items-center gap-3">
      <img 
        src="/lovable-uploads/201b1568-1698-4a5e-bbb8-ee35c5363960.png" 
        alt="Costa Urbana Logo" 
        className="h-10 w-10 object-contain"
      />
      <Scissors className="text-urbana-gold h-6 w-6" />
      <span className="text-2xl font-bold text-urbana-gold font-playfair">
        {shopName}
      </span>
    </Link>
  );
};

export default NavbarLogo;
