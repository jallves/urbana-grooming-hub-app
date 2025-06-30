
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Commission {
  id: string;
  amount: number;
  commission_rate: number;
  status: string;
  created_at: string;
  payment_date: string | null;
  appointment: {
    id: string;
    service: {
      name: string;
      price: number;
    };
    client: {
      name: string;
    };
  };
}

const BarberCommissions: React.FC = () => {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPending, setTotalPending] = useState(0);
  const [totalPaid, setTotalPaid] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    fetchCommissions();
  }, []);

  const fetchCommissions = async () => {
    try {
      // Get current user (barber)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get staff record for the current user
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('id')
        .eq('email', user.email)
        .single();

      if (staffError || !staffData) {
        console.error('Error fetching staff data:', staffError);
        return;
      }

      // Fetch commissions for this barber
      const { data, error } = await supabase
        .from('barber_commissions')
        .select(`
          *,
          appointment:appointments (
            id,
            service:services (name, price),
            client:clients (name)
          )
        `)
        .eq('barber_id', staffData.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching commissions:', error);
        toast({
          title: "Erro ao carregar comissões",
          description: "Não foi possível carregar suas comissões.",
          variant: "destructive",
        });
        return;
      }

      setCommissions(data || []);

      // Calculate totals
      const pending = data?.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.amount, 0) || 0;
      const paid = data?.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.amount, 0) || 0;
      
      setTotalPending(pending);
      setTotalPaid(paid);

    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pendente</Badge>;
      case 'paid':
        return <Badge className="bg-green-500">Pago</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Carregando comissões...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Pendente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              R$ {totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Pago</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Commissions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Comissões</CardTitle>
        </CardHeader>
        <CardContent>
          {commissions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhuma comissão encontrada.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Serviço</TableHead>
                  <TableHead>Valor do Serviço</TableHead>
                  <TableHead>Taxa (%)</TableHead>
                  <TableHead>Comissão</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data do Pagamento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissions.map((commission) => (
                  <TableRow key={commission.id}>
                    <TableCell>
                      {format(new Date(commission.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      {commission.appointment?.client?.name || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {commission.appointment?.service?.name || 'N/A'}
                    </TableCell>
                    <TableCell>
                      R$ {(commission.appointment?.service?.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      {commission.commission_rate}%
                    </TableCell>
                    <TableCell className="font-medium">
                      R$ {commission.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(commission.status)}
                    </TableCell>
                    <TableCell>
                      {commission.payment_date 
                        ? format(new Date(commission.payment_date), 'dd/MM/yyyy', { locale: ptBR })
                        : '-'
                      }
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BarberCommissions;
