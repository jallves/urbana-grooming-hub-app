
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, User, Save } from 'lucide-react';
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

  return (
    <div className="h-full w-full bg-gradient-to-br from-zinc-950 to-zinc-900 p-3 sm:p-4 lg:p-6 xl:p-8 overflow-auto">
      <div className="h-full max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-4 sm:space-y-6 lg:space-y-8 h-full"
        >
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate('/painel-cliente/dashboard')}
              variant="outline"
              size="sm"
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">Editar Perfil</h1>
          </div>

          <Card className="bg-gray-900 border border-gray-700 shadow-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2 text-lg sm:text-xl">
                <User className="h-5 w-5 text-amber-500" />
                Suas Informações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                {erro && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-red-500/20 border border-red-500 rounded-lg"
                  >
                    <p className="text-red-400 text-sm">{erro}</p>
                  </motion.div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="nome" className="text-white text-sm sm:text-base">Nome Completo</Label>
                    <Input
                      id="nome"
                      type="text"
                      value={formData.nome}
                      onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                      className="bg-gray-800 border-gray-600 text-white h-10 sm:h-12"
                      placeholder="Seu nome completo"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white text-sm sm:text-base">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="bg-gray-800 border-gray-600 text-white h-10 sm:h-12"
                      placeholder="seu.email@exemplo.com"
                      required
                    />
                  </div>

                  <div className="space-y-2 lg:col-span-2">
                    <Label htmlFor="whatsapp" className="text-white text-sm sm:text-base">WhatsApp</Label>
                    <Input
                      id="whatsapp"
                      type="tel"
                      value={formData.whatsapp}
                      onChange={handleWhatsAppChange}
                      className="bg-gray-800 border-gray-600 text-white h-10 sm:h-12"
                      placeholder="(11) 99999-9999"
                      maxLength={15}
                      required
                    />
                  </div>
                </div>

                <div className="pt-4 sm:pt-6">
                  <Button
                    type="submit"
                    className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold h-10 sm:h-12"
                    disabled={loading}
                  >
                    {loading ? 'Salvando...' : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Salvar Alterações
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
