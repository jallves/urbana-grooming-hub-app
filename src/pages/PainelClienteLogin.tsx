import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import { usePainelClienteAuth } from '@/contexts/PainelClienteAuthContext';
import AuthContainer from '@/components/ui/containers/AuthContainer';
import PainelClienteLoginForm from '@/components/painel-cliente/auth/PainelClienteLoginForm';
import PainelClienteCadastroForm from '@/components/painel-cliente/auth/PainelClienteCadastroForm';

export default function PainelClienteLogin() {
  const navigate = useNavigate();
  const { login, cadastrar } = usePainelClienteAuth();

  const [mostrarCadastro, setMostrarCadastro] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const handleLogin = async (email: string, senha: string) => {
    setErro('');
    setLoading(true);

    const { error } = await login(email, senha);

    if (error) {
      if (error.includes('incorretos') || error.includes('inválido')) {
        setErro('Email ou senha incorretos. Caso não tenha conta, cadastre-se abaixo.');
      } else {
        setErro(error);
      }
      setLoading(false);
    } else {
      navigate('/painel-cliente/dashboard');
    }
  };

  const handleCadastro = async (data: {
    nome: string;
    email: string;
    whatsapp: string;
    data_nascimento: string;
    senha: string;
  }) => {
    setErro('');
    setLoading(true);

    const { error } = await cadastrar(data);

    if (error) {
      setErro(error);
      setLoading(false);
    } else {
      navigate('/painel-cliente/dashboard');
    }
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <AuthContainer
      title="Costa Urbana"
      subtitle={mostrarCadastro ? 'Crie sua conta' : 'Área do Cliente'}
    >
      <div className="w-full space-y-6">
        {!mostrarCadastro ? (
          <PainelClienteLoginForm
            onSubmit={handleLogin}
            loading={loading}
            erro={erro}
          />
        ) : (
          <PainelClienteCadastroForm
            onSubmit={handleCadastro}
            loading={loading}
            erro={erro}
          />
        )}

        <div className="text-center space-y-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setMostrarCadastro(!mostrarCadastro);
              setErro('');
            }}
            className="text-urbana-gold hover:text-yellow-600 font-medium hover:bg-urbana-gold/10 rounded-xl transition-all"
          >
            {mostrarCadastro ? 'Já tem uma conta? Fazer login' : 'Não tem uma conta? Criar conta'}
          </Button>
        </div>

        <Button
          variant="outline"
          className="w-full border-urbana-gold/30 bg-urbana-black/30 text-urbana-light hover:bg-urbana-gold/20 hover:text-urbana-gold hover:border-urbana-gold/50 h-12 rounded-xl transition-all"
          onClick={handleGoHome}
        >
          <Home className="h-4 w-4 mr-2" />
          Voltar ao site
        </Button>
      </div>
    </AuthContainer>
  );
}
