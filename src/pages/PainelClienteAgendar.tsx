
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Calendar, Clock, User, Scissors, DollarSign, CheckCircle } from 'lucide-react';
import { usePainelClienteAuth } from '@/contexts/PainelClienteAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

interface Barbeiro {
  id: string;
  nome: string;
  especialidades: string[];
}

interface Servico {
  id: string;
  nome: string;
  preco: number;
  duracao: number;
  descricao?: string;
}

export default function PainelClienteAgendar() {
  const navigate = useNavigate();
  const { cliente } = usePainelClienteAuth();
  const { toast } = useToast();

  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const [formData, setFormData] = useState({
    barbeiro_id: '',
    servico_id: '',
    data: '',
    hora: '',
    observacoes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [barbeirosRes, servicosRes] = await Promise.all([
        supabase.from('painel_barbeiros').select('*').eq('ativo', true),
        supabase.from('painel_servicos').select('*').eq('ativo', true)
      ]);

      if (barbeirosRes.error) throw barbeirosRes.error;
      if (servicosRes.error) throw servicosRes.error;

      setBarbeiros(barbeirosRes.data || []);
      setServicos(servicosRes.data || []);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os dados necessários.",
      });
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cliente) {
      navigate('/painel-cliente/login');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('painel_agendamentos')
        .insert({
          cliente_id: cliente.id,
          barbeiro_id: formData.barbeiro_id,
          servico_id: formData.servico_id,
          data: formData.data,
          hora: formData.hora,
          observacoes: formData.observacoes,
          status: 'agendado'
        });

      if (error) throw error;

      toast({
        title: "Agendamento realizado!",
        description: "Seu agendamento foi criado com sucesso.",
        duration: 3000,
      });

      // Reset form
      setFormData({
        barbeiro_id: '',
        servico_id: '',
        data: '',
        hora: '',
        observacoes: ''
      });

      // Navigate to appointments after a short delay
      setTimeout(() => {
        navigate('/painel-cliente/agendamentos');
      }, 1500);

    } catch (error: any) {
      console.error('Erro ao criar agendamento:', error);
      toast({
        variant: "destructive",
        title: "Erro ao agendar",
        description: error.message || "Não foi possível realizar o agendamento.",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedService = servicos.find(s => s.id === formData.servico_id);

  if (!cliente) {
    navigate('/painel-cliente/login');
    return null;
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full"
        />
      </div>
    );
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950 relative">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-green-600/5 via-emerald-600/5 to-green-600/5" />
      
      <div className="relative z-10 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto min-h-screen">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
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
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-green-400 bg-clip-text text-transparent">
                Novo Agendamento
              </h1>
              <p className="text-gray-400 text-base sm:text-lg mt-2">Escolha o melhor horário para você</p>
            </div>
          </motion.div>

          {/* Form Card */}
          <motion.div variants={itemVariants}>
            <Card className="bg-slate-900/50 border border-slate-700/50 backdrop-blur-xl shadow-2xl">
              <CardHeader className="pb-6">
                <CardTitle className="text-xl lg:text-2xl text-white flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  Detalhes do Agendamento
                </CardTitle>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Serviço */}
                    <motion.div variants={itemVariants} className="space-y-3">
                      <Label htmlFor="servico" className="text-white text-base font-medium flex items-center gap-2">
                        <Scissors className="h-4 w-4 text-green-400" />
                        Serviço
                      </Label>
                      <Select value={formData.servico_id} onValueChange={(value) => setFormData(prev => ({ ...prev, servico_id: value }))}>
                        <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white h-12 text-base rounded-xl backdrop-blur-sm hover:border-slate-500 transition-colors focus:border-green-500">
                          <SelectValue placeholder="Escolha um serviço" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-600">
                          {servicos.map((servico) => (
                            <SelectItem key={servico.id} value={servico.id}>
                              <div className="flex justify-between items-center w-full">
                                <span>{servico.nome}</span>
                                <span className="text-green-400 font-semibold ml-4">R$ {servico.preco.toFixed(2)}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </motion.div>

                    {/* Barbeiro */}
                    <motion.div variants={itemVariants} className="space-y-3">
                      <Label htmlFor="barbeiro" className="text-white text-base font-medium flex items-center gap-2">
                        <User className="h-4 w-4 text-green-400" />
                        Barbeiro
                      </Label>
                      <Select value={formData.barbeiro_id} onValueChange={(value) => setFormData(prev => ({ ...prev, barbeiro_id: value }))}>
                        <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white h-12 text-base rounded-xl backdrop-blur-sm hover:border-slate-500 transition-colors focus:border-green-500">
                          <SelectValue placeholder="Escolha um barbeiro" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-600">
                          {barbeiros.map((barbeiro) => (
                            <SelectItem key={barbeiro.id} value={barbeiro.id}>
                              {barbeiro.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </motion.div>

                    {/* Data */}
                    <motion.div variants={itemVariants} className="space-y-3">
                      <Label htmlFor="data" className="text-white text-base font-medium flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-green-400" />
                        Data
                      </Label>
                      <Input
                        id="data"
                        type="date"
                        value={formData.data}
                        onChange={(e) => setFormData(prev => ({ ...prev, data: e.target.value }))}
                        className="bg-slate-800/50 border-slate-600 text-white h-12 text-base rounded-xl backdrop-blur-sm hover:border-slate-500 transition-colors focus:border-green-500"
                        min={new Date().toISOString().split('T')[0]}
                        required
                      />
                    </motion.div>

                    {/* Hora */}
                    <motion.div variants={itemVariants} className="space-y-3">
                      <Label htmlFor="hora" className="text-white text-base font-medium flex items-center gap-2">
                        <Clock className="h-4 w-4 text-green-400" />
                        Horário
                      </Label>
                      <Input
                        id="hora"
                        type="time"
                        value={formData.hora}
                        onChange={(e) => setFormData(prev => ({ ...prev, hora: e.target.value }))}
                        className="bg-slate-800/50 border-slate-600 text-white h-12 text-base rounded-xl backdrop-blur-sm hover:border-slate-500 transition-colors focus:border-green-500"
                        min="08:00"
                        max="20:00"
                        required
                      />
                    </motion.div>
                  </div>

                  {/* Service Info */}
                  {selectedService && (
                    <motion.div
                      variants={itemVariants}
                      className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-700/50 rounded-xl p-4 backdrop-blur-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-white font-semibold text-lg">{selectedService.nome}</h3>
                          <p className="text-green-400 text-sm mt-1">Duração: {selectedService.duracao} minutos</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-green-400 font-bold text-xl">
                            <DollarSign className="h-5 w-5" />
                            {selectedService.preco.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Observações */}
                  <motion.div variants={itemVariants} className="space-y-3">
                    <Label htmlFor="observacoes" className="text-white text-base font-medium">
                      Observações (opcional)
                    </Label>
                    <Textarea
                      id="observacoes"
                      value={formData.observacoes}
                      onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                      className="bg-slate-800/50 border-slate-600 text-white rounded-xl backdrop-blur-sm hover:border-slate-500 transition-colors focus:border-green-500 resize-none"
                      placeholder="Alguma observação especial para seu agendamento..."
                      rows={3}
                    />
                  </motion.div>

                  {/* Submit Button */}
                  <motion.div variants={itemVariants} className="pt-6">
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold h-14 text-base rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-[1.02] transition-all duration-300"
                      disabled={loading || !formData.barbeiro_id || !formData.servico_id || !formData.data || !formData.hora}
                    >
                      {loading ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                        />
                      ) : (
                        <CheckCircle className="h-5 w-5 mr-2" />
                      )}
                      {loading ? 'Agendando...' : 'Confirmar Agendamento'}
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
