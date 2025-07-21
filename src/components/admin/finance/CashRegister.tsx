
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, DollarSign, TrendingUp, TrendingDown, Calculator } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface CashRegisterSession {
  id: string;
  date: string;
  opened_at: string;
  closed_at: string | null;
  opening_balance: number;
  closing_balance: number | null;
  total_sales: number;
  total_expenses: number;
  total_commissions: number;
  status: 'open' | 'closed';
}

interface TodayTransactions {
  sales: number;
  expenses: number;
  commissions: number;
  transactions: any[];
}

const CashRegister: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: todaySession, isLoading } = useQuery({
    queryKey: ['cash-register-today'],
    queryFn: async (): Promise<CashRegisterSession | null> => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('cash_register_sessions')
        .select('*')
        .eq('date', today)
        .maybeSingle();

      if (error) {
        console.error('Error fetching cash register session:', error);
        throw error;
      }
      return data;
    },
    refetchInterval: 30000, // Atualiza a cada 30 segundos
  });

  const { data: todayTransactions } = useQuery({
    queryKey: ['today-transactions'],
    queryFn: async (): Promise<TodayTransactions> => {
      const today = format(new Date(), 'yyyy-MM-dd');
      
      // Buscar transações do fluxo de caixa
      const { data: cashFlow, error: cfError } = await supabase
        .from('cash_flow')
        .select('*')
        .eq('transaction_date', today);

      if (cfError) {
        console.error('Error fetching cash flow:', cfError);
        throw cfError;
      }

      // Buscar comissões do dia
      const { data: commissions, error: commError } = await supabase
        .from('barber_commissions')
        .select('*')
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`);

      if (commError) {
        console.error('Error fetching commissions:', commError);
        throw commError;
      }

      const sales = cashFlow?.filter(t => t.transaction_type === 'income').reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      const expenses = cashFlow?.filter(t => t.transaction_type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      const totalCommissions = commissions?.reduce((sum, c) => sum + Number(c.amount), 0) || 0;

      return { sales, expenses, commissions: totalCommissions, transactions: cashFlow || [] };
    },
  });

  const openCashRegister = useMutation({
    mutationFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const now = new Date();
      
      const { data, error } = await supabase
        .from('cash_register_sessions')
        .insert({
          date: today,
          opened_at: now.toISOString(),
          opening_balance: 0,
          total_sales: 0,
          total_expenses: 0,
          total_commissions: 0,
          status: 'open'
        })
        .select()
        .single();

      if (error) {
        console.error('Error opening cash register:', error);
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-register-today'] });
      toast.success('Caixa aberto com sucesso!');
    },
    onError: (error) => {
      console.error('Error opening cash register:', error);
      toast.error('Erro ao abrir caixa');
    }
  });

  const closeCashRegister = useMutation({
    mutationFn: async () => {
      if (!todaySession) throw new Error('Nenhuma sessão encontrada');

      const now = new Date();
      const closingBalance = (todayTransactions?.sales || 0) - (todayTransactions?.expenses || 0) - (todayTransactions?.commissions || 0);

      const { error } = await supabase
        .from('cash_register_sessions')
        .update({
          closed_at: now.toISOString(),
          closing_balance: closingBalance,
          total_sales: todayTransactions?.sales || 0,
          total_expenses: todayTransactions?.expenses || 0,
          total_commissions: todayTransactions?.commissions || 0,
          status: 'closed'
        })
        .eq('id', todaySession.id);

      if (error) {
        console.error('Error closing cash register:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-register-today'] });
      toast.success('Caixa fechado com sucesso!');
    },
    onError: (error) => {
      console.error('Error closing cash register:', error);
      toast.error('Erro ao fechar caixa');
    }
  });

  // Auto-abertura do caixa às 09:00
  useEffect(() => {
    const checkAutoOpen = () => {
      const now = new Date();
      const hour = now.getHours();
      const day = now.getDay();
      
      // Segunda a sábado (1-6) e entre 9h e 20h
      if (day >= 1 && day <= 6 && hour >= 9 && hour < 20) {
        if (!todaySession && !isLoading) {
          openCashRegister.mutate();
        }
      }
    };

    checkAutoOpen();
    const interval = setInterval(checkAutoOpen, 60000); // Verifica a cada minuto

    return () => clearInterval(interval);
  }, [todaySession, isLoading]);

  // Auto-fechamento do caixa às 20:00
  useEffect(() => {
    const checkAutoClose = () => {
      const now = new Date();
      const hour = now.getHours();
      const day = now.getDay();
      
      // Fechar automaticamente às 20:00 se estiver aberto
      if (day >= 1 && day <= 6 && hour >= 20) {
        if (todaySession?.status === 'open') {
          closeCashRegister.mutate();
        }
      }
    };

    checkAutoClose();
    const interval = setInterval(checkAutoClose, 60000); // Verifica a cada minuto

    return () => clearInterval(interval);
  }, [todaySession]);

  const currentBalance = (todayTransactions?.sales || 0) - (todayTransactions?.expenses || 0) - (todayTransactions?.commissions || 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-urbana-gold flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Controle de Caixa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Status:</span>
            <Badge variant={todaySession?.status === 'open' ? 'default' : 'secondary'}>
              {todaySession?.status === 'open' ? 'Aberto' : 'Fechado'}
            </Badge>
          </div>
          
          {todaySession?.opened_at && (
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Abertura:</span>
              <span className="text-white">
                {format(new Date(todaySession.opened_at), 'HH:mm', { locale: ptBR })}
              </span>
            </div>
          )}
          
          {todaySession?.closed_at && (
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Fechamento:</span>
              <span className="text-white">
                {format(new Date(todaySession.closed_at), 'HH:mm', { locale: ptBR })}
              </span>
            </div>
          )}
          
          <div className="flex gap-2 mt-4">
            <Button
              onClick={() => openCashRegister.mutate()}
              disabled={todaySession?.status === 'open' || openCashRegister.isPending}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              Abrir Caixa
            </Button>
            <Button
              onClick={() => closeCashRegister.mutate()}
              disabled={todaySession?.status !== 'open' || closeCashRegister.isPending}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              Fechar Caixa
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-urbana-gold flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Resumo do Dia
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-300 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-400" />
              Vendas:
            </span>
            <span className="text-green-400 font-semibold">
              R$ {(todayTransactions?.sales || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-300 flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-400" />
              Despesas:
            </span>
            <span className="text-red-400 font-semibold">
              R$ {(todayTransactions?.expenses || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-300 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-yellow-400" />
              Comissões:
            </span>
            <span className="text-yellow-400 font-semibold">
              R$ {(todayTransactions?.commissions || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          
          <div className="border-t border-gray-700 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-white font-semibold">Saldo Final:</span>
              <span className={`font-bold ${currentBalance >= 0 ? 'text-urbana-gold' : 'text-red-400'}`}>
                R$ {currentBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CashRegister;
