
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, Plus, LogOut, Edit, Clock, Scissors } from 'lucide-react';
import { usePainelClienteAuth } from '@/contexts/PainelClienteAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Agendamento {
  id: string;
  data: string;
  hora: string;
  status: 'pendente' | 'confirmado' | 'cancelado';
  barbeiro_nome: string;
  servico_nome: string;
  servico_preco: number;
}

export default function PainelClienteDashboard() {
  const navigate = useNavigate();
  const { cliente, logout } = usePainelClienteAuth();
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!cliente) {
      navigate('/painel-cliente/login');
      return;
    }
    
    carregarAgendamentos();
  }, [cliente, navigate]);

  const carregarAgendamentos = async () => {
    if (!cliente) return;

    try {
      const { data, error } = await supabase
        .from('painel_agendamentos')
        .select(`
          *,
          painel_barbeiros(nome),
          painel_servicos(nome, preco)
        `)
        .eq('cliente_id', cliente.id)
        .order('data', { ascending: false })
        .order('hora', { ascending: false });

      if (error) {
        console.error('Erro ao carregar agendamentos:', error);
        return;
      }

      const agendamentosFormatados: Agendamento[] = data?.map(agendamento => ({
        id: agendamento.id,
        data: agendamento.data,
        hora: agendamento.hora,
        status: agendamento.status as 'pendente' | 'confirmado' | 'cancelado',
        barbeiro_nome: agendamento.painel_barbeiros?.nome || 'N/A',
        servico_nome: agendamento.painel_servicos?.nome || 'N/A',
        servico_preco: agendamento.painel_servicos?.preco || 0
      })) || [];

      setAgendamentos(agendamentosFormatados);
    } catch (error) {
      console.error('Erro ao carregar agendamentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmado':
        return 'bg-green-500';
      case 'pendente':
        return 'bg-yellow-500';
      case 'cancelado':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmado':
        return 'Confirmado';
      case 'pendente':
        return 'Pendente';
      case 'cancelado':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const agendamentosFuturos = agendamentos.filter(ag => {
    const dataAgendamento = new Date(`${ag.data} ${ag.hora}`);
    return dataAgendamento > new Date() && ag.status !== 'cancelado';
  });

  const agendamentosAnteriores = agendamentos.filter(ag => {
    const dataAgendamento = new Date(`${ag.data} ${ag.hora}`);
    return dataAgendamento <= new Date() || ag.status === 'cancelado';
  });

  if (!cliente) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white font-clash mb-2">
              Olá, {cliente.nome}! 👋
            </h1>
            <p className="text-gray-400 font-inter">
              Gerencie seus agendamentos na barbearia
            </p>
          </div>
          
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <Button
              onClick={() => navigate('/painel-cliente/agendar')}
              className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Agendamento
            </Button>
            
            <Button
              onClick={() => navigate('/painel-cliente/perfil')}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              <User className="h-4 w-4 mr-2" />
              Perfil
            </Button>

            <Button
              onClick={logout}
              variant="outline"
              className="border-red-600 text-red-400 hover:bg-red-900"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>

        {/* Informações do Cliente */}
        <Card className="bg-gray-900 border-gray-700 mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <User className="h-5 w-5 text-amber-500" />
              Seus Dados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-gray-400 text-sm">Nome</p>
                <p className="text-white font-semibold">{cliente.nome}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">E-mail</p>
                <p className="text-white">{cliente.email}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">WhatsApp</p>
                <p className="text-white">{cliente.whatsapp}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botão Principal - Agendar */}
        <div className="mb-8">
          <Card className="bg-gradient-to-r from-amber-500/20 to-amber-600/20 border-amber-500/30 hover:border-amber-500/50 transition-all cursor-pointer"
                onClick={() => navigate('/painel-cliente/agendar')}>
            <CardContent className="p-8 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-amber-500 rounded-full">
                  <Scissors className="h-8 w-8 text-black" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Agendar Corte</h2>
                  <p className="text-gray-300 mb-4">
                    Marque seu horário com nossos barbeiros profissionais
                  </p>
                  <Button 
                    size="lg"
                    className="bg-amber-500 hover:bg-amber-600 text-black font-semibold px-8"
                  >
                    <Calendar className="h-5 w-5 mr-2" />
                    Agendar Agora
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Próximos Agendamentos */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Calendar className="h-6 w-6 text-amber-500" />
              Próximos Agendamentos
            </h2>
          </div>
          
          {loading ? (
            <Card className="bg-gray-900 border-gray-700">
              <CardContent className="p-6">
                <p className="text-gray-400 text-center">Carregando agendamentos...</p>
              </CardContent>
            </Card>
          ) : agendamentosFuturos.length > 0 ? (
            <div className="grid gap-4">
              {agendamentosFuturos.map((agendamento) => (
                <Card key={agendamento.id} className="bg-gray-900 border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-amber-500" />
                            <span className="text-white font-semibold">
                              {format(new Date(agendamento.data), 'dd/MM/yyyy', { locale: ptBR })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-amber-500" />
                            <span className="text-white">{agendamento.hora}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          <p className="text-gray-300">
                            <strong>Barbeiro:</strong> {agendamento.barbeiro_nome}
                          </p>
                          <p className="text-gray-300">
                            <strong>Serviço:</strong> {agendamento.servico_nome}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-4 md:mt-0">
                        <Badge className={`${getStatusColor(agendamento.status)} text-white`}>
                          {getStatusText(agendamento.status)}
                        </Badge>
                        <span className="text-amber-500 font-semibold">
                          R$ {agendamento.servico_preco.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-gray-900 border-gray-700">
              <CardContent className="p-6">
                <p className="text-gray-400 text-center">
                  Você não tem agendamentos futuros
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Histórico de Agendamentos */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Clock className="h-6 w-6 text-green-500" />
              Histórico
            </h2>
          </div>
          
          {agendamentosAnteriores.length > 0 ? (
            <div className="grid gap-4">
              {agendamentosAnteriores.slice(0, 5).map((agendamento) => (
                <Card key={agendamento.id} className="bg-gray-900 border-gray-700 opacity-75">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-300">
                              {format(new Date(agendamento.data), 'dd/MM/yyyy', { locale: ptBR })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-300">{agendamento.hora}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          <p className="text-gray-400">
                            <strong>Barbeiro:</strong> {agendamento.barbeiro_nome}
                          </p>
                          <p className="text-gray-400">
                            <strong>Serviço:</strong> {agendamento.servico_nome}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-4 md:mt-0">
                        <Badge className={`${getStatusColor(agendamento.status)} text-white`}>
                          {getStatusText(agendamento.status)}
                        </Badge>
                        <span className="text-gray-400">
                          R$ {agendamento.servico_preco.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-gray-900 border-gray-700">
              <CardContent className="p-6">
                <p className="text-gray-400 text-center">
                  Nenhum agendamento anterior encontrado
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
