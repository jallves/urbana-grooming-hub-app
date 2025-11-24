import React from 'react';

interface ClientGreetingHeaderProps {
  cliente: {
    nome: string;
  } | null;
}

export const ClientGreetingHeader: React.FC<ClientGreetingHeaderProps> = ({ cliente }) => {
  return (
    <div className="w-full">
      <h1 className="text-2xl sm:text-3xl font-bold text-urbana-gold font-playfair drop-shadow-lg">
        Olá, {cliente?.nome}!
      </h1>
      <p className="text-urbana-light/70 text-sm sm:text-base drop-shadow-md">
        Bem-vindo à Urbana Barbearia
      </p>
    </div>
  );
};
