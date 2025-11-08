import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, X, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import bcrypt from 'bcryptjs';

const TotemCadastro: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const phoneFromSearch = (location.state as any)?.phone || '';
  const action = (location.state as any)?.action;

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    whatsapp: phoneFromSearch,
    data_nascimento: '',
    senha: '',
    confirmarSenha: ''
  });

  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);
  const [loading, setLoading] = useState(false);

  // Add totem-mode class for touch optimization
  React.useEffect(() => {
    document.documentElement.classList.add('totem-mode');
    return () => {
      document.documentElement.classList.remove('totem-mode');
    };
  }, []);

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

    if (!formData.nome.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }
    if (!formData.email.trim()) {
      toast.error('E-mail é obrigatório');
      return;
    }
    if (!formData.whatsapp.trim()) {
      toast.error('WhatsApp é obrigatório');
      return;
    }
    if (!formData.data_nascimento.trim()) {
      toast.error('Data de nascimento é obrigatória');
      return;
    }
    if (!senhaValida) {
      toast.error('Senha não atende aos critérios de segurança');
      return;
    }
    if (!senhasIguais) {
      toast.error('As senhas não coincidem');
      return;
    }

    setLoading(true);

    try {
      // Verificar se email já existe
      const { data: emailExistente } = await supabase
        .from('painel_clientes')
        .select('id')
        .eq('email', formData.email.trim())
        .maybeSingle();

      if (emailExistente) {
        toast.error('E-mail já cadastrado', {
          description: 'Este e-mail já está em uso. Use outro e-mail.',
          duration: 5000
        });
        setLoading(false);
        return;
      }

      // Verificar se WhatsApp já existe
      const { data: whatsappExistente } = await supabase
        .from('painel_clientes')
        .select('id')
        .eq('whatsapp', formData.whatsapp)
        .maybeSingle();

      if (whatsappExistente) {
        toast.error('WhatsApp já cadastrado', {
          description: 'Este número já está em uso. Use outro número.',
          duration: 5000
        });
        setLoading(false);
        return;
      }

      // Criptografar senha
      const senhaCriptografada = await bcrypt.hash(formData.senha, 10);

      // Inserir novo cliente
      const { data: novoCliente, error } = await supabase
        .from('painel_clientes')
        .insert({
          nome: formData.nome.trim(),
          email: formData.email.trim(),
          whatsapp: formData.whatsapp,
          data_nascimento: formData.data_nascimento,
          senha_hash: senhaCriptografada
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao cadastrar cliente:', error);
        toast.error('Erro ao cadastrar', {
          description: 'Não foi possível criar o cadastro. Tente novamente.'
        });
        setLoading(false);
        return;
      }

      toast.success('Cadastro realizado com sucesso!', {
        description: `Bem-vindo, ${formData.nome.split(' ')[0]}!`,
        duration: 3000
      });

      // Redirecionar para o fluxo apropriado
      if (action === 'novo-agendamento') {
        navigate('/totem/servico', {
          state: {
            client: novoCliente
          }
        });
      } else if (action === 'produtos') {
        navigate('/totem/products', {
          state: {
            client: novoCliente
          }
        });
      } else {
        navigate('/totem/home');
      }
    } catch (error) {
      console.error('Erro inesperado:', error);
      toast.error('Erro inesperado', {
        description: 'Ocorreu um erro ao processar seu cadastro.'
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-urbana-dark via-urbana-brown to-urbana-dark flex items-center justify-center p-8">
      <div className="w-full max-w-4xl">
        {/* Header com logo e título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-urbana-gold via-urbana-gold-light to-urbana-gold flex items-center justify-center shadow-2xl shadow-urbana-gold/50">
                <span className="text-4xl font-bold text-urbana-dark">U</span>
              </div>
              <div className="absolute -top-1 -right-1 w-8 h-8 bg-urbana-gold rounded-full border-4 border-urbana-dark"></div>
            </div>
          </div>
          <h1 className="text-5xl font-bold text-urbana-light mb-2">Novo Cadastro</h1>
          <p className="text-xl text-urbana-gold">Preencha seus dados para continuar</p>
        </div>

        {/* Formulário */}
        <div className="bg-white/10 backdrop-blur-3xl border-2 border-urbana-gold/40 rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="nome" className="text-urbana-light text-lg font-semibold">
                  Nome Completo *
                </Label>
                <Input
                  id="nome"
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                  className="bg-white/10 backdrop-blur-sm border-2 border-urbana-gold/30 text-urbana-light text-lg h-14 focus:border-urbana-gold"
                  placeholder="Seu nome completo"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-urbana-light text-lg font-semibold">
                  E-mail *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="bg-white/10 backdrop-blur-sm border-2 border-urbana-gold/30 text-urbana-light text-lg h-14 focus:border-urbana-gold"
                  placeholder="seu.email@exemplo.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsapp" className="text-urbana-light text-lg font-semibold">
                  WhatsApp *
                </Label>
                <Input
                  id="whatsapp"
                  type="tel"
                  value={formData.whatsapp}
                  onChange={handleWhatsAppChange}
                  className="bg-white/10 backdrop-blur-sm border-2 border-urbana-gold/30 text-urbana-light text-lg h-14 focus:border-urbana-gold"
                  placeholder="(11) 99999-9999"
                  maxLength={15}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="data_nascimento" className="text-urbana-light text-lg font-semibold">
                  Data de Nascimento *
                </Label>
                <Input
                  id="data_nascimento"
                  type="date"
                  value={formData.data_nascimento}
                  onChange={(e) => setFormData(prev => ({ ...prev, data_nascimento: e.target.value }))}
                  className="bg-white/10 backdrop-blur-sm border-2 border-urbana-gold/30 text-urbana-light text-lg h-14 focus:border-urbana-gold"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="senha" className="text-urbana-light text-lg font-semibold">
                  Senha *
                </Label>
                <div className="relative">
                  <Input
                    id="senha"
                    type={mostrarSenha ? "text" : "password"}
                    value={formData.senha}
                    onChange={(e) => setFormData(prev => ({ ...prev, senha: e.target.value }))}
                    className="bg-white/10 backdrop-blur-sm border-2 border-urbana-gold/30 text-urbana-light text-lg h-14 focus:border-urbana-gold pr-12"
                    placeholder="Sua senha"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-urbana-gold hover:text-urbana-gold-light"
                  >
                    {mostrarSenha ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
                  </button>
                </div>

                {formData.senha && (
                  <div className="space-y-1 text-sm mt-2">
                    {Object.entries({
                      minimo8: 'Mínimo 8 caracteres',
                      maiuscula: 'Pelo menos 1 maiúscula',
                      minuscula: 'Pelo menos 1 minúscula',
                      numero: 'Pelo menos 1 número',
                      especial: 'Pelo menos 1 caractere especial'
                    }).map(([key, label]) => (
                      <div key={key} className="flex items-center gap-2">
                        {validacoesSenha[key as keyof typeof validacoesSenha] ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <X className="h-4 w-4 text-red-500" />
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
                <Label htmlFor="confirmarSenha" className="text-urbana-light text-lg font-semibold">
                  Confirmar Senha *
                </Label>
                <div className="relative">
                  <Input
                    id="confirmarSenha"
                    type={mostrarConfirmarSenha ? "text" : "password"}
                    value={formData.confirmarSenha}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmarSenha: e.target.value }))}
                    className={`bg-white/10 backdrop-blur-sm border-2 text-urbana-light text-lg h-14 pr-12 ${
                      formData.confirmarSenha && !senhasIguais ? 'border-red-500 focus:border-red-500' : 
                      formData.confirmarSenha && senhasIguais ? 'border-green-500 focus:border-green-500' : 
                      'border-urbana-gold/30 focus:border-urbana-gold'
                    }`}
                    placeholder="Confirme sua senha"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-urbana-gold hover:text-urbana-gold-light"
                  >
                    {mostrarConfirmarSenha ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
                  </button>
                </div>
                {formData.confirmarSenha && !senhasIguais && (
                  <p className="text-red-400 text-sm">As senhas não coincidem</p>
                )}
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                onClick={() => navigate('/totem/search', { state: { action } })}
                className="flex-1 h-16 bg-urbana-brown/50 hover:bg-urbana-brown border-2 border-urbana-gold/30 text-urbana-light text-xl font-semibold"
              >
                <ArrowLeft className="mr-2 h-6 w-6" />
                Voltar
              </Button>
              
              <Button
                type="submit"
                className="flex-1 h-16 bg-gradient-to-r from-urbana-gold via-urbana-gold-light to-urbana-gold hover:opacity-90 text-urbana-dark text-xl font-bold shadow-lg shadow-urbana-gold/50"
                disabled={loading || !senhaValida || !senhasIguais}
              >
                {loading ? 'Cadastrando...' : 'Criar Cadastro'}
              </Button>
            </div>
          </form>
        </div>

        {/* Botão Sistema Exclusivo no canto superior direito */}
        <div className="fixed top-8 right-8">
          <div className="relative inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-urbana-gold via-urbana-gold-light to-urbana-gold rounded-full shadow-lg shadow-urbana-gold/50">
            <div className="absolute -top-1 -left-1 w-3 h-3 bg-urbana-light rounded-full"></div>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-urbana-light rounded-full"></div>
            <span className="text-urbana-dark font-bold text-sm uppercase tracking-wider">
              Sistema Exclusivo
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TotemCadastro;
