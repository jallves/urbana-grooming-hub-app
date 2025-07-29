
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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

  const { data: commissions = [], isLoading, refetch: refetchCommissions } = useQuery({
    queryKey: ['commissions', filters],
    queryFn: async () => {
      console.log('🔄 Buscando comissões com filtros:', filters);
      
      const startDate = new Date(filters.ano, filters.mes - 1, 1);
      const endDate = new Date(filters.ano, filters.mes, 0, 23, 59, 59);

      console.log('📅 Período:', { startDate: startDate.toISOString(), endDate: endDate.toISOString() });

      let query = supabase
        .from('barber_commissions')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      if (filters.barbeiro !== 'todos') {
        query = query.eq('barber_id', filters.barbeiro);
      }

      const { data: allCommissions, error } = await query;

      if (error) {
        console.error('❌ Erro ao buscar comissões:', error);
        throw error;
      }

      console.log('📊 Comissões encontradas:', allCommissions?.length || 0);

      // Buscar nomes dos barbeiros
      const commissionsWithNames = [];
      for (const commission of allCommissions || []) {
        let barberName = 'Barbeiro';
        
        try {
          if (commission.appointment_source === 'painel') {
            const { data: barberData } = await supabase
              .from('painel_barbeiros')
              .select('nome')
              .eq('id', commission.barber_id)
              .single();
            barberName = barberData?.nome || 'Barbeiro do Painel';
          } else {
            const { data: staffData } = await supabase
              .from('staff')
              .select('name')
              .eq('id', commission.barber_id)
              .single();
            barberName = staffData?.name || 'Staff';
          }
        } catch (nameError) {
          console.warn('⚠️ Erro ao buscar nome do barbeiro:', nameError);
        }

        commissionsWithNames.push({
          ...commission,
          barber: { name: barberName }
        });
      }

      console.log('✅ Comissões processadas:', commissionsWithNames.length);
      return commissionsWithNames as Commission[];
    }
  });

  const { data: commissionStats = {}, refetch: refetchStats } = useQuery({
    queryKey: ['commission-stats', filters],
    queryFn: async (): Promise<Record<string, CommissionStats>> => {
      const startDate = new Date(filters.ano, filters.mes - 1, 1);
      const endDate = new Date(filters.ano, filters.mes, 0, 23, 59, 59);

      let query = supabase
        .from('barber_commissions')
        .select('amount, status, barber_id, appointment_source')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (filters.barbeiro !== 'todos') {
        query = query.eq('barber_id', filters.barbeiro);
      }

      const { data: allData, error } = await query;

      if (error) {
        console.error('❌ Erro ao buscar estatísticas:', error);
        return {};
      }

      // Processar estatísticas
      const dataWithNames = [];
      for (const data of allData || []) {
        let barberName = 'Barbeiro';
        
        try {
          if (data.appointment_source === 'painel') {
            const { data: barberData } = await supabase
              .from('painel_barbeiros')
              .select('nome')
              .eq('id', data.barber_id)
              .single();
            barberName = barberData?.nome || 'Barbeiro do Painel';
          } else {
            const { data: staffData } = await supabase
              .from('staff')
              .select('name')
              .eq('id', data.barber_id)
              .single();
            barberName = staffData?.name || 'Staff';
          }
        } catch (nameError) {
          console.warn('⚠️ Erro ao buscar nome para estatísticas:', nameError);
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
      console.log('💰 Iniciando pagamento da comissão:', commissionId);
      console.log('💳 Método de pagamento:', paymentMethod);
      console.log('📝 Notas:', notes);
      
      // Verificar se o usuário atual é admin
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Verificar role do usuário
      const { data: userRole, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();

      if (roleError || !userRole) {
        console.error('❌ Erro ao verificar role do usuário:', roleError);
        throw new Error('Usuário não tem permissão de admin');
      }

      console.log('✅ Usuário admin verificado:', userRole);

      // Primeiro, buscar a comissão atual para verificar o estado
      const { data: currentCommission, error: fetchError } = await supabase
        .from('barber_commissions')
        .select('*')
        .eq('id', commissionId)
        .single();

      if (fetchError) {
        console.error('❌ Erro ao buscar comissão atual:', fetchError);
        throw new Error(`Erro ao buscar comissão: ${fetchError.message}`);
      }

      console.log('📋 Comissão atual:', currentCommission);

      if (currentCommission.status === 'paid') {
        throw new Error('Esta comissão já foi paga');
      }

      // Atualizar status da comissão
      const now = new Date().toISOString();
      const { data: updatedCommission, error: updateError } = await supabase
        .from('barber_commissions')
        .update({ 
          status: 'paid',
          payment_method: paymentMethod,
          notes: notes || null,
          paid_at: now
        })
        .eq('id', commissionId)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Erro ao atualizar comissão:', updateError);
        throw new Error(`Erro ao atualizar status da comissão: ${updateError.message}`);
      }

      console.log('✅ Comissão atualizada com sucesso:', updatedCommission);

      // Buscar nome do barbeiro para o registro no fluxo de caixa
      let barberName = 'Barbeiro';
      try {
        if (updatedCommission.appointment_source === 'painel') {
          const { data: barberData } = await supabase
            .from('painel_barbeiros')
            .select('nome')
            .eq('id', updatedCommission.barber_id)
            .single();
          barberName = barberData?.nome || 'Barbeiro do Painel';
        } else {
          const { data: staffData } = await supabase
            .from('staff')
            .select('name')
            .eq('id', updatedCommission.barber_id)
            .single();
          barberName = staffData?.name || 'Staff';
        }
      } catch (nameError) {
        console.warn('⚠️ Erro ao buscar nome para fluxo de caixa:', nameError);
      }
      
      // Registrar despesa no fluxo de caixa
      const { data: cashFlowData, error: cashFlowError } = await supabase
        .from('cash_flow')
        .insert({
          transaction_type: 'expense',
          amount: Number(updatedCommission.amount),
          description: `Comissão paga - ${barberName}`,
          category: 'Comissões',
          payment_method: paymentMethod,
          reference_id: commissionId,
          reference_type: 'commission',
          notes: notes || null,
          transaction_date: new Date().toISOString().split('T')[0]
        })
        .select()
        .single();

      if (cashFlowError) {
        console.error('❌ Erro ao registrar no fluxo de caixa:', cashFlowError);
        // Não falhar aqui, apenas registrar o erro
        console.warn('⚠️ Comissão foi paga mas não foi registrada no fluxo de caixa');
      } else {
        console.log('✅ Registro do fluxo de caixa criado:', cashFlowData);
      }

      console.log('🎯 Pagamento processado com sucesso');
      return { success: true, commission: updatedCommission };
    },
    onSuccess: (data) => {
      console.log('🎉 Sucesso na mutation, atualizando dados...');
      
      // Forçar reload imediato das queries
      refetchCommissions();
      refetchStats();
      
      // Invalidar todas as queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
      queryClient.invalidateQueries({ queryKey: ['commission-stats'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      queryClient.invalidateQueries({ queryKey: ['cash-flow'] });
      
      // Resetar estado do modal
      setIsPaymentDialogOpen(false);
      setSelectedCommission(null);
      setPaymentMethod('');
      setNotes('');
      
      toast({
        title: '✅ Pagamento confirmado',
        description: `Comissão de R$ ${Number(data.commission.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} foi paga com sucesso.`,
        duration: 3000,
      });
    },
    onError: (error: any) => {
      console.error('❌ Erro no pagamento:', error);
      toast({
        title: '❌ Erro no pagamento',
        description: error.message || 'Não foi possível processar o pagamento da comissão.',
        variant: 'destructive',
        duration: 5000,
      });
    }
  });

  const handlePayCommission = (commission: Commission) => {
    console.log('💰 Abrindo modal de pagamento para comissão:', commission.id);
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

    console.log('🔄 Confirmando pagamento:', {
      commissionId: selectedCommission.id,
      paymentMethod,
      notes,
      amount: selectedCommission.amount
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
        {Object.entries(commissionStats).map(([staffName, stats]) => (
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
            {commissions.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                Nenhuma comissão encontrada para o período selecionado.
              </div>
            ) : (
              commissions.map((commission) => (
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
                      <p className="text-xs text-gray-500">
                        ID: {commission.id.slice(0, 8)}...
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
                        {payCommissionMutation.isPending ? 'Pagando...' : 'Pagar'}
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
            <DialogTitle className="text-white">Confirmar Pagamento de Comissão</DialogTitle>
            <button
              onClick={closeModal}
              className="absolute right-4 top-4 text-gray-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </DialogHeader>
          
          {selectedCommission && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-800 rounded-lg border border-gray-600">
                <p className="font-medium text-white mb-2">{selectedCommission.barber?.name}</p>
                <p className="text-green-500 font-bold text-xl mb-1">
                  R$ {Number(selectedCommission.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-gray-400">
                  Taxa: {selectedCommission.commission_rate}% • ID: {selectedCommission.id.slice(0, 8)}...
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Forma de Pagamento *</label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue placeholder="Selecione a forma de pagamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dinheiro">💵 Dinheiro</SelectItem>
                    <SelectItem value="pix">🏦 PIX</SelectItem>
                    <SelectItem value="transferencia">💳 Transferência</SelectItem>
                    <SelectItem value="cartao">💳 Cartão</SelectItem>
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
                  disabled={payCommissionMutation.isPending}
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
