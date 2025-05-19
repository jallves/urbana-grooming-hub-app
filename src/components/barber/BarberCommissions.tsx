
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const BarberCommissionsComponent: React.FC = () => {
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totals, setTotals] = useState({
    total: 0,
    paid: 0,
    pending: 0
  });
  const { user } = useAuth();

  useEffect(() => {
    const fetchCommissions = async () => {
      if (!user) return;
      
      try {
        console.log('Fetching commissions for user:', user.email);
        
        // Primeiro tenta encontrar o registro de staff correspondente ao email do usuário
        const { data: staffData, error: staffError } = await supabase
          .from('staff')
          .select('id')
          .eq('email', user.email)
          .maybeSingle();
          
        if (staffError) {
          console.error('Erro ao buscar dados do profissional:', staffError);
          setLoading(false);
          return;
        }
        
        if (!staffData) {
          console.log('Nenhum registro de profissional encontrado para este usuário');
          setLoading(false);
          return;
        }
        
        // Buscar as comissões para este barbeiro
        const { data: commissionsData, error: commissionsError } = await supabase
          .from('barber_commissions')
          .select(`
            *,
            appointments:appointment_id (
              *,
              clients:client_id (*),
              services:service_id (*)
            )
          `)
          .eq('barber_id', staffData.id)
          .order('created_at', { ascending: false });
          
        if (commissionsError) {
          console.error('Erro ao buscar comissões:', commissionsError);
        } else {
          console.log('Comissões encontradas:', commissionsData?.length || 0);
          setCommissions(commissionsData || []);
          
          // Calculate totals
          const total = commissionsData?.reduce((sum, commission) => sum + Number(commission.amount), 0) || 0;
          const paid = commissionsData?.reduce((sum, commission) => 
            commission.status === 'paid' ? sum + Number(commission.amount) : sum, 0) || 0;
          
          setTotals({
            total,
            paid,
            pending: total - paid
          });
        }
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCommissions();
  }, [user]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Minhas Comissões</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-gray-400">Total de Comissões</div>
            <div className="text-2xl font-bold text-green-500">{formatCurrency(totals.total)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-gray-400">Comissões Pagas</div>
            <div className="text-2xl font-bold">{formatCurrency(totals.paid)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-gray-400">Comissões Pendentes</div>
            <div className="text-2xl font-bold text-yellow-500">{formatCurrency(totals.pending)}</div>
          </CardContent>
        </Card>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-primary rounded-full"></div>
        </div>
      ) : commissions.length > 0 ? (
        <div className="grid gap-4">
          {commissions.map((commission) => (
            <Card key={commission.id}>
              <CardContent className="p-4">
                <div className="grid gap-2">
                  <div className="flex justify-between">
                    <p className="font-medium">
                      {commission.appointments?.clients?.name || 'Cliente não identificado'}
                    </p>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      commission.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {commission.status === 'paid' ? 'Pago' : 'Pendente'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">
                      {commission.appointments?.services?.name || 'Serviço não especificado'}
                    </span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(Number(commission.amount))}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    {commission.created_at && format(new Date(commission.created_at), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">Você não tem comissões registradas.</p>
        </div>
      )}
    </div>
  );
};

export default BarberCommissionsComponent;
