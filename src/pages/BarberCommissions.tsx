
import React, { useState, useEffect } from 'react';
import BarberLayout from '../components/barber/BarberLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Calendar, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import ModuleAccessGuard from '@/components/auth/ModuleAccessGuard';

const BarberCommissions: React.FC = () => {
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState({
    totalCommission: 0,
    pendingCommission: 0,
    paidCommission: 0,
    totalAppointments: 0
  });
  const { user } = useAuth();

  useEffect(() => {
    const fetchCommissions = async () => {
      if (!user) return;
      
      try {
        // Busca o registro de staff correspondente ao email do usuário
        const { data: staffData, error: staffError } = await supabase
          .from('staff')
          .select('id')
          .eq('email', user.email)
          .maybeSingle();
          
        if (staffError || !staffData) {
          console.error('Erro ao buscar dados do profissional ou registro não encontrado');
          setLoading(false);
          return;
        }
        
        // Busca as comissões para este barbeiro
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
          setCommissions(commissionsData || []);
          
          // Calcula estatísticas
          const total = commissionsData?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;
          const pending = commissionsData?.filter(c => c.status === 'pending')
            .reduce((sum, item) => sum + Number(item.amount), 0) || 0;
          const paid = commissionsData?.filter(c => c.status === 'paid')
            .reduce((sum, item) => sum + Number(item.amount), 0) || 0;
          
          setStats({
            totalCommission: total,
            pendingCommission: pending,
            paidCommission: paid,
            totalAppointments: commissionsData?.length || 0
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
    <ModuleAccessGuard moduleId="reports">
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Minhas Comissões</h2>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-primary rounded-full"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total em Comissões</p>
                    <p className="text-2xl font-bold">{formatCurrency(stats.totalCommission)}</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Pendente</p>
                    <p className="text-2xl font-bold">{formatCurrency(stats.pendingCommission)}</p>
                  </div>
                  <div className="bg-yellow-100 p-3 rounded-full">
                    <ArrowUpCircle className="h-5 w-5 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Pago</p>
                    <p className="text-2xl font-bold">{formatCurrency(stats.paidCommission)}</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full">
                    <ArrowDownCircle className="h-5 w-5 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Atendimentos</p>
                    <p className="text-2xl font-bold">{stats.totalAppointments}</p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-full">
                    <Calendar className="h-5 w-5 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Comissões</CardTitle>
              </CardHeader>
              <CardContent>
                {commissions.length > 0 ? (
                  <div className="grid gap-4">
                    {commissions.map((commission) => (
                      <div key={commission.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">
                              {commission.appointments?.services?.name || 'Serviço não especificado'}
                            </p>
                            <p className="text-sm text-gray-500">
                              Cliente: {commission.appointments?.clients?.name || 'Cliente não identificado'}
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(commission.created_at).toLocaleDateString('pt-BR')} • 
                              Taxa: {commission.commission_rate}%
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600">{formatCurrency(commission.amount)}</p>
                            <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                              commission.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {commission.status === 'paid' ? 'Pago' : 'Pendente'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Nenhuma comissão encontrada.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </ModuleAccessGuard>
  );
};

export default BarberCommissions;
