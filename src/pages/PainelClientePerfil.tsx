
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, User, Save, Mail, Phone, Edit3 } from 'lucide-react';
import { usePainelClienteAuth } from '@/contexts/PainelClienteAuthContext';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

export default function PainelClientePerfil() {
  const navigate = useNavigate();
  const { cliente, atualizarPerfil } = usePainelClienteAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    nome: cliente?.nome || '',
    email: cliente?.email || '',
    whatsapp: cliente?.whatsapp || ''
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
      whatsapp: formData.whatsapp
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
    <div className="h-full w-full bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950 relative overflow-auto">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-orange-600/5 via-red-600/5 to-orange-600/5" />
      
      <div className="relative z-10 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6 lg:space-y-8"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Button
              onClick={() => navigate('/painel-cliente/dashboard')}
              variant="outline"
              size="sm"
              className="border-slate-600 text-gray-300 hover:bg-slate-800/50 hover:text-white hover:border-slate-500 rounded-xl px-4 py-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-orange-400 via-red-400 to-orange-400 bg-clip-text text-transparent">
                Editar Perfil
              </h1>
              <p className="text-gray-400 text-lg mt-2">Mantenha suas informações sempre atualizadas</p>
            </div>
          </motion.div>

          {/* Profile Card */}
          <motion.div variants={itemVariants}>
            <Card className="bg-slate-900/50 border border-slate-700/50 backdrop-blur-xl shadow-2xl">
              <CardHeader className="pb-6">
                <CardTitle className="text-xl lg:text-2xl text-white flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl">
                    <Edit3 className="h-6 w-6 text-white" />
                  </div>
                  Suas Informações
                </CardTitle>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {erro && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl backdrop-blur-sm"
                    >
                      <p className="text-red-400 text-sm font-medium">{erro}</p>
                    </motion.div>
                  )}

                  <div className="space-y-6">
                    {/* Nome */}
                    <motion.div 
                      variants={itemVariants}
                      className="space-y-3"
                    >
                      <Label htmlFor="nome" className="text-white text-base font-medium flex items-center gap-2">
                        <User className="h-4 w-4 text-orange-400" />
                        Nome Completo
                      </Label>
                      <Input
                        id="nome"
                        type="text"
                        value={formData.nome}
                        onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                        className="bg-slate-800/50 border-slate-600 text-white h-12 text-base rounded-xl backdrop-blur-sm hover:border-slate-500 transition-colors focus:border-orange-500"
                        placeholder="Seu nome completo"
                        required
                      />
                    </motion.div>

                    {/* Email */}
                    <motion.div 
                      variants={itemVariants}
                      className="space-y-3"
                    >
                      <Label htmlFor="email" className="text-white text-base font-medium flex items-center gap-2">
                        <Mail className="h-4 w-4 text-orange-400" />
                        E-mail
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="bg-slate-800/50 border-slate-600 text-white h-12 text-base rounded-xl backdrop-blur-sm hover:border-slate-500 transition-colors focus:border-orange-500"
                        placeholder="seu.email@exemplo.com"
                        required
                      />
                    </motion.div>

                    {/* WhatsApp */}
                    <motion.div 
                      variants={itemVariants}
                      className="space-y-3"
                    >
                      <Label htmlFor="whatsapp" className="text-white text-base font-medium flex items-center gap-2">
                        <Phone className="h-4 w-4 text-orange-400" />
                        WhatsApp
                      </Label>
                      <Input
                        id="whatsapp"
                        type="tel"
                        value={formData.whatsapp}
                        onChange={handleWhatsAppChange}
                        className="bg-slate-800/50 border-slate-600 text-white h-12 text-base rounded-xl backdrop-blur-sm hover:border-slate-500 transition-colors focus:border-orange-500"
                        placeholder="(11) 99999-9999"
                        maxLength={15}
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
                      className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold h-14 text-base rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-[1.02] transition-all duration-300"
                      disabled={loading}
                    >
                      {loading ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                        />
                      ) : (
                        <Save className="h-5 w-5 mr-2" />
                      )}
                      {loading ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                  </motion.div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
