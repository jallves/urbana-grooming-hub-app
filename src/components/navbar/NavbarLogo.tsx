
import React from 'react';
import { Link } from 'react-router-dom';
import { Scissors } from 'lucide-react';

interface NavbarLogoProps {
  shopName: string;
}

const NavbarLogo: React.FC<NavbarLogoProps> = ({ shopName }) => {
  return (
    <div className="flex items-center gap-4">
      {/* Logo */}
      <Link to="/" className="transition-transform duration-300 hover:scale-110">
        <img
          src="/lovable-uploads/201b1568-1698-4a5e-bbb8-ee35c5363960.png"
          alt="Costa Urbana Logo"
          className="h-12 w-12 object-contain drop-shadow-md"
        />
      </Link>

      {/* Ícone do barbeiro */}
      <Link
        to="/barbeiro/login"
        className="text-urbana-gold hover:text-yellow-300 transition-all duration-300 hover:scale-110"
        title="Acesso para Barbeiros"
      >
        <Scissors className="h-6 w-6 drop-shadow-sm" />
      </Link>

      {/* Nome da barbearia em dourado */}
      <Link
        to="/"
        className="text-2xl md:text-3xl font-bold font-playfair text-urbana-gold hover:text-yellow-400 transition-all duration-300 drop-shadow-[0_0_6px_rgba(255,215,0,0.4)]"
        title="Barbearia Costa Urbana"
      >
        {shopName}
      </Link>
    </div>
  );
};

export default NavbarLogo;
