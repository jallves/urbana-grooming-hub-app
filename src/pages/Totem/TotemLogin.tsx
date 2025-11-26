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
    console.log('📱 [TotemLogin] Iniciando handlePinSubmit com PIN:', pin);
    try {
      console.log('📱 [TotemLogin] Chamando login()...');
      const success = await login(pin);
      console.log('📱 [TotemLogin] Resultado do login:', success);

      if (success) {
        console.log('📱 [TotemLogin] Login bem-sucedido, navegando...');
        navigate('/totem/welcome', {
          state: { staffName: 'Equipe Costa Urbana' }
        });
      } else {
        console.log('📱 [TotemLogin] Login falhou, mostrando erro');
        toast.error('PIN incorreto', {
          description: 'Verifique o PIN e tente novamente.'
        });
      }
    } catch (error) {
      console.error('❌ [TotemLogin] Erro ao processar login:', error);
      toast.error('Erro ao fazer login', {
        description: 'Ocorreu um erro inesperado.'
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
