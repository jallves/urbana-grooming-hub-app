
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DollarSign, User, CheckCircle, Clock, CreditCard, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ComissoesTabProps {
  filters: {
    mes: number;
    ano: number;
    tipo: string;
    barbeiro: string;
  };
}

interface Commission {
  id: string;
  amount: number;
  commission_rate: number;
  status: 'pending' | 'paid';
  created_at: string;
  payment_date?: string;
  paid_at?: string;
  payment_method?: string;
  notes?: string;
  appointment_id: string;
  barber_id: string;
  barber?: { name: string };
  appointment_source?: string;
}

interface CommissionStats {
  total: number;
  pago: number;
  pendente: number;
}

const ComissoesTab: React.FC<ComissoesTabProps> = ({ filters }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCommission, setSelectedCommission] = useState<Commission | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [notes, setNotes] = useState('');
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

  const { data: commissions, isLoading } = useQuery({
    queryKey: ['commissions', filters],
    queryFn: async () => {
      const startDate = new Date(filters.ano, filters.mes - 1, 1);
      const endDate = new Date(filters.ano, filters.mes, 0);

      // Buscar todas as comissões
      const { data: allCommissions, error } = await supabase
        .from('barber_commissions')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar comissões:', error);
        return [];
      }

      // Buscar nomes dos barbeiros
      const commissionsWithNames = [];
      for (const commission of allCommissions || []) {
        let barberName = 'Barbeiro';
        
        if (commission.appointment_source === 'painel') {
          // Buscar nome do painel_barbeiros
          const { data: barberData } = await supabase
            .from('painel_barbeiros')
            .select('nome')
            .eq('id', commission.barber_id)
            .single();
          barberName = barberData?.nome || 'Barbeiro';
        } else {
          // Buscar nome do staff
          const { data: staffData } = await supabase
            .from('staff')
            .select('name')
            .eq('id', commission.barber_id)
            .single();
          barberName = staffData?.name || 'Barbeiro';
        }

        commissionsWithNames.push({
          ...commission,
          barber: { name: barberName }
        });
      }

      // Aplicar filtros
      let filteredCommissions = commissionsWithNames;
      
      if (filters.barbeiro !== 'todos') {
        filteredCommissions = filteredCommissions.filter(c => c.barber_id === filters.barbeiro);
      }

      return filteredCommissions as Commission[];
    }
  });

  const { data: commissionStats } = useQuery({
    queryKey: ['commission-stats', filters],
    queryFn: async (): Promise<Record<string, CommissionStats>> => {
      const startDate = new Date(filters.ano, filters.mes - 1, 1);
      const endDate = new Date(filters.ano, filters.mes, 0);

      const { data: allData, error } = await supabase
        .from('barber_commissions')
        .select('amount, status, barber_id, appointment_source')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (error) {
        console.error('Erro ao buscar estatísticas:', error);
        return {};
      }

      // Buscar nomes dos barbeiros e processar estatísticas
      const dataWithNames = [];
      for (const data of allData || []) {
        let barberName = 'Barbeiro';
        
        if (data.appointment_source === 'painel') {
          const { data: barberData } = await supabase
            .from('painel_barbeiros')
            .select('nome')
            .eq('id', data.barber_id)
            .single();
          barberName = barberData?.nome || 'Barbeiro';
        } else {
          const { data: staffData } = await supabase
            .from('staff')
            .select('name')
            .eq('id', data.barber_id)
            .single();
          barberName = staffData?.name || 'Barbeiro';
        }

        dataWithNames.push({
          ...data,
          barber_name: barberName
        });
      }

      const stats = dataWithNames.reduce((acc, commission) => {
        const barberName = commission.barber_name;
        if (!acc[barberName]) {
          acc[barberName] = { total: 0, pago: 0, pendente: 0 };
        }
        acc[barberName].total += Number(commission.amount);
        if (commission.status === 'paid') {
          acc[barberName].pago += Number(commission.amount);
        } else {
          acc[barberName].pendente += Number(commission.amount);
        }
        return acc;
      }, {} as Record<string, CommissionStats>);

      return stats;
    }
  });

  const payCommissionMutation = useMutation({
    mutationFn: async ({ 
      commissionId, 
      paymentMethod, 
      notes 
    }: { 
      commissionId: string; 
      paymentMethod: string; 
      notes?: string; 
    }) => {
      console.log('Iniciando pagamento da comissão:', commissionId);
      
      // Atualizar status da comissão
      const { error: commissionError } = await supabase
        .from('barber_commissions')
        .update({ 
          status: 'paid',
          payment_method: paymentMethod,
          notes: notes,
          paid_at: new Date().toISOString()
        })
        .eq('id', commissionId);

      if (commissionError) {
        console.error('Erro ao atualizar comissão:', commissionError);
        throw new Error('Erro ao atualizar status da comissão');
      }

      // Buscar dados da comissão para criar registro no fluxo de caixa
      const { data: commission, error: fetchError } = await supabase
        .from('barber_commissions')
        .select('*')
        .eq('id', commissionId)
        .single();

      if (fetchError || !commission) {
        console.error('Erro ao buscar dados da comissão:', fetchError);
        throw new Error('Erro ao buscar dados da comissão');
      }

      // Buscar nome do barbeiro
      let barberName = 'Barbeiro';
      if (commission.appointment_source === 'painel') {
        const { data: barberData } = await supabase
          .from('painel_barbeiros')
          .select('nome')
          .eq('id', commission.barber_id)
          .single();
        barberName = barberData?.nome || 'Barbeiro';
      } else {
        const { data: staffData } = await supabase
          .from('staff')
          .select('name')
          .eq('id', commission.barber_id)
          .single();
        barberName = staffData?.name || 'Barbeiro';
      }
      
      // Registrar despesa no fluxo de caixa
      const { error: cashFlowError } = await supabase
        .from('cash_flow')
        .insert({
          transaction_type: 'expense',
          amount: commission.amount,
          description: `Comissão paga - ${barberName}`,
          category: 'Comissões',
          payment_method: paymentMethod,
          reference_id: commissionId,
          reference_type: 'commission',
          notes: notes,
          transaction_date: new Date().toISOString().split('T')[0]
        });

      if (cashFlowError) {
        console.error('Erro ao registrar no fluxo de caixa:', cashFlowError);
        throw new Error('Erro ao registrar no fluxo de caixa');
      }

      console.log('Pagamento processado com sucesso');
      return { success: true };
    },
    onSuccess: () => {
      // Invalidar todas as queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
      queryClient.invalidateQueries({ queryKey: ['commission-stats'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      queryClient.invalidateQueries({ queryKey: ['cash-flow'] });
      
      // Resetar estado
      setIsPaymentDialogOpen(false);
      setSelectedCommission(null);
      setPaymentMethod('');
      setNotes('');
      
      toast({
        title: '✅ Pagamento confirmado',
        description: 'A comissão foi paga e registrada no fluxo de caixa com sucesso.',
        duration: 3000,
      });
    },
    onError: (error) => {
      console.error('Erro no pagamento:', error);
      toast({
        title: '❌ Erro no pagamento',
        description: error.message || 'Não foi possível processar o pagamento da comissão.',
        variant: 'destructive',
        duration: 5000,
      });
    }
  });

  const handlePayCommission = (commission: Commission) => {
    console.log('Abrindo modal de pagamento para:', commission);
    setSelectedCommission(commission);
    setPaymentMethod('');
    setNotes('');
    setIsPaymentDialogOpen(true);
  };

  const confirmPayment = () => {
    if (!selectedCommission) {
      toast({
        title: '❌ Erro',
        description: 'Nenhuma comissão selecionada.',
        variant: 'destructive',
      });
      return;
    }

    if (!paymentMethod) {
      toast({
        title: '❌ Erro',
        description: 'Selecione uma forma de pagamento.',
        variant: 'destructive',
      });
      return;
    }

    console.log('Confirmando pagamento:', {
      commissionId: selectedCommission.id,
      paymentMethod,
      notes
    });

    payCommissionMutation.mutate({
      commissionId: selectedCommission.id,
      paymentMethod,
      notes
    });
  };

  const closeModal = () => {
    setIsPaymentDialogOpen(false);
    setSelectedCommission(null);
    setPaymentMethod('');
    setNotes('');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumo por Barbeiro */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(commissionStats || {}).map(([staffName, stats]) => (
          <Card key={staffName} className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">
                {staffName}
              </CardTitle>
              <User className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Total:</span>
                  <span className="text-sm font-medium text-white">
                    R$ {stats.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Pago:</span>
                  <span className="text-sm font-medium text-green-500">
                    R$ {stats.pago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Pendente:</span>
                  <span className="text-sm font-medium text-yellow-500">
                    R$ {stats.pendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Lista de Comissões */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Comissões Detalhadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {commissions?.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                Nenhuma comissão encontrada para o período selecionado.
              </div>
            ) : (
              commissions?.map((commission) => (
                <div key={commission.id} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${
                      commission.status === 'paid' ? 'bg-green-500/20' : 'bg-yellow-500/20'
                    }`}>
                      {commission.status === 'paid' ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Clock className="h-4 w-4 text-yellow-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-white">{commission.barber?.name}</p>
                      <p className="text-sm text-gray-400">
                        Taxa: {commission.commission_rate}% • {format(new Date(commission.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                      {commission.payment_method && (
                        <p className="text-xs text-gray-500">
                          Pago via: {commission.payment_method}
                        </p>
                      )}
                      {commission.paid_at && (
                        <p className="text-xs text-green-500">
                          Pago em: {format(new Date(commission.paid_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="font-bold text-green-500">
                        R$ {Number(commission.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <Badge variant={commission.status === 'paid' ? 'default' : 'secondary'}>
                        {commission.status === 'paid' ? 'Pago' : 'Pendente'}
                      </Badge>
                    </div>
                    {commission.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => handlePayCommission(commission)}
                        disabled={payCommissionMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <DollarSign className="h-4 w-4 mr-1" />
                        Pagar
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Pagamento */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-700 text-gray-100">
          <DialogHeader>
            <DialogTitle className="text-white">Pagar Comissão</DialogTitle>
            <button
              onClick={closeModal}
              className="absolute right-4 top-4 text-gray-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </DialogHeader>
          
          {selectedCommission && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-800 rounded-lg">
                <p className="font-medium text-white mb-1">{selectedCommission.barber?.name}</p>
                <p className="text-green-500 font-bold text-lg">
                  R$ {Number(selectedCommission.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-gray-400">
                  Taxa: {selectedCommission.commission_rate}%
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Forma de Pagamento *</label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue placeholder="Selecione a forma de pagamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="transferencia">Transferência</SelectItem>
                    <SelectItem value="cartao">Cartão</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Observações</label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observações sobre o pagamento (opcional)"
                  className="bg-gray-800 border-gray-700"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={closeModal}
                  className="border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={confirmPayment}
                  disabled={payCommissionMutation.isPending || !paymentMethod}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  {payCommissionMutation.isPending ? 'Processando...' : 'Confirmar Pagamento'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ComissoesTab;
