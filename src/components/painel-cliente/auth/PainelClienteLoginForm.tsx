import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, KeyRound } from 'lucide-react';

interface PainelClienteLoginFormProps {
  onSubmit: (email: string, senha: string) => Promise<void>;
  loading: boolean;
  erro?: string;
}

const PainelClienteLoginForm: React.FC<PainelClienteLoginFormProps> = ({ onSubmit, loading, erro }) => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(email, senha);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {erro && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-red-600 text-sm text-center">{erro}</p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email" className="text-gray-700 font-medium">E-mail</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-12 border-gray-300 focus:border-urbana-gold focus:ring-urbana-gold rounded-xl"
          placeholder="seu.email@exemplo.com"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="senha" className="text-gray-700 font-medium">Senha</Label>
        <div className="relative">
          <Input
            id="senha"
            type={mostrarSenha ? "text" : "password"}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="h-12 border-gray-300 focus:border-urbana-gold focus:ring-urbana-gold rounded-xl pr-12"
            placeholder="Sua senha"
            required
          />
          <button
            type="button"
            onClick={() => setMostrarSenha(!mostrarSenha)}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {mostrarSenha ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full h-12 bg-gradient-to-r from-urbana-gold to-yellow-600 hover:from-yellow-600 hover:to-urbana-gold text-white font-semibold rounded-xl shadow-md transition-all"
        disabled={loading}
      >
        {loading ? 'Entrando...' : 'Entrar'}
      </Button>

      <Link to="/painel-cliente/forgot-password">
        <Button 
          type="button"
          variant="ghost" 
          className="w-full text-gray-600 hover:text-urbana-gold hover:bg-gray-50 h-12 rounded-xl transition-all"
          disabled={loading}
        >
          <KeyRound className="h-4 w-4 mr-2" />
          Esqueceu sua senha?
        </Button>
      </Link>
    </form>
  );
};

export default PainelClienteLoginForm;
