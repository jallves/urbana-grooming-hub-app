import React from 'react';
import { Link } from 'react-router-dom';
import { Scissors } from "lucide-react";

interface NavbarLogoProps {
  shopName: string;
}

const NavbarLogo: React.FC<NavbarLogoProps> = ({ shopName }) => {
  return (
    <div className="flex items-center gap-4">
      {/* Logo da Barbearia */}
      <Link
        to="/"
        className="transition-transform duration-300 hover:scale-110"
        title="Voltar para a página inicial"
      >
        <img
          src="/lovable-uploads/201b1568-1698-4a5e-bbb8-ee35c5363960.png"
          alt="Logo Costa Urbana"
          className="h-12 w-12 object-contain drop-shadow-[0_0_10px_rgba(255,215,0,0.3)]"
        />
      </Link>

      {/* Acesso para barbeiros */}
      <Link
        to="/barbeiro/login"
        className="text-urbana-gold hover:text-yellow-400 transition-transform hover:scale-110 duration-300"
        title="Painel do Barbeiro"
      >
        <Scissors className="h-6 w-6 drop-shadow-sm" />
      </Link>

      {/* Nome da Barbearia */}
      <Link
        to="/"
        className="text-2xl md:text-3xl font-bold font-playfair text-urbana-gold hover:text-yellow-400 transition-all duration-300 drop-shadow-[0_0_6px_rgba(255,215,0,0.4)]"
        title="Costa Urbana Barbearia"
      >
        {shopName}
      </Link>
    </div>
  );
};

export default NavbarLogo;
