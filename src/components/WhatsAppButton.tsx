
import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useShopSettings } from '@/hooks/useShopSettings';

const WhatsAppButton: React.FC = () => {
  const { shopSettings, loading } = useShopSettings();
  
  // Usar o número de telefone das configurações da barbearia ou um valor padrão
  const phoneNumber = shopSettings?.phone || '5511999999999';
  
  // Remover caracteres não numéricos do número de telefone e adicionar DDI +55 se necessário
  let formattedPhone = phoneNumber.replace(/\D/g, '');
  
  // Se o número não começa com 55 (código do Brasil), adicionar
  if (!formattedPhone.startsWith('55')) {
    formattedPhone = '55' + formattedPhone;
  }
  
  const message = encodeURIComponent('Olá, gostaria de mais informações sobre a Urbana Barbearia!');
  const whatsappUrl = `https://wa.me/${formattedPhone}?text=${message}`;

  // Não mostrar o botão se não tiver configuração de telefone
  if (loading) return null;
  
  // Se não houver número de telefone nas configurações, não mostrar o botão
  if (!shopSettings?.phone) return null;

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
