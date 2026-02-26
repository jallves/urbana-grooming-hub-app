import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Check, X } from 'lucide-react';
import { DateOfBirthPicker } from '@/components/ui/date-of-birth-picker';
import { format } from 'date-fns';

interface PainelClienteCadastroFormProps {
  onSubmit: (data: {
    nome: string;
    email: string;
    whatsapp: string;
    data_nascimento: string;
    senha: string;
  }) => Promise<void>;
  loading: boolean;
  erro?: string;
}

const PainelClienteCadastroForm: React.FC<PainelClienteCadastroFormProps> = ({ onSubmit, loading, erro }) => {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    whatsapp: '',
    data_nascimento: '',
    senha: '',
    confirmarSenha: ''
  });

  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);

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
    
    if (!senhaValida || !senhasIguais) return;

    const { confirmarSenha, ...dadosCadastro } = formData;
    await onSubmit(dadosCadastro);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {erro && (
        <div className="p-4 bg-red-50 border-2 border-red-400 rounded-xl shadow-md animate-in fade-in slide-in-from-top-2 duration-300">
          <p className="text-red-700 text-sm font-medium text-center leading-relaxed">{erro}</p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="nome" className="text-urbana-gold-dark font-bold">Nome Completo</Label>
        <Input
          id="nome"
          type="text"
          value={formData.nome}
          onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
          className="h-12 border-gray-300 focus:border-urbana-gold focus:ring-urbana-gold rounded-xl"
          placeholder="Seu nome completo"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="emailCadastro" className="text-urbana-gold-dark font-bold">E-mail</Label>
        <Input
          id="emailCadastro"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          className="h-12 border-gray-300 focus:border-urbana-gold focus:ring-urbana-gold rounded-xl"
          placeholder="seu.email@exemplo.com"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="whatsapp" className="text-urbana-gold-dark font-bold">WhatsApp</Label>
        <Input
          id="whatsapp"
          type="tel"
          value={formData.whatsapp}
          onChange={handleWhatsAppChange}
          className="h-12 border-gray-300 focus:border-urbana-gold focus:ring-urbana-gold rounded-xl"
          placeholder="(11) 99999-9999"
          maxLength={15}
          required
        />
      </div>

      <div className="space-y-2">
        <Label className="text-urbana-gold-dark font-bold">Data de Nascimento</Label>
        <DateOfBirthPicker
          value={formData.data_nascimento ? new Date(formData.data_nascimento + 'T12:00:00') : undefined}
          onChange={(date) => setFormData(prev => ({ 
            ...prev, 
            data_nascimento: date ? format(date, 'yyyy-MM-dd') : '' 
          }))}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="senhaCadastro" className="text-urbana-gold-dark font-bold">Senha</Label>
        <div className="relative">
          <Input
            id="senhaCadastro"
            type={mostrarSenha ? "text" : "password"}
            value={formData.senha}
            onChange={(e) => setFormData(prev => ({ ...prev, senha: e.target.value }))}
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

        {formData.senha && (
          <div className="space-y-1 text-xs mt-2">
            {Object.entries({
              minimo8: 'Mínimo 8 caracteres',
              maiuscula: 'Pelo menos 1 maiúscula',
              minuscula: 'Pelo menos 1 minúscula',
              numero: 'Pelo menos 1 número',
              especial: 'Pelo menos 1 caractere especial (@$!%*?&)'
            }).map(([key, label]) => (
              <div key={key} className="flex items-center gap-2">
                {validacoesSenha[key as keyof typeof validacoesSenha] ? (
                  <Check className="h-3 w-3 text-green-600" />
                ) : (
                  <X className="h-3 w-3 text-red-600" />
                )}
                <span className={validacoesSenha[key as keyof typeof validacoesSenha] ? 'text-green-600' : 'text-red-600'}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmarSenha" className="text-urbana-gold-dark font-bold">Confirmar Senha</Label>
        <div className="relative">
          <Input
            id="confirmarSenha"
            type={mostrarConfirmarSenha ? "text" : "password"}
            value={formData.confirmarSenha}
            onChange={(e) => setFormData(prev => ({ ...prev, confirmarSenha: e.target.value }))}
            className={`h-12 border-gray-300 focus:border-urbana-gold focus:ring-urbana-gold rounded-xl pr-12 ${
              formData.confirmarSenha && !senhasIguais ? 'border-red-500' : 
              formData.confirmarSenha && senhasIguais ? 'border-green-500' : ''
            }`}
            placeholder="Confirme sua senha"
            required
          />
          <button
            type="button"
            onClick={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {mostrarConfirmarSenha ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        {formData.confirmarSenha && !senhasIguais && (
          <p className="text-red-600 text-xs">As senhas não coincidem</p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full h-12 bg-gradient-to-r from-urbana-gold to-yellow-600 hover:from-yellow-600 hover:to-urbana-gold text-white font-semibold rounded-xl shadow-md transition-all"
        disabled={loading || !senhaValida || !senhasIguais}
      >
        {loading ? 'Criando conta...' : 'Criar Conta'}
      </Button>
    </form>
  );
};

export default PainelClienteCadastroForm;
