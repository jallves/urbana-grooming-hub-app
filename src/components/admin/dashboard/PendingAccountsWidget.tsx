import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUpCircle, ArrowDownCircle, AlertCircle, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PendingAccount {
  id: string;
  description: string;
  net_amount: number;
  due_date: string | null;
  transaction_type: string;
  category: string;
  status: string;
}

const PendingAccountsWidget: React.FC = () => {
  const navigate = useNavigate();

  const { data: accounts, isLoading } = useQuery({
    queryKey: ['pending-accounts-dashboard'],
    queryFn: async () => {
      const { data } = await supabase
        .from('financial_records')
        .select('id, description, net_amount, due_date, transaction_type, category, status')
        .eq('status', 'pending')
        .order('due_date', { ascending: true, nullsFirst: false })
        .limit(10);

      return data as PendingAccount[];
    },
    refetchInterval: 60000,
  });

  const today = new Date();
  const receivables = accounts?.filter(a => a.transaction_type === 'revenue') || [];
  const payables = accounts?.filter(a => a.transaction_type === 'expense' || a.transaction_type === 'commission') || [];

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

  const renderAccountList = (items: PendingAccount[], type: 'receivable' | 'payable') => {
    if (items.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">Nenhuma pendência</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {items.slice(0, 5).map((item) => {
          const isOverdue = item.due_date && new Date(item.due_date) < today;
          const dueDate = item.due_date ? new Date(item.due_date) : null;

          return (
            <div 
              key={item.id} 
              className={`p-3 rounded-lg border ${isOverdue ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'} hover:shadow-md transition-shadow`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.description}
                    </p>
                    {isOverdue && (
                      <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {item.category}
                  </p>
                  {dueDate && (
                    <p className={`text-xs mt-1 ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                      Vencimento: {format(dueDate, "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  )}
                </div>
                <div className="text-right ml-4">
                  <p className={`text-sm font-bold ${type === 'receivable' ? 'text-green-600' : 'text-red-600'}`}>
                    R$ {Math.abs(item.net_amount).toFixed(2)}
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
              {receivables.length}
            </Badge>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Total: R$ {receivables.reduce((sum, r) => sum + r.net_amount, 0).toFixed(2)}
          </p>
        </CardHeader>
        <CardContent>
          {renderAccountList(receivables, 'receivable')}
          {receivables.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-4"
              onClick={() => navigate('/admin/erp-financeiro')}
            >
              <Eye className="h-4 w-4 mr-2" />
              Ver Todas
            </Button>
          )}
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
              {payables.length}
            </Badge>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Total: R$ {payables.reduce((sum, p) => sum + Math.abs(p.net_amount), 0).toFixed(2)}
          </p>
        </CardHeader>
        <CardContent>
          {renderAccountList(payables, 'payable')}
          {payables.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-4"
              onClick={() => navigate('/admin/erp-financeiro')}
            >
              <Eye className="h-4 w-4 mr-2" />
              Ver Todas
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PendingAccountsWidget;
