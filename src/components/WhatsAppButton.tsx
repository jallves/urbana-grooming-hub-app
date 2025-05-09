
import React from 'react';
import { MessageCircle } from 'lucide-react';

const WhatsAppButton: React.FC = () => {
  // Número de telefone para o WhatsApp (substitua pelo seu número)
  const phoneNumber = '5511999999999'; // Formato: código do país + DDD + número
  const message = encodeURIComponent('Olá, gostaria de mais informações sobre a Urbana Barbearia!');
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

  return (
    <a 
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 bg-green-500 hover:bg-green-600 text-white rounded-full p-4 shadow-lg transition-all duration-300 flex items-center justify-center z-50"
      aria-label="Chat no WhatsApp"
    >
      <MessageCircle className="h-6 w-6" />
    </a>
  );
};

export default WhatsAppButton;
