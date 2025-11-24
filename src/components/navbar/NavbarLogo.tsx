
import React from 'react';
import { Link } from 'react-router-dom';
import { Scissors } from 'lucide-react';

interface NavbarLogoProps {
  shopName: string;
}

const NavbarLogo: React.FC<NavbarLogoProps> = ({ shopName }) => {
  return (
    <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
      {/* Logo */}
      <Link to="/" className="transition-transform duration-300 hover:scale-110">
        <img
          src="/costa-urbana-logo.png"
          alt="Costa Urbana Barbearia Logo"
          className="h-10 w-10 sm:h-12 sm:w-12 md:h-16 md:w-16 object-contain drop-shadow-lg"
        />
      </Link>

      {/* Ícone do barbeiro */}
      <Link
        to="/barbeiro/login"
        className="text-urbana-gold hover:text-yellow-300 transition-all duration-300 hover:scale-110"
        title="Acesso para Barbeiros"
      >
        <Scissors className="h-5 w-5 sm:h-6 sm:w-6 drop-shadow-sm" />
      </Link>

      {/* Nome da barbearia em dourado */}
      <Link
        to="/"
        className="text-base sm:text-xl md:text-2xl lg:text-3xl font-bold font-playfair text-urbana-gold hover:text-yellow-400 transition-all duration-300 drop-shadow-[0_0_6px_rgba(255,215,0,0.4)] leading-tight"
        title="Barbearia Costa Urbana"
      >
        {shopName}
      </Link>
    </div>
  );
};

export default NavbarLogo;
