
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
import { DollarSign, User, CheckCircle, Clock, CreditCard } from 'lucide-react';
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
  staff?: { name: string };
  appointment_source?: string;
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

      let query = supabase
        .from('barber_commissions')
        .select(`
          *,
          staff:barber_id(name)
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      if (filters.barbeiro !== 'todos') {
        query = query.eq('barber_id', filters.barbeiro);
      }

      const { data } = await query;
      return data as Commission[] || [];
    }
  });

  const { data: commissionStats } = useQuery({
    queryKey: ['commission-stats', filters],
    queryFn: async () => {
      const startDate = new Date(filters.ano, filters.mes - 1, 1);
      const endDate = new Date(filters.ano, filters.mes, 0);

      let query = supabase
        .from('barber_commissions')
        .select('amount, status, barber_id, staff:barber_id(name)')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (filters.barbeiro !== 'todos') {
        query = query.eq('barber_id', filters.barbeiro);
      }

      const { data } = await query;
      
      const stats = data?.reduce((acc, commission) => {
        const staffName = commission.staff?.name || 'Desconhecido';
        if (!acc[staffName]) {
          acc[staffName] = { total: 0, pago: 0, pendente: 0 };
        }
        acc[staffName].total += Number(commission.amount);
        if (commission.status === 'paid') {
          acc[staffName].pago += Number(commission.amount);
        } else {
          acc[staffName].pendente += Number(commission.amount);
        }
        return acc;
      }, {} as Record<string, { total: number; pago: number; pendente: number }>);

      return stats || {};
    }
  });

  const payCommissionMutation = useMutation({
    mutationFn: async ({ commissionId, paymentMethod, notes }: { 
      commissionId: string; 
      paymentMethod: string; 
      notes?: string; 
    }) => {
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

      if (commissionError) throw commissionError;

      // Buscar dados da comissão para criar registro no fluxo de caixa
      const { data: commission } = await supabase
        .from('barber_commissions')
        .select(`
          *,
          staff:barber_id(name)
        `)
        .eq('id', commissionId)
        .single();

      if (commission) {
        // Registrar despesa no fluxo de caixa
        const { error: cashFlowError } = await supabase
          .from('cash_flow')
          .insert({
            transaction_type: 'expense',
            amount: commission.amount,
            description: `Comissão paga - ${commission.staff?.name}`,
            category: 'Comissões',
            payment_method: paymentMethod,
            reference_id: commissionId,
            reference_type: 'commission',
            notes: notes,
            transaction_date: new Date().toISOString().split('T')[0]
          });

        if (cashFlowError) throw cashFlowError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
      queryClient.invalidateQueries({ queryKey: ['commission-stats'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      setIsPaymentDialogOpen(false);
      setSelectedCommission(null);
      setPaymentMethod('');
      setNotes('');
      toast({
        title: 'Comissão paga',
        description: 'A comissão foi marcada como paga e registrada no fluxo de caixa.',
      });
    },
    onError: (error) => {
      console.error('Erro ao pagar comissão:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível processar o pagamento da comissão.',
        variant: 'destructive',
      });
    }
  });

  const handlePayCommission = (commission: Commission) => {
    setSelectedCommission(commission);
    setIsPaymentDialogOpen(true);
  };

  const confirmPayment = () => {
    if (!selectedCommission || !paymentMethod) {
      toast({
        title: 'Erro',
        description: 'Selecione uma forma de pagamento.',
        variant: 'destructive',
      });
      return;
    }

    payCommissionMutation.mutate({
      commissionId: selectedCommission.id,
      paymentMethod,
      notes
    });
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
                      <p className="font-medium text-white">{commission.staff?.name}</p>
                      <p className="text-sm text-gray-400">
                        Taxa: {commission.commission_rate}% • {format(new Date(commission.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                      {commission.payment_method && (
                        <p className="text-xs text-gray-500">
                          Pago via: {commission.payment_method}
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
            <DialogTitle>Pagar Comissão</DialogTitle>
          </DialogHeader>
          
          {selectedCommission && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-800 rounded-lg">
                <p className="font-medium text-white">{selectedCommission.staff?.name}</p>
                <p className="text-green-500 font-bold">
                  R$ {Number(selectedCommission.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
                  onClick={() => setIsPaymentDialogOpen(false)}
                  className="border-gray-600 text-gray-300"
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
