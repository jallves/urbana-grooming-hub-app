import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTotemAuth } from '@/contexts/TotemAuthContext';
import { TotemPinKeypad } from '@/components/totem/TotemPinKeypad';
import { toast } from 'sonner';

const TotemLogin: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useTotemAuth();

  useEffect(() => {
    document.documentElement.classList.add('totem-mode');
    return () => {
      document.documentElement.classList.remove('totem-mode');
    };
  }, []);

  const handlePinSubmit = async (pin: string) => {
    const success = await login(pin);

    if (success) {
      navigate('/totem/welcome', {
        state: { staffName: 'Equipe Costa Urbana' }
      });
    } else {
      toast.error('PIN incorreto', {
        description: 'Verifique o PIN e tente novamente.'
      });
    }
  };

  return (
    <TotemPinKeypad
      title="Autenticação de Acesso"
      subtitle="Insira o PIN de segurança para acessar o sistema"
      pinLength={4}
      onSubmit={handlePinSubmit}
      showDemoPin={true}
    />
  );
};

export default TotemLogin;
