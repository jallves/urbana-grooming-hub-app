import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Scissors, Check, X } from 'lucide-react';
import { usePainelClienteAuth } from '@/contexts/PainelClienteAuthContext';

export default function PainelClienteCadastro() {
  const navigate = useNavigate();
  const { cadastrar } = usePainelClienteAuth();

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    whatsapp: '',
    senha: '',
    confirmarSenha: ''
  });

  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const validacoesSenha = {
    minimo8: formData.senha.length >= 8,
    maiuscula: /[A-Z]/.test(formData.senha),
    minuscula: /[a-z]/.test(formData.senha),
    numero: /\d/.test(formData.senha),
    especial: /[@$!%*?&]/.test(formData.senha)
  };

  const senhaValida = Object.values(validacoesSenha).every(v => v);
  const senhasIguais = formData.senha === formData.confirmarSenha && formData.confirmarSenha !== '';

  const formatarWhatsApp = (valor: string) => {
    const numero = valor.replace(/\D/g, '');
    if (numero.length <= 2) return numero;
    if (numero.length <= 7) return `(${numero.slice(0, 2)}) ${numero.slice(2)}`;
    if (numero.length <= 11) return `(${numero.slice(0, 2)}) ${numero.slice(2, 7)}-${numero.slice(7)}`;
    return `(${numero.slice(0, 2)}) ${numero.slice(2, 7)}-${numero.slice(7, 11)}`;
  };

  const handleWhatsAppChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valorFormatado = formatarWhatsApp(e.target.value);
    setFormData(prev => ({ ...prev, whatsapp: valorFormatado }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
      nome: formData.nome,
      email: formData.email,
      whatsapp: formData.whatsapp,
      senha: formData.senha
    });

    if (error) {
      setErro(error);
      setLoading(false);
    } else {
      navigate('/painel-cliente/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-black py-12">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex justify-center items-center">
        <Card className="w-full max-w-md bg-gray-900 border-gray-700">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-amber-500 rounded-full">
                <Scissors className="h-8 w-8 text-black" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-white">Criar Conta</CardTitle>
            <p className="text-gray-400">Cadastre-se para agendar seus cortes</p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {erro && (
                <div className="p-3 bg-red-500/20 border border-red-500 rounded-lg">
                  <p className="text-red-400 text-sm">{erro}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="nome" className="text-white">Nome Completo</Label>
                <Input
                  id="nome"
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                  className="bg-gray-800 border-gray-600 text-white"
                  placeholder="Seu nome completo"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="bg-gray-800 border-gray-600 text-white"
                  placeholder="seu.email@exemplo.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsapp" className="text-white">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  type="tel"
                  value={formData.whatsapp}
                  onChange={handleWhatsAppChange}
                  className="bg-gray-800 border-gray-600 text-white"
                  placeholder="(11) 99999-9999"
                  maxLength={15}
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
                    className="bg-gray-800 border-gray-600 text-white pr-10"
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

                {formData.senha && (
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
                    value={formData.confirmarSenha}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmarSenha: e.target.value }))}
                    className={`bg-gray-800 border-gray-600 text-white pr-10 ${
                      formData.confirmarSenha && !senhasIguais ? 'border-red-500' : 
                      formData.confirmarSenha && senhasIguais ? 'border-green-500' : ''
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
                {formData.confirmarSenha && !senhasIguais && (
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
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-400">
                Já tem uma conta?{' '}
                <Link to="/painel-cliente/login" className="text-amber-500 hover:text-amber-400">
                  Fazer login
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

