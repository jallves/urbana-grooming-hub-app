
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Save, Mail, Phone, Edit3, Shield, Calendar } from 'lucide-react';
import { usePainelClienteAuth } from '@/contexts/PainelClienteAuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  PainelClienteCard, 
  PainelClienteCardTitle, 
  PainelClienteCardHeader,
  PainelClienteCardContent 
} from "@/components/painel-cliente/PainelClienteCard";
import { ClientPageContainer } from "@/components/painel-cliente/ClientPageContainer";

export default function PainelClientePerfil() {
  const navigate = useNavigate();
  const { cliente, atualizarPerfil } = usePainelClienteAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    nome: cliente?.nome || '',
    email: cliente?.email || '',
    whatsapp: cliente?.whatsapp || '',
    data_nascimento: cliente?.data_nascimento || ''
  });

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

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
    setLoading(true);

    const { error } = await atualizarPerfil({
      nome: formData.nome,
      email: formData.email,
      whatsapp: formData.whatsapp,
      data_nascimento: formData.data_nascimento
    });

    if (error) {
      setErro(error);
    } else {
      toast({
        title: "Perfil atualizado!",
        description: "Suas informações foram salvas com sucesso.",
      });
      navigate('/painel-cliente/dashboard');
    }

    setLoading(false);
  };

  if (!cliente) {
    navigate('/painel-cliente/login');
    return null;
  }

  // Debug: verificar se o componente está renderizando a versão correta
  console.log('✅ PainelClientePerfil - Versão atualizada (sem max-w-2xl)');

  return (
    <ClientPageContainer>
      {/* Profile Card - Largura igual à Home */}
      <div className="w-full">
        <PainelClienteCard variant="highlight" className="w-full">
          <PainelClienteCardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-urbana-gold/20 rounded-lg">
                <User className="h-5 w-5 text-urbana-gold" />
              </div>
              <div>
                <PainelClienteCardTitle className="text-lg sm:text-xl">
                  Meu Perfil
                </PainelClienteCardTitle>
                <p className="text-xs sm:text-sm text-urbana-light/70">Suas informações pessoais</p>
              </div>
            </div>
          </PainelClienteCardHeader>

          <PainelClienteCardContent className="p-4 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {erro && (
                <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                  <p className="text-red-400 text-sm">{erro}</p>
                </div>
              )}

              {/* Nome */}
              <div className="space-y-2">
                <Label htmlFor="nome" className="text-urbana-light text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4 text-urbana-gold" />
                  Nome Completo
                </Label>
                <Input
                  id="nome"
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                  className="bg-urbana-black/30 border-urbana-gold/30 text-urbana-light h-12 rounded-lg focus:border-urbana-gold focus:ring-1 focus:ring-urbana-gold/20 transition-all"
                  placeholder="Seu nome completo"
                  required
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-urbana-light text-sm font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4 text-urbana-gold" />
                  E-mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="bg-urbana-black/30 border-urbana-gold/30 text-urbana-light h-12 rounded-lg focus:border-urbana-gold focus:ring-1 focus:ring-urbana-gold/20 transition-all"
                  placeholder="seu.email@exemplo.com"
                  required
                />
              </div>

              {/* WhatsApp */}
              <div className="space-y-2">
                <Label htmlFor="whatsapp" className="text-urbana-light text-sm font-medium flex items-center gap-2">
                  <Phone className="h-4 w-4 text-urbana-gold" />
                  WhatsApp
                </Label>
                <Input
                  id="whatsapp"
                  type="tel"
                  value={formData.whatsapp}
                  onChange={handleWhatsAppChange}
                  className="bg-urbana-black/30 border-urbana-gold/30 text-urbana-light h-12 rounded-lg focus:border-urbana-gold focus:ring-1 focus:ring-urbana-gold/20 transition-all"
                  placeholder="(11) 99999-9999"
                  maxLength={15}
                  required
                />
              </div>

              {/* Data de Nascimento */}
              <div className="space-y-2">
                <Label htmlFor="data_nascimento" className="text-urbana-light text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-urbana-gold" />
                  Data de Nascimento
                </Label>
                <Input
                  id="data_nascimento"
                  type="date"
                  value={formData.data_nascimento}
                  onChange={(e) => setFormData(prev => ({ ...prev, data_nascimento: e.target.value }))}
                  className="bg-urbana-black/30 border-urbana-gold/30 text-urbana-light h-12 rounded-lg focus:border-urbana-gold focus:ring-1 focus:ring-urbana-gold/20 transition-all"
                  required
                />
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <Button
                  type="submit"
                  className="w-full bg-urbana-gold hover:bg-urbana-gold/90 text-black font-semibold h-12 rounded-lg shadow-lg transition-all duration-300"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin mr-2" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Salvar Alterações
                    </>
                  )}
                </Button>
              </div>
            </form>
          </PainelClienteCardContent>
        </PainelClienteCard>
      </div>
    </ClientPageContainer>
  );
}
