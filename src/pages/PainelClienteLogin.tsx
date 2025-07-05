
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Scissors, ArrowLeft, Home, Check, X } from 'lucide-react';
import { usePainelClienteAuth } from '@/contexts/PainelClienteAuthContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function PainelClienteLogin() {
  const navigate = useNavigate();
  const { login, cadastrar } = usePainelClienteAuth();

  const [mostrarCadastro, setMostrarCadastro] = useState(false);
  const [formDataLogin, setFormDataLogin] = useState({
    email: '',
    senha: ''
  });

  const [formDataCadastro, setFormDataCadastro] = useState({
    nome: '',
    email: '',
    whatsapp: '',
    senha: '',
    confirmarSenha: ''
  });

  const [mostrarSenhaLogin, setMostrarSenhaLogin] = useState(false);
  const [mostrarSenhaCadastro, setMostrarSenhaCadastro] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  // Validações de senha para cadastro
  const validacoesSenha = {
    minimo8: formDataCadastro.senha.length >= 8,
    maiuscula: /[A-Z]/.test(formDataCadastro.senha),
    minuscula: /[a-z]/.test(formDataCadastro.senha),
    numero: /\d/.test(formDataCadastro.senha),
    especial: /[@$!%*?&]/.test(formDataCadastro.senha)
  };

  const senhaValida = Object.values(validacoesSenha).every(v => v);
  const senhasIguais = formDataCadastro.senha === formDataCadastro.confirmarSenha && formDataCadastro.confirmarSenha !== '';

  const formatarWhatsApp = (valor: string) => {
    const numero = valor.replace(/\D/g, '');
    if (numero.length <= 2) return numero;
    if (numero.length <= 7) return `(${numero.slice(0, 2)}) ${numero.slice(2)}`;
    if (numero.length <= 11) return `(${numero.slice(0, 2)}) ${numero.slice(2, 7)}-${numero.slice(7)}`;
    return `(${numero.slice(0, 2)}) ${numero.slice(2, 7)}-${numero.slice(7, 11)}`;
  };

  const handleWhatsAppChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valorFormatado = formatarWhatsApp(e.target.value);
    setFormDataCadastro(prev => ({ ...prev, whatsapp: valorFormatado }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setLoading(true);

    const { error } = await login(formDataLogin.email, formDataLogin.senha);

    if (error) {
      if (error.includes('incorretos') || error.includes('inválido')) {
        setErro('Email ou senha incorretos. Caso não tenha conta, cadastre-se abaixo.');
        setMostrarCadastro(true);
      } else {
        setErro(error);
      }
      setLoading(false);
    } else {
      navigate('/painel-cliente/dashboard');
    }
  };

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');

    if (!senhaValida) {
      setErro('Senha não atende aos critérios de segurança');
      return;
    }

    if (!senhasIguais) {
      setErro('As senhas não coincidem');
      return;
    }

    setLoading(true);

    const { error } = await cadastrar({
      nome: formDataCadastro.nome,
      email: formDataCadastro.email,
      whatsapp: formDataCadastro.whatsapp,
      senha: formDataCadastro.senha
    });

    if (error) {
      setErro(error);
      setLoading(false);
    } else {
      navigate('/painel-cliente/dashboard');
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-zinc-950 to-zinc-900 flex flex-col items-center justify-center px-4 py-8">
      {/* Header com botão voltar */}
      <div className="w-full max-w-md mb-4">
        <div className="flex items-center justify-between">
          <Button
            onClick={() => navigate('/')}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white hover:bg-zinc-800/50 rounded-xl px-4 py-2"
          >
            <Home className="h-4 w-4 mr-2" />
            Página Inicial
          </Button>
        </div>
      </div>

      <div className="w-full max-w-md">
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
              <CardTitle className="text-3xl font-bold text-white">
                {mostrarCadastro ? 'Criar Conta' : 'Entrar'}
              </CardTitle>
              <p className="text-gray-400 text-sm">
                {mostrarCadastro ? 'Cadastre-se para agendar seus cortes' : 'Acesse sua conta para gerenciar agendamentos'}
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              <AnimatePresence mode="wait">
                {!mostrarCadastro ? (
                  <motion.form
                    key="login"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    onSubmit={handleLogin}
                    className="space-y-4"
                  >
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
                        value={formDataLogin.email}
                        onChange={(e) => setFormDataLogin(prev => ({ ...prev, email: e.target.value }))}
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
                          type={mostrarSenhaLogin ? "text" : "password"}
                          value={formDataLogin.senha}
                          onChange={(e) => setFormDataLogin(prev => ({ ...prev, senha: e.target.value }))}
                          className="bg-zinc-800 border-zinc-600 text-white pr-10"
                          placeholder="Sua senha"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setMostrarSenhaLogin(!mostrarSenhaLogin)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                        >
                          {mostrarSenhaLogin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                  </motion.form>
                ) : (
                  <motion.form
                    key="cadastro"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    onSubmit={handleCadastro}
                    className="space-y-4"
                  >
                    {erro && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-3 bg-red-500/20 border border-red-500 rounded-lg"
                      >
                        <p className="text-red-400 text-sm">{erro}</p>
                      </motion.div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="nome" className="text-white">Nome Completo</Label>
                      <Input
                        id="nome"
                        type="text"
                        value={formDataCadastro.nome}
                        onChange={(e) => setFormDataCadastro(prev => ({ ...prev, nome: e.target.value }))}
                        className="bg-zinc-800 border-zinc-600 text-white"
                        placeholder="Seu nome completo"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="emailCadastro" className="text-white">E-mail</Label>
                      <Input
                        id="emailCadastro"
                        type="email"
                        value={formDataCadastro.email}
                        onChange={(e) => setFormDataCadastro(prev => ({ ...prev, email: e.target.value }))}
                        className="bg-zinc-800 border-zinc-600 text-white"
                        placeholder="seu.email@exemplo.com"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="whatsapp" className="text-white">WhatsApp</Label>
                      <Input
                        id="whatsapp"
                        type="tel"
                        value={formDataCadastro.whatsapp}
                        onChange={handleWhatsAppChange}
                        className="bg-zinc-800 border-zinc-600 text-white"
                        placeholder="(11) 99999-9999"
                        maxLength={15}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="senhaCadastro" className="text-white">Senha</Label>
                      <div className="relative">
                        <Input
                          id="senhaCadastro"
                          type={mostrarSenhaCadastro ? "text" : "password"}
                          value={formDataCadastro.senha}
                          onChange={(e) => setFormDataCadastro(prev => ({ ...prev, senha: e.target.value }))}
                          className="bg-zinc-800 border-zinc-600 text-white pr-10"
                          placeholder="Sua senha"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setMostrarSenhaCadastro(!mostrarSenhaCadastro)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                        >
                          {mostrarSenhaCadastro ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>

                      {formDataCadastro.senha && (
                        <div className="space-y-1 text-xs">
                          {Object.entries({
                            minimo8: 'Mínimo 8 caracteres',
                            maiuscula: 'Pelo menos 1 maiúscula',
                            minuscula: 'Pelo menos 1 minúscula',
                            numero: 'Pelo menos 1 número',
                            especial: 'Pelo menos 1 caractere especial'
                          }).map(([key, label]) => (
                            <div key={key} className="flex items-center gap-2">
                              {validacoesSenha[key as keyof typeof validacoesSenha] ? (
                                <Check className="h-3 w-3 text-green-500" />
                              ) : (
                                <X className="h-3 w-3 text-red-500" />
                              )}
                              <span className={validacoesSenha[key as keyof typeof validacoesSenha] ? 'text-green-400' : 'text-red-400'}>
                                {label}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmarSenha" className="text-white">Confirmar Senha</Label>
                      <div className="relative">
                        <Input
                          id="confirmarSenha"
                          type={mostrarConfirmarSenha ? "text" : "password"}
                          value={formDataCadastro.confirmarSenha}
                          onChange={(e) => setFormDataCadastro(prev => ({ ...prev, confirmarSenha: e.target.value }))}
                          className={`bg-zinc-800 border-zinc-600 text-white pr-10 ${
                            formDataCadastro.confirmarSenha && !senhasIguais ? 'border-red-500' : 
                            formDataCadastro.confirmarSenha && senhasIguais ? 'border-green-500' : ''
                          }`}
                          placeholder="Confirme sua senha"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                        >
                          {mostrarConfirmarSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {formDataCadastro.confirmarSenha && !senhasIguais && (
                        <p className="text-red-400 text-xs">As senhas não coincidem</p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold"
                      disabled={loading || !senhaValida || !senhasIguais}
                    >
                      {loading ? 'Criando conta...' : 'Criar Conta'}
                    </Button>
                  </motion.form>
                )}
              </AnimatePresence>

              <div className="mt-6 text-center space-y-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setMostrarCadastro(!mostrarCadastro);
                    setErro('');
                  }}
                  className="text-amber-500 hover:text-amber-400 font-medium hover:bg-amber-500/10 rounded-xl"
                >
                  {mostrarCadastro ? 'Já tem uma conta? Fazer login' : 'Não tem uma conta? Criar conta'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
