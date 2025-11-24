
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, User, Save, Mail, Phone, Edit3, Shield, Calendar } from 'lucide-react';
import { usePainelClienteAuth } from '@/contexts/PainelClienteAuthContext';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  return (
    <>
      {/* Header - Largura Total */}
      <div className="w-full px-4 sm:px-6 lg:px-8 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          <Button
            onClick={() => navigate('/painel-cliente/dashboard')}
            variant="ghost"
            size="sm"
            className="text-urbana-light hover:bg-urbana-gold/10 hover:text-urbana-gold rounded-2xl px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base transition-all duration-300"
          >
            <ArrowLeft className="h-4 w-4 mr-1 sm:mr-2" />
            Voltar
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-urbana-gold drop-shadow-lg">
              Editar Perfil
            </h1>
            <p className="text-urbana-light/70 text-sm sm:text-base mt-1 sm:mt-2 drop-shadow-md">Mantenha suas informações sempre atualizadas</p>
          </div>
        </div>
      </div>

      {/* Content - Com Container Limitado */}
      <ClientPageContainer>

      {/* Profile Card */}
      <div className="mt-4 sm:mt-6 max-w-5xl mx-auto">
          <PainelClienteCard variant="highlight" icon={Edit3}>
            <PainelClienteCardHeader className="pb-6">
              <PainelClienteCardTitle>
                Suas Informações
              </PainelClienteCardTitle>
              <p className="text-sm text-urbana-light/70">Dados pessoais e contato</p>
            </PainelClienteCardHeader>

                            <PainelClienteCardContent className="p-8 sm:p-10">
                              <form onSubmit={handleSubmit} className="space-y-10">
                {erro && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-red-500/20 border border-red-500/50 rounded-2xl backdrop-blur-sm"
                  >
                    <p className="text-red-400 text-sm font-medium">{erro}</p>
                  </motion.div>
                )}

                <div className="space-y-10">
                  {/* Nome */}
                  <motion.div 
                    variants={itemVariants}
                    className="space-y-3"
                  >
                                      <Label htmlFor="nome" className="text-urbana-light text-lg font-semibold flex items-center gap-3">
                                        <div className="p-3 bg-urbana-gold/20 rounded-xl">
                                          <User className="h-5 w-5 text-urbana-gold" />
                                        </div>
                                        Nome Completo
                                      </Label>
                                      <Input
                                        id="nome"
                                        type="text"
                                        value={formData.nome}
                                        onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                                        className="bg-urbana-black/30 border-urbana-gold/30 text-urbana-light h-16 text-lg rounded-2xl backdrop-blur-sm hover:border-urbana-gold/50 transition-all duration-300 focus:border-urbana-gold focus:ring-2 focus:ring-urbana-gold/20"
                                        placeholder="Seu nome completo"
                                        required
                                      />
                  </motion.div>

                  {/* Email */}
                  <motion.div 
                    variants={itemVariants}
                    className="space-y-3"
                  >
                    <Label htmlFor="email" className="text-urbana-light text-lg font-semibold flex items-center gap-3">
                      <div className="p-3 bg-urbana-gold/20 rounded-xl">
                        <Mail className="h-5 w-5 text-urbana-gold" />
                      </div>
                      E-mail
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="bg-urbana-black/30 border-urbana-gold/30 text-urbana-light h-16 text-lg rounded-2xl backdrop-blur-sm hover:border-urbana-gold/50 transition-all duration-300 focus:border-urbana-gold focus:ring-2 focus:ring-urbana-gold/20"
                      placeholder="seu.email@exemplo.com"
                      required
                    />
                  </motion.div>

                  {/* WhatsApp */}
                  <motion.div 
                    variants={itemVariants}
                    className="space-y-3"
                  >
                    <Label htmlFor="whatsapp" className="text-urbana-light text-lg font-semibold flex items-center gap-3">
                      <div className="p-3 bg-urbana-gold/20 rounded-xl">
                        <Phone className="h-5 w-5 text-urbana-gold" />
                      </div>
                      WhatsApp
                    </Label>
                    <Input
                      id="whatsapp"
                      type="tel"
                      value={formData.whatsapp}
                      onChange={handleWhatsAppChange}
                      className="bg-urbana-black/30 border-urbana-gold/30 text-urbana-light h-16 text-lg rounded-2xl backdrop-blur-sm hover:border-urbana-gold/50 transition-all duration-300 focus:border-urbana-gold focus:ring-2 focus:ring-urbana-gold/20"
                      placeholder="(11) 99999-9999"
                      maxLength={15}
                      required
                    />
                  </motion.div>

                  {/* Data de Nascimento */}
                  <motion.div 
                    variants={itemVariants}
                    className="space-y-3"
                  >
                    <Label htmlFor="data_nascimento" className="text-urbana-light text-lg font-semibold flex items-center gap-3">
                      <div className="p-3 bg-urbana-gold/20 rounded-xl">
                        <Calendar className="h-5 w-5 text-urbana-gold" />
                      </div>
                      Data de Nascimento
                    </Label>
                    <Input
                      id="data_nascimento"
                      type="date"
                      value={formData.data_nascimento}
                      onChange={(e) => setFormData(prev => ({ ...prev, data_nascimento: e.target.value }))}
                      className="bg-urbana-black/30 border-urbana-gold/30 text-urbana-light h-16 text-lg rounded-2xl backdrop-blur-sm hover:border-urbana-gold/50 transition-all duration-300 focus:border-urbana-gold focus:ring-2 focus:ring-urbana-gold/20"
                      required
                    />
                  </motion.div>
                </div>

                {/* Submit Button */}
                <motion.div 
                  variants={itemVariants}
                  className="pt-6"
                >
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-urbana-gold to-urbana-gold-vibrant hover:from-urbana-gold-vibrant hover:to-urbana-gold text-urbana-black font-semibold h-16 text-lg rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-[1.02] transition-all duration-300"
                    disabled={loading}
                  >
                    {loading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-6 h-6 border-2 border-urbana-black border-t-transparent rounded-full mr-3"
                      />
                    ) : (
                      <Save className="h-5 w-5 mr-3" />
                    )}
                    {loading ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                </motion.div>
              </form>
            </PainelClienteCardContent>
          </PainelClienteCard>
        </div>

        {/* Security Notice */}
        <div className="mt-4 sm:mt-6 max-w-5xl mx-auto">
          <PainelClienteCard variant="info" icon={Shield}>
            <PainelClienteCardContent className="p-6">
              <div className="flex items-center gap-3">
                <div>
                  <h3 className="text-urbana-light font-semibold">Informações Seguras</h3>
                  <p className="text-urbana-light/70 text-sm">Seus dados são protegidos e criptografados.</p>
                </div>
              </div>
            </PainelClienteCardContent>
          </PainelClienteCard>
        </div>
      </ClientPageContainer>
    </>
  );
}
