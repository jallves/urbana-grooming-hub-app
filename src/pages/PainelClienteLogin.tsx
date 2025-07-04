import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Scissors } from 'lucide-react';
import { usePainelClienteAuth } from '@/contexts/PainelClienteAuthContext';
import { motion } from 'framer-motion';

export default function PainelClienteLogin() {
  const navigate = useNavigate();
  const { login } = usePainelClienteAuth();

  const [formData, setFormData] = useState({
    email: '',
    senha: ''
  });

  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setLoading(true);

    const { error } = await login(formData.email, formData.senha);

    if (error) {
      setErro(error);
      setLoading(false);
    } else {
      navigate('/painel-cliente/dashboard');
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-zinc-950 to-zinc-900 flex items-center justify-center px-4">
      <div className="w-full sm:max-w-md md:max-w-lg lg:max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="bg-zinc-900 border border-zinc-700 shadow-2xl backdrop-blur-lg px-6 py-6">
            <CardHeader className="text-center space-y-2">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-amber-500 rounded-full shadow-lg">
                  <Scissors className="h-8 w-8 text-black" />
                </div>
              </div>
              <CardTitle className="text-3xl font-bold text-white">Entrar</CardTitle>
              <p className="text-gray-400 text-sm">Acesse sua conta para gerenciar agendamentos</p>
            </CardHeader>

            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {erro && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-3 bg-red-500/20 border border-red-500 rounded-lg"
                  >
                    <p className="text-red-400 text-sm text-center">{erro}</p>
                  </motion.div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="bg-zinc-800 border-zinc-600 text-white"
                    placeholder="seu.email@exemplo.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="senha" className="text-white">Senha</Label>
                  <div className="relative">
                    <Input
                      id="senha"
                      type={mostrarSenha ? "text" : "password"}
                      value={formData.senha}
                      onChange={(e) => setFormData(prev => ({ ...prev, senha: e.target.value }))}
                      className="bg-zinc-800 border-zinc-600 text-white pr-10"
                      placeholder="Sua senha"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarSenha(!mostrarSenha)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {mostrarSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold shadow-md"
                  disabled={loading}
                >
                  {loading ? 'Entrando...' : 'Entrar'}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-gray-400 text-sm">
                  Não tem uma conta?{' '}
                  <Link to="/painel-cliente/cadastro" className="text-amber-500 hover:text-amber-400 font-medium">
                    Criar conta
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
