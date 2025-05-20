
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Check, Clock, DollarSign, Calendar } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const BarberCommissionsComponent: React.FC = () => {
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totals, setTotals] = useState({
    total: 0,
    paid: 0,
    pending: 0,
    totalAppointments: 0,
    completedAppointments: 0,
  });
  const [activeTab, setActiveTab] = useState<string>("comissoes");
  const { user } = useAuth();

  useEffect(() => {
    const fetchCommissions = async () => {
      if (!user) return;
      
      try {
        console.log('Fetching commissions for user:', user.email);
        
        // Primeiro tenta encontrar o registro de staff correspondente ao email do usuário
        const { data: staffData, error: staffError } = await supabase
          .from('staff')
          .select('id, commission_rate')
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
        
        // Fetch appointments to calculate statistics
        const { data: appointmentsData, error: appointmentsError } = await supabase
          .from('appointments')
          .select('id, status')
          .eq('staff_id', staffData.id);
          
        if (appointmentsError) {
          console.error('Erro ao buscar estatísticas de agendamentos:', appointmentsError);
        } else {
          const completedCount = appointmentsData?.filter(app => app.status === 'completed').length || 0;
          const totalCount = appointmentsData?.length || 0;
          
          // Update appointments statistics
          setTotals(prev => ({
            ...prev,
            totalAppointments: totalCount,
            completedAppointments: completedCount
          }));
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
          
          setTotals(prev => ({
            ...prev,
            total,
            paid,
            pending: total - paid
          }));
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

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      return format(parseISO(dateString), "d 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Minhas Comissões</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-6 flex items-center">
            <div className="rounded-full bg-green-100 p-3 mr-4">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500">Total Ganhos</div>
              <div className="text-xl font-bold text-green-600">{formatCurrency(totals.total)}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center">
            <div className="rounded-full bg-blue-100 p-3 mr-4">
              <Check className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500">Comissões Pagas</div>
              <div className="text-xl font-bold">{formatCurrency(totals.paid)}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center">
            <div className="rounded-full bg-yellow-100 p-3 mr-4">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500">Comissões Pendentes</div>
              <div className="text-xl font-bold text-yellow-600">{formatCurrency(totals.pending)}</div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardContent className="p-4">
          <Tabs defaultValue="comissoes" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="comissoes">Histórico de Comissões</TabsTrigger>
              <TabsTrigger value="estatisticas">Estatísticas</TabsTrigger>
            </TabsList>
            
            <TabsContent value="comissoes">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-primary rounded-full"></div>
                </div>
              ) : commissions.length > 0 ? (
                <div className="grid gap-4">
                  {commissions.map((commission) => (
                    <div key={commission.id} className="border rounded-md p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">
                            {commission.appointments?.clients?.name || 'Cliente não identificado'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {commission.appointments?.services?.name || 'Serviço não especificado'}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          commission.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {commission.status === 'paid' ? 'Pago' : 'Pendente'}
                        </span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span>{formatDate(commission.created_at)}</span>
                        <div className="flex items-center">
                          <span className="text-gray-500 mr-2">Taxa de comissão: {commission.commission_rate}%</span>
                          <span className="font-medium text-green-600">
                            {formatCurrency(Number(commission.amount))}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Você ainda não tem comissões registradas.</p>
                  <p className="text-sm text-gray-400 mt-2">
                    As comissões são geradas automaticamente quando você concluir agendamentos.
                  </p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="estatisticas">
              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded-md p-4">
                  <div className="flex items-center mb-2">
                    <Calendar className="h-5 w-5 text-gray-500 mr-2" />
                    <span className="font-medium">Total de Agendamentos</span>
                  </div>
                  <p className="text-2xl font-bold">{totals.totalAppointments}</p>
                </div>
                
                <div className="border rounded-md p-4">
                  <div className="flex items-center mb-2">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span className="font-medium">Agendamentos Concluídos</span>
                  </div>
                  <p className="text-2xl font-bold">{totals.completedAppointments}</p>
                </div>
              </div>
              
              <div className="mt-4 border rounded-md p-4">
                <h3 className="font-medium mb-2">Informações sobre Comissões</h3>
                <p className="text-sm text-gray-500 mb-2">
                  Suas comissões são calculadas automaticamente quando um agendamento é marcado como concluído.
                  A porcentagem da sua comissão é aplicada sobre o valor do serviço.
                </p>
                <p className="text-sm text-gray-500">
                  Para mais detalhes sobre suas comissões ou para solicitar um pagamento,
                  entre em contato com o administrador da barbearia.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default BarberCommissionsComponent;
