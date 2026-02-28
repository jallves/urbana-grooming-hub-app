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

  const inputClasses = "h-12 bg-urbana-black/60 border-urbana-gold/20 text-urbana-light placeholder:text-urbana-gray-light/50 focus:border-urbana-gold focus:ring-urbana-gold/30 rounded-xl";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {erro && (
        <div className="p-4 bg-red-500/10 border border-red-500/40 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
          <p className="text-red-400 text-sm font-medium text-center leading-relaxed">{erro}</p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="nome" className="text-urbana-gold font-bold text-sm">Nome Completo</Label>
        <Input
          id="nome"
          type="text"
          value={formData.nome}
          onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
          className={inputClasses}
          placeholder="Seu nome completo"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="emailCadastro" className="text-urbana-gold font-bold text-sm">E-mail</Label>
        <Input
          id="emailCadastro"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          className={inputClasses}
          placeholder="seu.email@exemplo.com"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="whatsapp" className="text-urbana-gold font-bold text-sm">WhatsApp</Label>
        <Input
          id="whatsapp"
          type="tel"
          value={formData.whatsapp}
          onChange={handleWhatsAppChange}
          className={inputClasses}
          placeholder="(11) 99999-9999"
          maxLength={15}
          required
        />
      </div>

      <div className="space-y-2">
        <Label className="text-urbana-gold font-bold text-sm">Data de Nascimento</Label>
        <DateOfBirthPicker
          value={formData.data_nascimento ? new Date(formData.data_nascimento + 'T12:00:00') : undefined}
          onChange={(date) => setFormData(prev => ({ 
            ...prev, 
            data_nascimento: date ? format(date, 'yyyy-MM-dd') : '' 
          }))}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="senhaCadastro" className="text-urbana-gold font-bold text-sm">Senha</Label>
        <div className="relative">
          <Input
            id="senhaCadastro"
            type={mostrarSenha ? "text" : "password"}
            value={formData.senha}
            onChange={(e) => setFormData(prev => ({ ...prev, senha: e.target.value }))}
            className={`${inputClasses} pr-12`}
            placeholder="Sua senha"
            required
          />
          <button
            type="button"
            onClick={() => setMostrarSenha(!mostrarSenha)}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-urbana-gray-light hover:text-urbana-gold transition-colors"
          >
            {mostrarSenha ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>

        {formData.senha && (
          <div className="space-y-1 text-xs mt-2 bg-urbana-black/40 rounded-lg p-3 border border-urbana-gold/10">
            {Object.entries({
              minimo8: 'Mínimo 8 caracteres',
              maiuscula: 'Pelo menos 1 maiúscula',
              minuscula: 'Pelo menos 1 minúscula',
              numero: 'Pelo menos 1 número',
              especial: 'Pelo menos 1 caractere especial (@$!%*?&)'
            }).map(([key, label]) => (
              <div key={key} className="flex items-center gap-2">
                {validacoesSenha[key as keyof typeof validacoesSenha] ? (
                  <Check className="h-3 w-3 text-emerald-400" />
                ) : (
                  <X className="h-3 w-3 text-red-400" />
                )}
                <span className={validacoesSenha[key as keyof typeof validacoesSenha] ? 'text-emerald-400' : 'text-red-400'}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmarSenha" className="text-urbana-gold font-bold text-sm">Confirmar Senha</Label>
        <div className="relative">
          <Input
            id="confirmarSenha"
            type={mostrarConfirmarSenha ? "text" : "password"}
            value={formData.confirmarSenha}
            onChange={(e) => setFormData(prev => ({ ...prev, confirmarSenha: e.target.value }))}
            className={`${inputClasses} pr-12 ${
              formData.confirmarSenha && !senhasIguais ? 'border-red-500/60' : 
              formData.confirmarSenha && senhasIguais ? 'border-emerald-500/60' : ''
            }`}
            placeholder="Confirme sua senha"
            required
          />
          <button
            type="button"
            onClick={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-urbana-gray-light hover:text-urbana-gold transition-colors"
          >
            {mostrarConfirmarSenha ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        {formData.confirmarSenha && !senhasIguais && (
          <p className="text-red-400 text-xs">As senhas não coincidem</p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full h-12 bg-gradient-to-r from-urbana-gold to-urbana-gold-dark hover:from-urbana-gold-dark hover:to-urbana-gold text-urbana-black font-bold rounded-xl shadow-lg shadow-urbana-gold/20 transition-all"
        disabled={loading || !senhaValida || !senhasIguais}
      >
        {loading ? 'Criando conta...' : 'Criar Conta'}
      </Button>
    </form>
  );
};

export default PainelClienteCadastroForm;
