import React, { useState, useEffect, useCallback, useRef } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Clock, User, Calendar, RefreshCw } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import AdminCheckoutModal from '@/components/admin/pending-checkouts/AdminCheckoutModal';

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
  session_id: string;
  session_status: string;
  check_in_time: string;
}

const PendingCheckouts: React.FC = () => {
  const [pendingAppointments, setPendingAppointments] = useState<PendingCheckout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<PendingCheckout | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadPendingCheckouts = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: agendamentos, error } = await supabase
        .from('painel_agendamentos')
        .select(`
          id, data, hora, status, status_totem, updated_at,
          painel_clientes(nome, whatsapp),
          painel_barbeiros(nome),
          painel_servicos(nome, preco)
        `)
        .eq('status_totem', 'CHEGOU')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      if (!agendamentos || agendamentos.length === 0) {
        setPendingAppointments([]);
        setIsLoading(false);
        return;
      }

      const appointmentIds = agendamentos.map(a => a.id);
      const { data: sessions } = await supabase
        .from('appointment_totem_sessions')
        .select('appointment_id, totem_session_id, status, created_at')
        .in('appointment_id', appointmentIds)
        .order('created_at', { ascending: false });

      const combined = agendamentos.map(agendamento => {
        const sessao = sessions?.find(s => s.appointment_id === agendamento.id);
        return {
          ...agendamento,
          painel_clientes: agendamento.painel_clientes || { nome: 'N/A', whatsapp: '' },
          painel_barbeiros: agendamento.painel_barbeiros || { nome: 'N/A' },
          painel_servicos: agendamento.painel_servicos || { nome: 'N/A', preco: 0 },
          session_id: sessao?.totem_session_id || agendamento.id,
          session_status: sessao?.status || 'checked_in',
          check_in_time: sessao?.created_at || agendamento.updated_at || '',
        } as PendingCheckout;
      });

      setPendingAppointments(combined);
    } catch (error: any) {
      console.error('Erro ao carregar checkouts pendentes:', error);
      toast.error('Erro ao carregar dados', { description: error.message });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const debouncedReload = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      loadPendingCheckouts();
    }, 300);
  }, [loadPendingCheckouts]);

  useEffect(() => {
    loadPendingCheckouts();

    const channel = supabase
      .channel('pending-checkouts-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointment_totem_sessions' }, debouncedReload)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'painel_agendamentos' }, debouncedReload)
      .subscribe();

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      supabase.removeChannel(channel);
    };
  }, [loadPendingCheckouts, debouncedReload]);

  const handleCheckout = async (
    sessionId: string,
    checkoutType: 'full' | 'courtesy' | 'custom',
    customValue?: number,
    payCommission?: boolean
  ) => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('pending-checkouts', {
        body: {
          action: 'force_checkout',
          session_id: sessionId,
          checkout_type: checkoutType,
          custom_value: customValue,
          pay_commission: payCommission ?? true,
        }
      });

      if (error) throw error;

      const label = checkoutType === 'courtesy'
        ? 'Cortesia registrada!'
        : checkoutType === 'custom'
          ? `Checkout com valor personalizado R$ ${(customValue || 0).toFixed(2)}`
          : 'Checkout com valor total realizado!';

      toast.success('Checkout realizado!', { description: label });

      await loadPendingCheckouts();
      setSelectedAppointment(null);
    } catch (error: any) {
      console.error('Erro ao realizar checkout:', error);
      toast.error('Erro ao realizar checkout', { description: error.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const getDaysAgo = (dateStr: string, timeStr: string) => {
    try {
      const appointmentDate = parseISO(`${dateStr}T${timeStr}`);
      const now = new Date();
      const diffInDays = Math.floor((now.getTime() - appointmentDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffInDays === 0) return 'Hoje';
      if (diffInDays === 1) return 'Ontem';
      return `${diffInDays} dias atrás`;
    } catch {
      return 'Data inválida';
    }
  };

  return (
    <AdminLayout title="Checkouts Pendentes">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="animate-spin h-12 w-12 border-4 border-urbana-gold border-t-transparent rounded-full"></div>
          <p className="text-sm text-gray-500">Carregando checkouts pendentes...</p>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-8 w-8 text-orange-600" />
                <p className="text-sm text-gray-600">
                  Agendamentos com check-in realizado aguardando checkout
                </p>
              </div>
              <Button onClick={loadPendingCheckouts} variant="outline" size="sm" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Atualizar
              </Button>
            </div>
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
                    {new Set(pendingAppointments.map(a => a.painel_clientes?.nome)).size}
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

          {/* Lista */}
          {pendingAppointments.length === 0 ? (
            <Card className="p-12 text-center">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Tudo em ordem! 🎉</h3>
              <p className="text-gray-600">Não há checkouts pendentes no momento</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingAppointments.map((appointment) => {
                const checkInDate = appointment.check_in_time ? parseISO(appointment.check_in_time) : new Date();

                return (
                  <Card key={appointment.id} className="p-6 hover:shadow-lg transition-shadow">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-urbana-gold to-yellow-600 flex items-center justify-center text-white font-bold">
                            {appointment.painel_clientes?.nome?.charAt(0) || '?'}
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-gray-900">
                              {appointment.painel_clientes?.nome || 'N/A'}
                            </h3>
                            <p className="text-sm text-gray-500">{appointment.painel_clientes?.whatsapp || ''}</p>
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
                            <p className="font-bold text-gray-900">{appointment.painel_barbeiros?.nome || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 font-medium">Serviço</p>
                            <p className="font-bold text-gray-900">{appointment.painel_servicos?.nome || 'N/A'}</p>
                            <p className="text-xs text-green-600 font-semibold">
                              R$ {(appointment.painel_servicos?.preco || 0).toFixed(2)}
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

                      <div className="flex flex-col gap-2">
                        <Button
                          onClick={() => setSelectedAppointment(appointment)}
                          className="bg-green-600 hover:bg-green-700 text-white font-bold"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Realizar Checkout
                        </Button>
                        <p className="text-xs text-center text-gray-500">
                          Sessão: {appointment.session_id?.substring(0, 8)}...
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Modal de checkout */}
          <AdminCheckoutModal
            open={!!selectedAppointment}
            onOpenChange={(open) => !open && setSelectedAppointment(null)}
            data={selectedAppointment ? {
              appointmentId: selectedAppointment.id,
              sessionId: selectedAppointment.session_id,
              clientName: selectedAppointment.painel_clientes?.nome || 'N/A',
              barberName: selectedAppointment.painel_barbeiros?.nome || 'N/A',
              serviceName: selectedAppointment.painel_servicos?.nome || 'N/A',
              servicePrice: selectedAppointment.painel_servicos?.preco || 0,
            } : null}
            isProcessing={isProcessing}
            onConfirm={handleCheckout}
          />
        </>
      )}
    </AdminLayout>
  );
};

export default PendingCheckouts;
