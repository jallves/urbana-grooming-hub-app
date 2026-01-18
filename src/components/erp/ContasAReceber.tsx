import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowUpCircle, Loader2, DollarSign, Plus, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import RevenueRecordForm from './RevenueRecordForm';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Interface para contas_receber (tabela ERP real)
interface ContaReceber {
  id: string;
  descricao: string;
  valor: number;
  data_vencimento: string;
  data_recebimento: string | null;
  categoria: string | null;
  cliente_id: string | null;
  status: string | null;
  observacoes: string | null;
  transaction_id: string | null; // ID da transação eletrônica (NSU, PIX, etc.)
  created_at: string | null;
  updated_at: string | null;
}

// Mapeamento de categorias para português
const getCategoryLabel = (category: string | null): string => {
  if (!category) return '-';
  const map: Record<string, string> = {
    'services': 'Serviço',
    'servico': 'Serviço',
    'products': 'Produto',
    'produto': 'Produto',
    'tips': 'Gorjeta',
    'gorjeta': 'Gorjeta',
    'staff_payments': 'Comissão',
    'comissao': 'Comissão',
  };
  return map[category.toLowerCase()] || category;
};

export const ContasAReceber: React.FC = () => {
  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const queryClient = useQueryClient();

  // Query para contas_receber (tabela ERP real com transaction_id)
  const { data: contasReceber, isLoading } = useQuery({
    queryKey: ['contas-receber-erp'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contas_receber')
        .select('*')
        .order('data_vencimento', { ascending: false })
        .limit(100);

      if (error) throw error;
      return (data || []) as ContaReceber[];
    },
    refetchInterval: 10000
  });

  const createMutation = useMutation({
    mutationFn: async (values: any) => {
      const { error } = await supabase.from('contas_receber').insert({
        descricao: values.description,
        valor: values.amount,
        data_vencimento: format(values.transaction_date, 'yyyy-MM-dd'),
        data_recebimento: values.status === 'recebido' ? format(new Date(), 'yyyy-MM-dd') : null,
        categoria: values.category,
        status: values.status === 'completed' ? 'recebido' : 'pendente',
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas-receber-erp'] });
      toast.success('Receita criada com sucesso!');
      setFormOpen(false);
    },
    onError: (error: any) => {
      toast.error('Erro ao criar receita', { description: error.message });
    },
  });

  const handleFormSubmit = async (values: any) => {
    await createMutation.mutateAsync(values);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingRecord(null);
  };

  // Calcular totais
  const totals = useMemo(() => {
    if (!contasReceber) return { total: 0, pending: 0, completed: 0 };
    
    return {
      total: contasReceber.reduce((sum, r) => sum + Number(r.valor), 0),
      pending: contasReceber
        .filter(r => r.status === 'pendente')
        .reduce((sum, r) => sum + Number(r.valor), 0),
      completed: contasReceber
        .filter(r => r.status === 'recebido')
        .reduce((sum, r) => sum + Number(r.valor), 0)
    };
  }, [contasReceber]);

  const getStatusBadge = (status: string | null) => {
    const variants: Record<string, { label: string; className: string }> = {
      recebido: { label: 'Recebido', className: 'bg-green-100 text-green-700 border-green-300' },
      pendente: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
      cancelado: { label: 'Cancelado', className: 'bg-red-100 text-red-700 border-red-300' }
    };

    const config = variants[status || 'pendente'] || { label: status || 'Pendente', className: 'bg-gray-100 text-gray-700' };

    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h2 className="text-xl sm:text-2xl font-bold">Contas a Receber</h2>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Nova Receita</span>
            <span className="sm:hidden">Novo</span>
          </Button>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Total a Receber
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">
                R$ {totals.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-yellow-700 flex items-center gap-2">
                <ArrowUpCircle className="h-4 w-4" />
                Pendente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-700">
                R$ {totals.pending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-emerald-700 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Recebido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-700">
                R$ {totals.completed.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de Contas a Receber (ERP real com transaction_id) */}
        <Card className="bg-white border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-gray-900">
              Receitas Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {contasReceber && contasReceber.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead className="whitespace-nowrap">ID Transação</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contasReceber.map((conta) => (
                      <TableRow key={conta.id}>
                        <TableCell>
                          {format(parseISO(conta.data_vencimento), 'dd/MM/yyyy', { locale: ptBR })}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-gray-600 whitespace-nowrap">
                          {conta.transaction_id || '-'}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {conta.descricao || '-'}
                        </TableCell>
                        <TableCell>
                          {getCategoryLabel(conta.categoria)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          R$ {Number(conta.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>{getStatusBadge(conta.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Nenhuma conta a receber encontrada
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Form para nova receita */}
      <RevenueRecordForm
        open={formOpen}
        onClose={handleCloseForm}
        onSubmit={handleFormSubmit}
        initialData={editingRecord}
        isLoading={createMutation.isPending}
      />
    </>
  );
};
