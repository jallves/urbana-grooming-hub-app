import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Clock, User, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PendingCheckout {
  id: string;
  data: string;
  hora: string;
  status: string;
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
    check_out_time: string | null;
    status: string;
  }[];
}

const PendingCheckouts: React.FC = () => {
  const [pendingAppointments, setPendingAppointments] = useState<PendingCheckout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadPendingCheckouts();
  }, []);

  const loadPendingCheckouts = async () => {
    setIsLoading(true);
    try {
      console.log('🔍 Buscando agendamentos com check-in pendente...');
      
      const { data, error } = await supabase.functions.invoke('pending-checkouts', {
        body: { action: 'list' }
      });

      if (error) throw error;

      console.log('✅ Agendamentos pendentes carregados:', data.count);
      setPendingAppointments(data.appointments || []);
      
      if (data.count === 0) {
        toast.success('Sem pendências', {
          description: 'Todos os check-ins possuem checkout!'
        });
      } else {
        toast.info(`${data.count} checkout(s) pendente(s)`, {
          description: 'Estes agendamentos precisam de checkout'
        });
      }
    } catch (error: any) {
      console.error('❌ Erro ao carregar checkouts pendentes:', error);
      toast.error('Erro ao carregar dados', {
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForceCheckout = async (sessionId: string) => {
    setIsProcessing(true);
    try {
      console.log('🔧 Forçando checkout para sessão:', sessionId);
      
      const { data, error } = await supabase.functions.invoke('pending-checkouts', {
        body: {
          action: 'force_checkout',
          session_id: sessionId
        }
      });

      if (error) throw error;

      console.log('✅ Checkout forçado com sucesso:', data);
      toast.success('Checkout realizado!', {
        description: 'O atendimento foi finalizado com sucesso'
      });

      // Recarregar lista
      await loadPendingCheckouts();
      setSelectedSession(null);
    } catch (error: any) {
      console.error('❌ Erro ao forçar checkout:', error);
      toast.error('Erro ao realizar checkout', {
        description: error.message
      });
    } finally {
      setIsProcessing(false);
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
      <div className="container mx-auto p-6">
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="animate-spin h-12 w-12 border-4 border-urbana-gold border-t-transparent rounded-full"></div>
          <p className="text-sm text-gray-500">Carregando checkouts pendentes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <AlertCircle className="h-8 w-8 text-orange-600" />
          <h1 className="text-3xl font-bold text-gray-900">Checkouts Pendentes</h1>
        </div>
        <p className="text-gray-600">
          Agendamentos com check-in realizado aguardando checkout
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-600 rounded-lg">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-orange-700 font-medium">Total Pendente</p>
              <p className="text-2xl font-bold text-orange-900">{pendingAppointments.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600 rounded-lg">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-blue-700 font-medium">Clientes Aguardando</p>
              <p className="text-2xl font-bold text-blue-900">
                {new Set(pendingAppointments.map(a => a.painel_clientes.nome)).size}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-600 rounded-lg">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-green-700 font-medium">Mais Antigo</p>
              <p className="text-lg font-bold text-green-900">
                {pendingAppointments.length > 0 
                  ? getDaysAgo(pendingAppointments[0].data, pendingAppointments[0].hora)
                  : 'N/A'
                }
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Lista de agendamentos pendentes */}
      {pendingAppointments.length === 0 ? (
        <Card className="p-12 text-center">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Tudo em ordem! 🎉
          </h3>
          <p className="text-gray-600">
            Não há checkouts pendentes no momento
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {pendingAppointments.map((appointment) => {
            const session = appointment.totem_sessions[0];
            const checkInDate = parseISO(session.check_in_time);
            
            return (
              <Card key={appointment.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  {/* Info do agendamento */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-urbana-gold to-yellow-600 flex items-center justify-center text-white font-bold">
                        {appointment.painel_clientes.nome.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">
                          {appointment.painel_clientes.nome}
                        </h3>
                        <p className="text-sm text-gray-500">{appointment.painel_clientes.whatsapp}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-gray-500 font-medium">Data Agendada</p>
                        <p className="font-bold text-gray-900">
                          {format(parseISO(appointment.data + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                        <p className="text-xs text-gray-600">{appointment.hora}</p>
                      </div>

                      <div>
                        <p className="text-gray-500 font-medium">Check-in</p>
                        <p className="font-bold text-blue-600">
                          {format(checkInDate, 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                        <p className="text-xs text-blue-600">
                          {format(checkInDate, 'HH:mm', { locale: ptBR })}
                        </p>
                      </div>

                      <div>
                        <p className="text-gray-500 font-medium">Barbeiro</p>
                        <p className="font-bold text-gray-900">{appointment.painel_barbeiros.nome}</p>
                      </div>

                      <div>
                        <p className="text-gray-500 font-medium">Serviço</p>
                        <p className="font-bold text-gray-900">{appointment.painel_servicos.nome}</p>
                        <p className="text-xs text-green-600 font-semibold">
                          R$ {appointment.painel_servicos.preco.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Badge className="bg-orange-100 text-orange-700 border-orange-300">
                        ⏰ {getDaysAgo(appointment.data, appointment.hora)}
                      </Badge>
                      <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">
                        🔔 Checkout Pendente
                      </Badge>
                    </div>
                  </div>

                  {/* Ação */}
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={() => setSelectedSession(session.id)}
                      className="bg-green-600 hover:bg-green-700 text-white font-bold"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Realizar Checkout
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

      {/* Dialog de confirmação */}
      <AlertDialog open={!!selectedSession} onOpenChange={(open) => !open && setSelectedSession(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Confirmar Checkout
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Você está prestes a <strong>finalizar este atendimento</strong> realizando o checkout.
              </p>
              
              <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
                <p className="text-sm text-blue-800 font-medium">
                  ✅ O checkout será realizado <strong>independente da data/hora</strong>
                </p>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
                <p className="text-sm text-yellow-800">
                  Esta ação irá:
                </p>
                <ul className="text-xs text-yellow-700 mt-2 ml-4 space-y-1 list-disc">
                  <li>Marcar o agendamento como <strong>CONCLUÍDO</strong></li>
                  <li>Registrar o horário de checkout atual</li>
                  <li>Finalizar a venda (se existir)</li>
                  <li>Atualizar o status da sessão para <strong>COMPLETED</strong></li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedSession && handleForceCheckout(selectedSession)}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? 'Processando...' : 'Confirmar Checkout'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PendingCheckouts;
