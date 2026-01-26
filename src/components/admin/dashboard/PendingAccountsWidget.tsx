import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUpCircle, ArrowDownCircle, AlertCircle, Eye, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { format, isAfter, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ContaReceber {
  id: string;
  descricao: string;
  valor: number;
  data_vencimento: string;
  status: string;
  categoria: string | null;
}

interface ContaPagar {
  id: string;
  descricao: string;
  valor: number;
  data_vencimento: string;
  status: string;
  categoria: string | null;
  fornecedor: string | null;
}

const PendingAccountsWidget: React.FC = () => {
  const navigate = useNavigate();
  const today = startOfDay(new Date());

  // Fetch from contas_receber (ERP table)
  const { data: contasReceber, isLoading: isLoadingReceber } = useQuery({
    queryKey: ['pending-contas-receber-dashboard'],
    queryFn: async () => {
      const { data } = await supabase
        .from('contas_receber')
        .select('id, descricao, valor, data_vencimento, status, categoria')
        .eq('status', 'pendente')
        .order('data_vencimento', { ascending: true, nullsFirst: false })
        .limit(5);

      return (data || []) as ContaReceber[];
    },
    refetchInterval: 60000,
  });

  // Fetch from contas_pagar (ERP table)
  const { data: contasPagar, isLoading: isLoadingPagar } = useQuery({
    queryKey: ['pending-contas-pagar-dashboard'],
    queryFn: async () => {
      const { data } = await supabase
        .from('contas_pagar')
        .select('id, descricao, valor, data_vencimento, status, categoria, fornecedor')
        .eq('status', 'pendente')
        .order('data_vencimento', { ascending: true, nullsFirst: false })
        .limit(5);

      return (data || []) as ContaPagar[];
    },
    refetchInterval: 60000,
  });

  // Also get totals for summary
  const { data: totais } = useQuery({
    queryKey: ['totais-contas-dashboard'],
    queryFn: async () => {
      const [receberResult, pagarResult] = await Promise.all([
        supabase
          .from('contas_receber')
          .select('valor, status, data_vencimento')
          .eq('status', 'pendente'),
        supabase
          .from('contas_pagar')
          .select('valor, status, data_vencimento')
          .eq('status', 'pendente')
      ]);

      const todayStr = new Date().toISOString().split('T')[0];
      
      const totalReceber = receberResult.data?.reduce((sum, r) => sum + (r.valor || 0), 0) || 0;
      const vencidasReceber = receberResult.data?.filter(r => r.data_vencimento && r.data_vencimento < todayStr).length || 0;
      
      const totalPagar = pagarResult.data?.reduce((sum, r) => sum + (r.valor || 0), 0) || 0;
      const vencidasPagar = pagarResult.data?.filter(r => r.data_vencimento && r.data_vencimento < todayStr).length || 0;

      return {
        totalReceber,
        countReceber: receberResult.data?.length || 0,
        vencidasReceber,
        totalPagar,
        countPagar: pagarResult.data?.length || 0,
        vencidasPagar,
      };
    },
    refetchInterval: 60000,
  });

  const isLoading = isLoadingReceber || isLoadingPagar;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {[1, 2].map(i => (
          <Card key={i} className="bg-white border-gray-200">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-40 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value);
  };

  const getCategoryLabel = (categoria: string | null) => {
    const labels: Record<string, string> = {
      'servico': 'Serviço',
      'produto': 'Produto',
      'gorjeta': 'Gorjeta',
      'comissao': 'Comissão',
    };
    return labels[categoria || ''] || categoria || 'Outros';
  };

  const renderReceberList = () => {
    if (!contasReceber || contasReceber.length === 0) {
      return (
        <div className="text-center py-8">
          <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-green-500" />
          <p className="text-sm text-green-600 font-medium">Nenhuma pendência!</p>
          <p className="text-xs text-gray-500 mt-1">Todas as contas foram recebidas</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {contasReceber.map((item) => {
          const dueDate = item.data_vencimento ? new Date(item.data_vencimento + 'T00:00:00') : null;
          const isOverdue = dueDate && isAfter(today, dueDate);

          return (
            <div 
              key={item.id} 
              className={`p-3 rounded-lg border ${isOverdue ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'} hover:shadow-md transition-shadow`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.descricao}
                    </p>
                    {isOverdue && (
                      <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {getCategoryLabel(item.categoria)}
                  </p>
                  {dueDate && (
                    <p className={`text-xs mt-1 ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                      Vencimento: {format(dueDate, "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  )}
                </div>
                <div className="text-right ml-4">
                  <p className="text-sm font-bold text-green-600">
                    {formatCurrency(item.valor)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderPagarList = () => {
    if (!contasPagar || contasPagar.length === 0) {
      return (
        <div className="text-center py-8">
          <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-green-500" />
          <p className="text-sm text-green-600 font-medium">Nenhuma pendência!</p>
          <p className="text-xs text-gray-500 mt-1">Todas as contas foram pagas</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {contasPagar.map((item) => {
          const dueDate = item.data_vencimento ? new Date(item.data_vencimento + 'T00:00:00') : null;
          const isOverdue = dueDate && isAfter(today, dueDate);

          return (
            <div 
              key={item.id} 
              className={`p-3 rounded-lg border ${isOverdue ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'} hover:shadow-md transition-shadow`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.descricao}
                    </p>
                    {isOverdue && (
                      <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                    )}
                  </div>
                  {item.fornecedor && (
                    <p className="text-xs text-gray-600 mt-0.5 truncate">
                      {item.fornecedor}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {getCategoryLabel(item.categoria)}
                  </p>
                  {dueDate && (
                    <p className={`text-xs mt-1 ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                      Vencimento: {format(dueDate, "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  )}
                </div>
                <div className="text-right ml-4">
                  <p className="text-sm font-bold text-red-600">
                    {formatCurrency(item.valor)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      {/* Contas a Receber */}
      <Card className="bg-white border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowUpCircle className="h-5 w-5 text-green-600" />
              <CardTitle className="text-lg font-semibold text-gray-900">
                Contas a Receber
              </CardTitle>
            </div>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              {totais?.countReceber || 0}
            </Badge>
          </div>
          <div className="flex items-center justify-between mt-1">
            <p className="text-sm text-gray-500">
              Total: {formatCurrency(totais?.totalReceber || 0)}
            </p>
            {(totais?.vencidasReceber || 0) > 0 && (
              <Badge variant="destructive" className="text-xs">
                {totais?.vencidasReceber} vencida(s)
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {renderReceberList()}
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-4"
            onClick={() => navigate('/admin/erp-financeiro')}
          >
            <Eye className="h-4 w-4 mr-2" />
            Ver Todas no ERP
          </Button>
        </CardContent>
      </Card>

      {/* Contas a Pagar */}
      <Card className="bg-white border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowDownCircle className="h-5 w-5 text-red-600" />
              <CardTitle className="text-lg font-semibold text-gray-900">
                Contas a Pagar
              </CardTitle>
            </div>
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
              {totais?.countPagar || 0}
            </Badge>
          </div>
          <div className="flex items-center justify-between mt-1">
            <p className="text-sm text-gray-500">
              Total: {formatCurrency(totais?.totalPagar || 0)}
            </p>
            {(totais?.vencidasPagar || 0) > 0 && (
              <Badge variant="destructive" className="text-xs">
                {totais?.vencidasPagar} vencida(s)
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {renderPagarList()}
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-4"
            onClick={() => navigate('/admin/erp-financeiro')}
          >
            <Eye className="h-4 w-4 mr-2" />
            Ver Todas no ERP
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PendingAccountsWidget;
