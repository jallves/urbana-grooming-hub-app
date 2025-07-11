import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, User, Save, Mail, Phone, Edit3, Shield, Calendar, Clock, Scissors } from 'lucide-react';
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

  // Dados mockados de agendamentos (substituir por dados reais da API)
  const agendamentos = [
    {
      id: 1,
      servico: "Corte Masculino",
      profissional: "Carlos Silva",
      data: "15/07/2023",
      horario: "14:30",
      status: "confirmado"
    },
    {
      id: 2,
      servico: "Barba",
      profissional: "João Santos",
      data: "20/07/2023",
      horario: "10:00",
      status: "pendente"
    }
  ];

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
        variant: "success"
      });
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
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-orange-600/10 via-red-600/10 to-orange-600/10" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-80 h-80 bg-red-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      
      <div className="relative w-full px-4 py-8 sm:px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-4xl mx-auto space-y-8"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Button
              onClick={() => navigate('/painel-cliente/dashboard')}
              variant="ghost"
              size="sm"
              className="text-orange-400 hover:text-white hover:bg-orange-500/20 rounded-2xl px-6 py-3 transition-all duration-300 border border-orange-500/30"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-orange-400 via-red-400 to-orange-400 bg-clip-text text-transparent">
                Meu Perfil
              </h1>
              <p className="text-gray-400 text-lg mt-2">Gerencie suas informações e agendamentos</p>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Seção de Perfil */}
            <motion.div variants={itemVariants}>
              <Card className="bg-slate-900/70 border border-slate-700/50 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden h-full">
                <CardHeader className="pb-6 bg-gradient-to-r from-orange-500/20 to-red-500/20">
                  <CardTitle className="text-2xl text-white flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl shadow-lg">
                      <User className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">Informações Pessoais</div>
                      <div className="text-sm text-gray-400 font-normal mt-1">Atualize seus dados de contato</div>
                    </div>
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-8">
                  <form onSubmit={handleSubmit} className="space-y-8">
                    {erro && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-red-500/20 border border-red-500/50 rounded-2xl backdrop-blur-sm"
                      >
                        <p className="text-red-400 text-sm font-medium">{erro}</p>
                      </motion.div>
                    )}

                    <div className="space-y-8">
                      {/* Nome */}
                      <motion.div 
                        variants={itemVariants}
                        className="space-y-3"
                      >
                        <Label htmlFor="nome" className="text-white text-base font-semibold flex items-center gap-3">
                          <div className="p-2 bg-orange-500/20 rounded-xl">
                            <User className="h-4 w-4 text-orange-400" />
                          </div>
                          Nome Completo
                        </Label>
                        <Input
                          id="nome"
                          type="text"
                          value={formData.nome}
                          onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                          className="bg-slate-800/70 border-slate-600 text-white h-14 text-base rounded-2xl backdrop-blur-sm hover:border-slate-500 transition-all duration-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                          placeholder="Seu nome completo"
                          required
                        />
                      </motion.div>

                      {/* Email */}
                      <motion.div 
                        variants={itemVariants}
                        className="space-y-3"
                      >
                        <Label htmlFor="email" className="text-white text-base font-semibold flex items-center gap-3">
                          <div className="p-2 bg-orange-500/20 rounded-xl">
                            <Mail className="h-4 w-4 text-orange-400" />
                          </div>
                          E-mail
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          className="bg-slate-800/70 border-slate-600 text-white h-14 text-base rounded-2xl backdrop-blur-sm hover:border-slate-500 transition-all duration-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                          placeholder="seu.email@exemplo.com"
                          required
                        />
                      </motion.div>

                      {/* WhatsApp */}
                      <motion.div 
                        variants={itemVariants}
                        className="space-y-3"
                      >
                        <Label htmlFor="whatsapp" className="text-white text-base font-semibold flex items-center gap-3">
                          <div className="p-2 bg-orange-500/20 rounded-xl">
                            <Phone className="h-4 w-4 text-orange-400" />
                          </div>
                          WhatsApp
                        </Label>
                        <Input
                          id="whatsapp"
                          type="tel"
                          value={formData.whatsapp}
                          onChange={handleWhatsAppChange}
                          className="bg-slate-800/70 border-slate-600 text-white h-14 text-base rounded-2xl backdrop-blur-sm hover:border-slate-500 transition-all duration-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
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
                        className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold h-16 text-lg rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-[1.02] transition-all duration-300"
                        disabled={loading}
                      >
                        {loading ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-6 h-6 border-2 border-white border-t-transparent rounded-full mr-3"
                          />
                        ) : (
                          <Save className="h-5 w-5 mr-3" />
                        )}
                        {loading ? 'Salvando...' : 'Salvar Alterações'}
                      </Button>
                    </motion.div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>

            {/* Seção de Agendamentos */}
            <motion.div variants={itemVariants}>
              <Card className="bg-slate-900/70 border border-slate-700/50 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden h-full">
                <CardHeader className="pb-6 bg-gradient-to-r from-orange-500/20 to-red-500/20">
                  <CardTitle className="text-2xl text-white flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl shadow-lg">
                      <Calendar className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">Próximos Agendamentos</div>
                      <div className="text-sm text-gray-400 font-normal mt-1">Seus compromissos marcados</div>
                    </div>
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-8">
                  {agendamentos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Calendar className="h-12 w-12 text-gray-500 mb-4" />
                      <h3 className="text-lg font-medium text-gray-400">Nenhum agendamento encontrado</h3>
                      <p className="text-sm text-gray-500 mt-2">Você ainda não possui agendamentos marcados.</p>
                      <Button 
                        className="mt-6 bg-gradient-to-r from-orange-500 to-red-500 text-white"
                        onClick={() => navigate('/painel-cliente/agendamento')}
                      >
                        Agendar Serviço
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {agendamentos.map((agendamento) => (
                        <motion.div 
                          key={agendamento.id}
                          variants={itemVariants}
                          whileHover={{ scale: 1.02 }}
                          className="bg-slate-800/70 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <Scissors className="h-5 w-5 text-orange-400" />
                                <h3 className="text-lg font-semibold text-white">{agendamento.servico}</h3>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  agendamento.status === 'confirmado' 
                                    ? 'bg-green-500/20 text-green-400' 
                                    : 'bg-yellow-500/20 text-yellow-400'
                                }`}>
                                  {agendamento.status === 'confirmado' ? 'Confirmado' : 'Pendente'}
                                </span>
                              </div>
                              <p className="text-gray-400 text-sm mb-1">Profissional: {agendamento.profissional}</p>
                              <div className="flex items-center gap-4 mt-3">
                                <div className="flex items-center gap-2 text-orange-400">
                                  <Calendar className="h-4 w-4" />
                                  <span className="text-sm">{agendamento.data}</span>
                                </div>
                                <div className="flex items-center gap-2 text-orange-400">
                                  <Clock className="h-4 w-4" />
                                  <span className="text-sm">{agendamento.horario}</span>
                                </div>
                              </div>
                            </div>
                            <Button 
                              variant="outline"
                              size="sm"
                              className="border-orange-500/50 text-orange-400 hover:bg-orange-500/20 hover:text-white"
                              onClick={() => console.log('Editar agendamento', agendamento.id)}
                            >
                              Detalhes
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Security Notice */}
          <motion.div variants={itemVariants}>
            <Card className="bg-blue-500/10 border border-blue-500/30 backdrop-blur-xl rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-blue-400" />
                  <div>
                    <h3 className="text-white font-semibold">Informações Seguras</h3>
                    <p className="text-blue-300 text-sm">Seus dados são protegidos e criptografados.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}