
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
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 to-zinc-900 flex flex-col">
      {/* Header fixo no mobile */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-700 bg-zinc-900/50 backdrop-blur-sm">
        <Button
          onClick={() => navigate('/painel-cliente/dashboard')}
          variant="ghost"
          size="sm"
          className="text-gray-300 hover:text-white hover:bg-gray-800 p-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold text-white">Editar Perfil</h1>
        <div className="w-9"></div> {/* Spacer para centralizar o título */}
      </div>

      {/* Conteúdo principal - flexível */}
      <div className="flex-1 p-4 flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex-1 max-w-2xl mx-auto w-full"
        >
          <Card className="bg-gray-900 border border-gray-700 shadow-xl h-full flex flex-col">
            <CardHeader className="flex-shrink-0 pb-4">
              <CardTitle className="text-white flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-amber-500" />
                Suas Informações
              </CardTitle>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col">
              <form onSubmit={handleSubmit} className="flex-1 flex flex-col space-y-6">
                {erro && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-red-500/20 border border-red-500 rounded-lg"
                  >
                    <p className="text-red-400 text-sm">{erro}</p>
                  </motion.div>
                )}

                <div className="space-y-6 flex-1">
                  <div className="space-y-2">
                    <Label htmlFor="nome" className="text-white text-base font-medium">
                      Nome Completo
                    </Label>
                    <Input
                      id="nome"
                      type="text"
                      value={formData.nome}
                      onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                      className="bg-gray-800 border-gray-600 text-white h-12 text-base"
                      placeholder="Seu nome completo"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white text-base font-medium">
                      E-mail
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="bg-gray-800 border-gray-600 text-white h-12 text-base"
                      placeholder="seu.email@exemplo.com"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="whatsapp" className="text-white text-base font-medium">
                      WhatsApp
                    </Label>
                    <Input
                      id="whatsapp"
                      type="tel"
                      value={formData.whatsapp}
                      onChange={handleWhatsAppChange}
                      className="bg-gray-800 border-gray-600 text-white h-12 text-base"
                      placeholder="(11) 99999-9999"
                      maxLength={15}
                      required
                    />
                  </div>
                </div>

                {/* Botão fixo na parte inferior */}
                <div className="pt-6">
                  <Button
                    type="submit"
                    className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold h-12 text-base"
                    disabled={loading}
                  >
                    {loading ? 'Salvando...' : (
                      <>
                        <Save className="h-5 w-5 mr-2" />
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
