
import React from 'react';
import { Link } from 'react-router-dom';

interface NavbarLogoProps {
  shopName: string;
}

const NavbarLogo: React.FC<NavbarLogoProps> = ({ shopName }) => {
  return (
    <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0">
      {/* Logo */}
      <Link to="/" className="flex-shrink-0 transition-transform duration-300 hover:scale-110">
        <img
          src="/costa-urbana-logo.png"
          alt="Costa Urbana Barbearia Logo"
          className="h-8 w-8 sm:h-12 sm:w-12 md:h-16 md:w-16 object-contain drop-shadow-lg"
        />
      </Link>


      {/* Nome da barbearia em dourado */}
      <Link
        to="/"
        className="text-sm sm:text-xl md:text-2xl lg:text-3xl font-bold font-playfair text-urbana-gold hover:text-yellow-400 transition-all duration-300 drop-shadow-[0_0_6px_rgba(255,215,0,0.4)] leading-tight truncate"
        title="Barbearia Costa Urbana"
      >
        {shopName}
      </Link>
    </div>
  );
};

export default NavbarLogo;
