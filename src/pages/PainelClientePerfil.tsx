
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Save, Mail, Phone, Edit3, Shield, Calendar } from 'lucide-react';
import { DateOfBirthPicker } from '@/components/ui/date-of-birth-picker';
import { format } from 'date-fns';
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
    <ClientPageContainer key="perfil-2024-v2">
      {/* Profile Card - Mobile First Responsive */}
      <div className="w-full">
        <PainelClienteCard variant="highlight" className="w-full">
          <PainelClienteCardHeader className="pb-3 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-urbana-gold/20 rounded-lg">
                <User className="h-4 w-4 sm:h-5 sm:w-5 text-urbana-gold" />
              </div>
              <div className="min-w-0">
                <PainelClienteCardTitle className="text-base sm:text-lg lg:text-xl truncate">
                  Meu Perfil
                </PainelClienteCardTitle>
                <p className="text-[11px] sm:text-xs lg:text-sm text-urbana-light/70 truncate">Suas informações pessoais</p>
              </div>
            </div>
          </PainelClienteCardHeader>

          <PainelClienteCardContent className="p-4 sm:p-6 lg:p-8">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              {erro && (
                <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                  <p className="text-red-400 text-sm">{erro}</p>
                </div>
              )}

              {/* Nome */}
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="nome" className="text-urbana-light text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2">
                  <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-urbana-gold flex-shrink-0" />
                  Nome Completo
                </Label>
                <Input
                  id="nome"
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                  className="bg-urbana-black/30 border-urbana-gold/30 text-urbana-light h-11 sm:h-12 rounded-lg focus:border-urbana-gold focus:ring-1 focus:ring-urbana-gold/20 transition-all text-sm sm:text-base"
                  placeholder="Seu nome completo"
                  required
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="email" className="text-urbana-light text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2">
                  <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-urbana-gold flex-shrink-0" />
                  E-mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  disabled
                  className="bg-urbana-black/30 border-urbana-gold/30 text-urbana-light/50 h-11 sm:h-12 rounded-lg cursor-not-allowed opacity-60 text-sm sm:text-base"
                  placeholder="seu.email@exemplo.com"
                />
                <p className="text-[10px] sm:text-xs text-urbana-light/50">Para alterar o e-mail, entre em contato com o administrador.</p>
              </div>

              {/* WhatsApp */}
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="whatsapp" className="text-urbana-light text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2">
                  <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-urbana-gold flex-shrink-0" />
                  WhatsApp
                </Label>
                <Input
                  id="whatsapp"
                  type="tel"
                  value={formData.whatsapp}
                  onChange={handleWhatsAppChange}
                  className="bg-urbana-black/30 border-urbana-gold/30 text-urbana-light h-11 sm:h-12 rounded-lg focus:border-urbana-gold focus:ring-1 focus:ring-urbana-gold/20 transition-all text-sm sm:text-base"
                  placeholder="(11) 99999-9999"
                  maxLength={15}
                  required
                />
              </div>

              {/* Data de Nascimento */}
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-urbana-light text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2">
                  <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-urbana-gold flex-shrink-0" />
                  Data de Nascimento
                </Label>
                <DateOfBirthPicker
                  value={formData.data_nascimento ? new Date(formData.data_nascimento + 'T12:00:00') : undefined}
                  onChange={(date) => setFormData(prev => ({ 
                    ...prev, 
                    data_nascimento: date ? format(date, 'yyyy-MM-dd') : '' 
                  }))}
                  className="bg-urbana-black/30 border-urbana-gold/30 text-urbana-light h-11 sm:h-12 rounded-lg focus:border-urbana-gold focus:ring-1 focus:ring-urbana-gold/20 transition-all text-sm sm:text-base"
                />
              </div>

              {/* Submit Button - Mobile Optimized */}
              <div className="pt-3 sm:pt-4">
                <Button
                  type="submit"
                  className="w-full bg-urbana-gold hover:bg-urbana-gold/90 text-black font-semibold h-11 sm:h-12 rounded-lg shadow-lg transition-all duration-300 text-sm sm:text-base touch-manipulation"
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
