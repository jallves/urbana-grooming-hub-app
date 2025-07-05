import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, ArrowLeft, Clock, Scissors, User, MapPin, Star } from 'lucide-react';
import { usePainelClienteAuth } from '@/contexts/PainelClienteAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

interface Barbeiro {
  id: string;
  nome: string;
}

interface Servico {
  id: string;
  nome: string;
  preco: number;
  duracao: number;
}

interface AgendamentoResponse {
  id: string;
  hora: string;
  status: string;
}

export default function PainelClienteAgendar() {
  const navigate = useNavigate();
  const { cliente } = usePainelClienteAuth();
  const { toast } = useToast();

  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [formData, setFormData] = useState({
    servicoId: '',
    barbeiroId: '',
    data: '',
    hora: ''
  });
  const [loading, setLoading] = useState(false);
  const [horariosDisponiveis, setHorariosDisponiveis] = useState<string[]>([]);

  useEffect(() => {
    if (!cliente) {
      navigate('/painel-cliente/login');
      return;
    }

    carregarDados();
  }, [cliente, navigate]);

  const carregarDados = async () => {
    try {
      const { data: barbeirosData } = await supabase.rpc('get_painel_barbeiros' as any);
      const { data: servicosData } = await supabase.rpc('get_painel_servicos' as any);

      setBarbeiros((barbeirosData as Barbeiro[]) || []);
      setServicos((servicosData as Servico[]) || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const gerarHorarios = () => {
    const horarios = [];
    const agora = new Date();
    const dataAtual = new Date().toISOString().split('T')[0];
    const ehHoje = formData.data === dataAtual;
    const horaAtual = agora.getHours();

    for (let hora = 9; hora <= 19; hora++) {
      const horarioFormatado = `${hora.toString().padStart(2, '0')}:00`;
      if (ehHoje && hora <= horaAtual) continue;
      horarios.push(horarioFormatado);
    }

    return horarios;
  };

  const verificarDisponibilidade = async () => {
    if (!formData.barbeiroId || !formData.data) {
      setHorariosDisponiveis([]);
      return;
    }

    try {
      const { data: agendamentos } = await supabase.rpc('get_agendamentos_barbeiro_data' as any, {
        barbeiro_id: formData.barbeiroId,
        data_agendamento: formData.data
      });

      const ocupados = (agendamentos as AgendamentoResponse[])?.map(ag => ag.hora) || [];
      const livres = gerarHorarios().filter(h => !ocupados.includes(h));
      setHorariosDisponiveis(livres);
    } catch (error) {
      console.error('Erro ao verificar disponibilidade:', error);
    }
  };

  useEffect(() => {
    verificarDisponibilidade();
  }, [formData.barbeiroId, formData.data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.servicoId || !formData.barbeiroId || !formData.data || !formData.hora) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    if (!cliente?.id) {
      toast({
        title: "Erro",
        description: "Cliente não encontrado. Faça login novamente.",
        variant: "destructive"
      });
      navigate('/painel-cliente/login');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.rpc('create_painel_agendamento' as any, {
        cliente_id: cliente.id,
        barbeiro_id: formData.barbeiroId,
        servico_id: formData.servicoId,
        data: formData.data,
        hora: formData.hora
      });

      if (error) {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
        return;
      }

      toast({ title: "Sucesso", description: "Agendamento criado com sucesso." });
      navigate('/painel-cliente/dashboard');
    } catch (err) {
      toast({ title: "Erro", description: "Erro inesperado.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (!cliente) return null;

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
      <div className="absolute inset-0 bg-gradient-to-r from-green-600/5 via-emerald-600/5 to-teal-600/5" />
      
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
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Agendar Corte
              </h1>
              <p className="text-gray-400 text-lg mt-2">Reserve seu horário de forma rápida e fácil</p>
            </div>
          </motion.div>

          {/* Form Card */}
          <motion.div variants={itemVariants}>
            <Card className="bg-slate-900/50 border border-slate-700/50 backdrop-blur-xl shadow-2xl">
              <CardHeader className="pb-6">
                <CardTitle className="text-xl lg:text-2xl text-white flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl">
                    <Scissors className="h-6 w-6 text-white" />
                  </div>
                  Novo Agendamento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Serviço */}
                    <motion.div 
                      variants={itemVariants}
                      className="space-y-3"
                    >
                      <Label htmlFor="servico" className="text-white text-base font-medium flex items-center gap-2">
                        <Star className="h-4 w-4 text-green-400" />
                        Serviço
                      </Label>
                      <Select value={formData.servicoId} onValueChange={(value) => setFormData(prev => ({ ...prev, servicoId: value }))}>
                        <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white h-12 rounded-xl backdrop-blur-sm hover:border-slate-500 transition-colors">
                          <SelectValue placeholder="Selecione um serviço" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-600">
                          {servicos.map(servico => (
                            <SelectItem key={servico.id} value={servico.id} className="text-white hover:bg-slate-700">
                              <div className="flex justify-between items-center w-full">
                                <span>{servico.nome}</span>
                                <span className="text-green-400 font-semibold ml-4">
                                  R$ {servico.preco.toFixed(2)} ({servico.duracao}min)
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </motion.div>

                    {/* Barbeiro */}
                    <motion.div 
                      variants={itemVariants}
                      className="space-y-3"
                    >
                      <Label htmlFor="barbeiro" className="text-white text-base font-medium flex items-center gap-2">
                        <User className="h-4 w-4 text-green-400" />
                        Barbeiro
                      </Label>
                      <Select value={formData.barbeiroId} onValueChange={(value) => setFormData(prev => ({ ...prev, barbeiroId: value }))}>
                        <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white h-12 rounded-xl backdrop-blur-sm hover:border-slate-500 transition-colors">
                          <SelectValue placeholder="Selecione um barbeiro" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-600">
                          {barbeiros.map(barbeiro => (
                            <SelectItem key={barbeiro.id} value={barbeiro.id} className="text-white hover:bg-slate-700">
                              {barbeiro.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </motion.div>

                    {/* Data */}
                    <motion.div 
                      variants={itemVariants}
                      className="space-y-3"
                    >
                      <Label htmlFor="data" className="text-white text-base font-medium flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-green-400" />
                        Data
                      </Label>
                      <Input
                        type="date"
                        value={formData.data}
                        onChange={(e) => setFormData(prev => ({ ...prev, data: e.target.value }))}
                        min={new Date().toISOString().split('T')[0]}
                        className="bg-slate-800/50 border-slate-600 text-white h-12 rounded-xl backdrop-blur-sm hover:border-slate-500 transition-colors focus:border-green-500"
                        required
                      />
                    </motion.div>

                    {/* Hora */}
                    <motion.div 
                      variants={itemVariants}
                      className="space-y-3"
                    >
                      <Label htmlFor="hora" className="text-white text-base font-medium flex items-center gap-2">
                        <Clock className="h-4 w-4 text-green-400" />
                        Horário
                      </Label>
                      <Select value={formData.hora} onValueChange={(value) => setFormData(prev => ({ ...prev, hora: value }))}>
                        <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white h-12 rounded-xl backdrop-blur-sm hover:border-slate-500 transition-colors">
                          <SelectValue placeholder="Selecione um horário" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-600">
                          {horariosDisponiveis.map(horario => (
                            <SelectItem key={horario} value={horario} className="text-white hover:bg-slate-700">
                              {horario}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formData.barbeiroId && formData.data && horariosDisponiveis.length === 0 && (
                        <p className="text-red-400 text-sm flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Nenhum horário disponível para esta data.
                        </p>
                      )}
                    </motion.div>
                  </div>

                  {/* Submit Button */}
                  <motion.div 
                    variants={itemVariants}
                    className="pt-6"
                  >
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold h-14 text-base rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-[1.02] transition-all duration-300"
                      disabled={loading}
                    >
                      {loading ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                        />
                      ) : (
                        <Calendar className="h-5 w-5 mr-2" />
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
