
import React from 'react';
import { Link } from 'react-router-dom';
import { Scissors } from "lucide-react";

interface NavbarLogoProps {
  shopName: string;
}

const NavbarLogo: React.FC<NavbarLogoProps> = ({ shopName }) => {
  return (
    <Link to="/" className="flex items-center gap-2">
      <Scissors className="text-urbana-gold h-6 w-6" />
      <span className="text-2xl font-bold text-urbana-gold font-playfair">
        {shopName}
      </span>
    </Link>
  );
};

export default NavbarLogo;
