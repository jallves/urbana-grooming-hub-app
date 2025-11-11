import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, ArrowLeft, Wallet, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import costaUrbanaLogo from '@/assets/logo-costa-urbana.png';

interface PendingCheckout {
  id: string;
  data: string;
  hora: string;
  painel_clientes: {
    nome: string;
    whatsapp: string;
  };
  painel_barbeiros: {
    nome: string;
  };
  painel_servicos: {
    nome: string;
    preco: number;
  };
  totem_sessions: {
    id: string;
    check_in_time: string;
  }[];
}

const TotemPendingCheckouts: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const clienteWhatsapp = location.state?.whatsapp;

  const [pendingCheckouts, setPendingCheckouts] = useState<PendingCheckout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (!clienteWhatsapp) {
      toast.error('Sessão inválida');
      navigate('/totem/login');
      return;
    }
    loadPendingCheckouts();
  }, [clienteWhatsapp]);

  const loadPendingCheckouts = async () => {
    setIsLoading(true);
    try {
      console.log('🔍 Buscando checkouts pendentes para:', clienteWhatsapp);

      // Buscar cliente
      const { data: cliente, error: clienteError } = await supabase
        .from('painel_clientes')
        .select('id')
        .eq('whatsapp', clienteWhatsapp)
        .single();

      if (clienteError || !cliente) {
        throw new Error('Cliente não encontrado');
      }

      // Buscar agendamentos do cliente com check-in sem checkout
      const { data: agendamentos, error } = await supabase
        .from('painel_agendamentos')
        .select(`
          id,
          data,
          hora,
          painel_clientes!inner(nome, whatsapp),
          painel_barbeiros!inner(nome),
          painel_servicos!inner(nome, preco),
          totem_sessions!inner(
            id,
            check_in_time,
            check_out_time,
            status
          )
        `)
        .eq('cliente_id', cliente.id)
        .not('totem_sessions.check_in_time', 'is', null)
        .is('totem_sessions.check_out_time', null)
        .order('data', { ascending: false })
        .order('hora', { ascending: false });

      if (error) throw error;

      console.log(`✅ Encontrados ${agendamentos?.length || 0} checkouts pendentes`);
      setPendingCheckouts(agendamentos || []);

    } catch (error: any) {
      console.error('❌ Erro ao carregar checkouts pendentes:', error);
      toast.error('Erro ao carregar dados', {
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckout = async (sessionId: string) => {
    setIsProcessing(sessionId);
    try {
      console.log('🛒 Iniciando checkout para sessão:', sessionId);

      // Redirecionar para tela de checkout com a sessão específica
      navigate('/totem/checkout', {
        state: { 
          session_id: sessionId,
          from_pending: true
        }
      });

    } catch (error: any) {
      console.error('❌ Erro ao processar checkout:', error);
      toast.error('Erro ao iniciar checkout', {
        description: error.message
      });
    } finally {
      setIsProcessing(null);
    }
  };

  const getDaysAgo = (dateStr: string, timeStr: string) => {
    try {
      const appointmentDate = parseISO(`${dateStr}T${timeStr}`);
      const now = new Date();
      const diffInMs = now.getTime() - appointmentDate.getTime();
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
      
      if (diffInDays === 0) return 'Hoje';
      if (diffInDays === 1) return 'Ontem';
      return `${diffInDays} dias atrás`;
    } catch {
      return 'Data inválida';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin h-16 w-16 border-4 border-urbana-gold border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-white text-lg">Verificando checkouts pendentes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-black/40 backdrop-blur-md border-b border-white/10 p-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Button
            onClick={() => navigate('/totem/home')}
            variant="ghost"
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Voltar
          </Button>
          <img src={costaUrbanaLogo} alt="Costa Urbana" className="h-12" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {/* Título */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center gap-3 bg-orange-500/20 backdrop-blur-sm border border-orange-500/30 rounded-2xl px-6 py-4 mb-4">
              <AlertCircle className="h-8 w-8 text-orange-400" />
              <h1 className="text-3xl font-bold text-white">Checkouts Pendentes</h1>
            </div>
            <p className="text-gray-400 text-lg">
              Você possui {pendingCheckouts.length} atendimento(s) aguardando pagamento
            </p>
          </div>

          {pendingCheckouts.length === 0 ? (
            <Card className="bg-black/40 backdrop-blur-md border-green-500/30 p-12 text-center">
              <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">
                Tudo Certo! 🎉
              </h3>
              <p className="text-gray-400 mb-6">
                Você não possui checkouts pendentes
              </p>
              <Button
                onClick={() => navigate('/totem/home')}
                className="bg-gradient-to-r from-urbana-gold to-yellow-600 hover:from-yellow-600 hover:to-urbana-gold text-black font-bold"
              >
                Voltar ao Menu
              </Button>
            </Card>
          ) : (
            <div className="grid gap-6">
              {pendingCheckouts.map((checkout) => {
                const session = checkout.totem_sessions[0];
                const checkInDate = parseISO(session.check_in_time);
                
                return (
                  <Card 
                    key={checkout.id}
                    className="bg-black/40 backdrop-blur-md border-orange-500/30 p-6 hover:border-orange-500/50 transition-all"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                      {/* Info */}
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-urbana-gold to-yellow-600 flex items-center justify-center text-white font-bold text-2xl">
                            {checkout.painel_clientes.nome.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-bold text-xl text-white">
                              {checkout.painel_clientes.nome}
                            </h3>
                            <p className="text-gray-400">
                              Barbeiro: {checkout.painel_barbeiros.nome}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white/5 rounded-lg p-3">
                            <p className="text-gray-400 text-sm mb-1">Atendimento</p>
                            <p className="text-white font-bold">
                              {format(parseISO(checkout.data + 'T00:00:00'), 'dd/MM/yyyy')}
                            </p>
                            <p className="text-gray-400 text-sm">{checkout.hora}</p>
                          </div>

                          <div className="bg-white/5 rounded-lg p-3">
                            <p className="text-gray-400 text-sm mb-1">Check-in</p>
                            <p className="text-white font-bold">
                              {format(checkInDate, 'dd/MM/yyyy')}
                            </p>
                            <p className="text-gray-400 text-sm">
                              {format(checkInDate, 'HH:mm')}
                            </p>
                          </div>

                          <div className="bg-white/5 rounded-lg p-3">
                            <p className="text-gray-400 text-sm mb-1">Serviço</p>
                            <p className="text-white font-bold">
                              {checkout.painel_servicos.nome}
                            </p>
                          </div>

                          <div className="bg-white/5 rounded-lg p-3">
                            <p className="text-gray-400 text-sm mb-1">Valor</p>
                            <p className="text-green-400 font-bold text-lg">
                              R$ {checkout.painel_servicos.preco.toFixed(2)}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                            <Clock className="h-3 w-3 mr-1" />
                            {getDaysAgo(checkout.data, checkout.hora)}
                          </Badge>
                          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                            🔔 Aguardando Pagamento
                          </Badge>
                        </div>
                      </div>

                      {/* Ação */}
                      <div className="flex flex-col gap-3">
                        <Button
                          onClick={() => handleCheckout(session.id)}
                          disabled={!!isProcessing}
                          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold text-lg py-8 px-8 rounded-xl shadow-lg"
                        >
                          <Wallet className="h-6 w-6 mr-2" />
                          {isProcessing === session.id ? 'Processando...' : 'Fazer Checkout'}
                        </Button>
                        <p className="text-xs text-center text-gray-500">
                          Sessão: {session.id.substring(0, 8)}...
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Botão de prosseguir */}
          {pendingCheckouts.length > 0 && (
            <div className="mt-8 text-center">
              <Button
                onClick={() => navigate('/totem/home')}
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                Prosseguir para o Menu Principal
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TotemPendingCheckouts;
