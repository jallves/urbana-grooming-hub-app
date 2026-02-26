import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, X, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { DateOfBirthPicker } from '@/components/ui/date-of-birth-picker';
import { format } from 'date-fns';
import { usePainelClienteAuth } from '@/contexts/PainelClienteAuthContext';

const TotemCadastro: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cadastrar } = usePainelClienteAuth();
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
      // Criar usuário via Supabase Auth (o contexto PainelClienteAuthContext já usa o método correto)
      const { error: signUpError } = await cadastrar({
        nome: formData.nome.trim(),
        email: formData.email.trim(),
        whatsapp: formData.whatsapp,
        data_nascimento: formData.data_nascimento,
        senha: formData.senha
      });

      if (signUpError) {
        console.error('Erro ao cadastrar:', signUpError);
        toast.error('Erro ao cadastrar', {
          description: signUpError || 'Não foi possível criar o cadastro.',
          duration: 5000
        });
        setLoading(false);
        return;
      }

      toast.success('Cadastro realizado com sucesso!', {
        description: `Bem-vindo, ${formData.nome.split(' ')[0]}!`,
        duration: 3000
      });

      // Buscar dados do cliente recém-criado
      const { data: { user } } = await supabase.auth.getUser();
      const { data: novoCliente } = await supabase
        .from('painel_clientes')
        .select('*')
        .eq('email', formData.email.trim())
        .single();

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
    <div className="fixed inset-0 w-screen h-screen overflow-y-auto">
      {/* Background com imagem */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/barbearia-background.jpg)' }}
      />
      
      {/* Overlay escuro */}
      <div className="fixed inset-0 bg-gradient-to-br from-black/80 via-black/70 to-black/80" />

      {/* Efeito de brilho animado */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-urbana-gold/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-urbana-gold/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Conteúdo */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-5xl">
          {/* Header com logo e título */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="inline-flex items-center justify-center mb-6">
              <div className="relative">
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-urbana-gold via-urbana-gold-light to-urbana-gold flex items-center justify-center shadow-[0_0_50px_rgba(218,165,32,0.6)] animate-pulse">
                  <img 
                    src="/logo-costa-urbana-new.png" 
                    alt="Costa Urbana" 
                    className="w-20 h-20 object-contain"
                  />
                </div>
              </div>
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold text-white mb-3 drop-shadow-2xl">
              Novo Cadastro
            </h1>
            <p className="text-xl sm:text-2xl text-urbana-gold font-light">
              Preencha seus dados para continuar
            </p>
          </div>

          {/* Card glassmorphism */}
          <div className="bg-black/40 backdrop-blur-2xl border-2 border-urbana-gold/30 rounded-3xl p-8 sm:p-10 shadow-[0_8px_32px_rgba(0,0,0,0.6)] hover:border-urbana-gold/50 transition-all duration-300 animate-scale-in">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="nome" className="text-white text-lg font-semibold">
                    Nome Completo *
                  </Label>
                  <Input
                    id="nome"
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                    className="bg-white/10 backdrop-blur-sm border-2 border-white/20 text-white placeholder:text-white/50 text-lg h-14 focus:border-urbana-gold focus:ring-2 focus:ring-urbana-gold/50 rounded-xl transition-all"
                    placeholder="Seu nome completo"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white text-lg font-semibold">
                    E-mail *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="bg-white/10 backdrop-blur-sm border-2 border-white/20 text-white placeholder:text-white/50 text-lg h-14 focus:border-urbana-gold focus:ring-2 focus:ring-urbana-gold/50 rounded-xl transition-all"
                    placeholder="seu.email@exemplo.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsapp" className="text-white text-lg font-semibold">
                    WhatsApp *
                  </Label>
                  <Input
                    id="whatsapp"
                    type="tel"
                    value={formData.whatsapp}
                    onChange={handleWhatsAppChange}
                    className="bg-white/10 backdrop-blur-sm border-2 border-white/20 text-white placeholder:text-white/50 text-lg h-14 focus:border-urbana-gold focus:ring-2 focus:ring-urbana-gold/50 rounded-xl transition-all"
                    placeholder="(11) 99999-9999"
                    maxLength={15}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white text-lg font-semibold">
                    Data de Nascimento *
                  </Label>
                  <DateOfBirthPicker
                    value={formData.data_nascimento ? new Date(formData.data_nascimento + 'T12:00:00') : undefined}
                    onChange={(date) => setFormData(prev => ({ 
                      ...prev, 
                      data_nascimento: date ? format(date, 'yyyy-MM-dd') : '' 
                    }))}
                    className="bg-white/10 backdrop-blur-sm border-2 border-white/20 text-white placeholder:text-white/50 text-lg h-14 focus:border-urbana-gold focus:ring-2 focus:ring-urbana-gold/50 rounded-xl transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="senha" className="text-white text-lg font-semibold">
                    Senha *
                  </Label>
                  <div className="relative">
                    <Input
                      id="senha"
                      type={mostrarSenha ? "text" : "password"}
                      value={formData.senha}
                      onChange={(e) => setFormData(prev => ({ ...prev, senha: e.target.value }))}
                      className="bg-white/10 backdrop-blur-sm border-2 border-white/20 text-white placeholder:text-white/50 text-lg h-14 focus:border-urbana-gold focus:ring-2 focus:ring-urbana-gold/50 rounded-xl transition-all pr-12"
                      placeholder="Sua senha"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarSenha(!mostrarSenha)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-urbana-gold hover:text-urbana-gold-light transition-colors"
                    >
                      {mostrarSenha ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
                    </button>
                  </div>

                  {formData.senha && (
                    <div className="space-y-2 text-sm mt-3 bg-black/30 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                      {Object.entries({
                        minimo8: 'Mínimo 8 caracteres',
                        maiuscula: 'Pelo menos 1 maiúscula',
                        minuscula: 'Pelo menos 1 minúscula',
                        numero: 'Pelo menos 1 número',
                        especial: 'Pelo menos 1 caractere especial'
                      }).map(([key, label]) => (
                        <div key={key} className="flex items-center gap-2">
                          {validacoesSenha[key as keyof typeof validacoesSenha] ? (
                            <Check className="h-4 w-4 text-green-400 flex-shrink-0" />
                          ) : (
                            <X className="h-4 w-4 text-red-400 flex-shrink-0" />
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
                  <Label htmlFor="confirmarSenha" className="text-white text-lg font-semibold">
                    Confirmar Senha *
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmarSenha"
                      type={mostrarConfirmarSenha ? "text" : "password"}
                      value={formData.confirmarSenha}
                      onChange={(e) => setFormData(prev => ({ ...prev, confirmarSenha: e.target.value }))}
                      className={`bg-white/10 backdrop-blur-sm border-2 text-white placeholder:text-white/50 text-lg h-14 rounded-xl transition-all pr-12 ${
                        formData.confirmarSenha && !senhasIguais ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/50' : 
                        formData.confirmarSenha && senhasIguais ? 'border-green-500 focus:border-green-500 focus:ring-2 focus:ring-green-500/50' : 
                        'border-white/20 focus:border-urbana-gold focus:ring-2 focus:ring-urbana-gold/50'
                      }`}
                      placeholder="Confirme sua senha"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-urbana-gold hover:text-urbana-gold-light transition-colors"
                    >
                      {mostrarConfirmarSenha ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
                    </button>
                  </div>
                  {formData.confirmarSenha && !senhasIguais && (
                    <p className="text-red-400 text-sm flex items-center gap-2">
                      <X className="h-4 w-4" />
                      As senhas não coincidem
                    </p>
                  )}
                  {formData.confirmarSenha && senhasIguais && (
                    <p className="text-green-400 text-sm flex items-center gap-2">
                      <Check className="h-4 w-4" />
                      Senhas conferem
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <Button
                  type="button"
                  onClick={() => navigate('/totem/search', { state: { action } })}
                  className="flex-1 h-16 bg-white/10 backdrop-blur-sm hover:bg-white/20 border-2 border-white/30 hover:border-white/50 text-white text-xl font-semibold rounded-xl transition-all shadow-lg"
                >
                  <ArrowLeft className="mr-2 h-6 w-6" />
                  Voltar
                </Button>
                
                <Button
                  type="submit"
                  className="flex-1 h-16 bg-gradient-to-r from-urbana-gold via-urbana-gold-light to-urbana-gold hover:shadow-[0_0_40px_rgba(218,165,32,0.6)] text-black text-xl font-bold rounded-xl transition-all shadow-lg shadow-urbana-gold/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading || !senhaValida || !senhasIguais}
                >
                  {loading ? 'Cadastrando...' : 'Criar Cadastro'}
                </Button>
              </div>
            </form>
          </div>

          {/* Badge Sistema Exclusivo */}
          <div className="fixed top-6 right-6 sm:top-8 sm:right-8 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="relative inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-urbana-gold via-urbana-gold-light to-urbana-gold rounded-full shadow-[0_0_30px_rgba(218,165,32,0.5)]">
              <span className="text-black font-bold text-sm uppercase tracking-wider">
                Sistema Exclusivo
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TotemCadastro;
