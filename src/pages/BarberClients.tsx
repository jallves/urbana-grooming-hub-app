
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Search, Phone, MessageCircle, Calendar, User, Star, TrendingUp, Crown, Heart } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import BarberLayout from '@/components/barber/BarberLayout';
import { useAuth } from '@/contexts/AuthContext';

interface Client {
  id: string;
  nome: string;
  email: string;
  whatsapp: string;
  created_at: string;
  total_appointments: number;
  last_appointment: string | null;
}

const BarberClients: React.FC = () => {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [barberId, setBarberId] = useState<string | null>(null);

  useEffect(() => {
    const fetchBarberId = async () => {
      if (!user?.email) return;

      try {
        const { data } = await supabase
          .from('painel_barbeiros')
          .select('id')
          .eq('email', user.email)
          .maybeSingle();

        if (data?.id) {
          setBarberId(data.id);
        }
      } catch (error) {
        console.error('Error fetching barber ID:', error);
      }
    };

    fetchBarberId();
  }, [user?.email]);

  useEffect(() => {
    if (barberId) {
      fetchClients();
    }
  }, [barberId]);

  const fetchClients = async () => {
    if (!barberId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('painel_clientes')
        .select(`
          id,
          nome,
          email,
          whatsapp,
          created_at
        `)
        .order('nome');

      if (error) {
        console.error('Error fetching clients:', error);
        return;
      }

      const clientsWithStats = await Promise.all(
        (data || []).map(async (client) => {
          const { data: appointments, error: appointmentsError } = await supabase
            .from('painel_agendamentos')
            .select('data, status')
            .eq('cliente_id', client.id)
            .eq('barbeiro_id', barberId)
            .order('data', { ascending: false });

          if (appointmentsError) {
            console.error('Error fetching appointments for client:', client.id, appointmentsError);
          }

          const totalAppointments = appointments?.length || 0;
          const lastAppointment = appointments && appointments.length > 0 ? appointments[0].data : null;

          return {
            ...client,
            total_appointments: totalAppointments,
            last_appointment: lastAppointment
          };
        })
      );

      const clientsWithAppointments = clientsWithStats.filter(client => client.total_appointments > 0);
      
      setClients(clientsWithAppointments);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(client =>
    client.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getClientCategory = (totalAppointments: number) => {
    if (totalAppointments >= 20) return { label: 'VIP', color: 'from-yellow-400 to-yellow-600', icon: Crown };
    if (totalAppointments >= 10) return { label: 'Fiel', color: 'from-purple-400 to-purple-600', icon: Heart };
    if (totalAppointments >= 5) return { label: 'Regular', color: 'from-blue-400 to-blue-600', icon: Star };
    return { label: 'Novo', color: 'from-green-400 to-green-600', icon: User };
  };

  if (loading) {
    return (
      <BarberLayout title="Meus Clientes">
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </BarberLayout>
    );
  }

  return (
    <BarberLayout title="Meus Clientes">
      <div className="space-y-6">
        {/* Header Card */}
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-gray-900 text-xl font-bold">
              <div className="p-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg">
                <Users className="h-5 w-5 text-white" />
              </div>
              Meus Clientes
            </CardTitle>
            <p className="text-gray-600">Gerencie sua base de clientes</p>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11 bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-lg"
              />
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700 uppercase tracking-wide">Total de Clientes</p>
                  <p className="text-2xl font-bold text-blue-900 mt-1">{clients.length}</p>
                  <p className="text-xs text-blue-600 mt-1">Base ativa</p>
                </div>
                <div className="p-3 bg-blue-500/20 rounded-xl">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700 uppercase tracking-wide">Agendamentos Totais</p>
                  <p className="text-2xl font-bold text-green-900 mt-1">
                    {clients.reduce((sum, client) => sum + client.total_appointments, 0)}
                  </p>
                  <p className="text-xs text-green-600 mt-1">Atendimentos realizados</p>
                </div>
                <div className="p-3 bg-green-500/20 rounded-xl">
                  <Calendar className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700 uppercase tracking-wide">Clientes Ativos</p>
                  <p className="text-2xl font-bold text-purple-900 mt-1">
                    {clients.filter(client => {
                      if (!client.last_appointment) return false;
                      const lastDate = new Date(client.last_appointment);
                      const thirtyDaysAgo = new Date();
                      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                      return lastDate >= thirtyDaysAgo;
                    }).length}
                  </p>
                  <p className="text-xs text-purple-600 mt-1">Últimos 30 dias</p>
                </div>
                <div className="p-3 bg-purple-500/20 rounded-xl">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Clients Grid */}
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardContent className="p-6">
            {filteredClients.length === 0 ? (
              <div className="text-center py-12">
                <div className="p-6 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <Users className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
                </h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  {searchTerm 
                    ? 'Tente ajustar o termo de busca para encontrar seus clientes'
                    : 'Os clientes aparecerão aqui conforme fizerem agendamentos'
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredClients.map((client) => {
                  const category = getClientCategory(client.total_appointments);
                  const CategoryIcon = category.icon;
                  
                  return (
                    <Card key={client.id} className="bg-gray-50 border-gray-200 hover:bg-gray-100 transition-all duration-300 hover:shadow-md group">
                      <CardContent className="p-5">
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-lg">
                                  <User className="h-4 w-4 text-amber-600" />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900 group-hover:text-amber-600 transition-colors">{client.nome}</h4>
                                  <p className="text-sm text-gray-500">{client.email}</p>
                                </div>
                              </div>
                            </div>
                            <Badge className={`bg-gradient-to-r ${category.color} text-white border-0 font-medium px-2 py-1 shadow-sm`}>
                              <CategoryIcon className="h-3 w-3 mr-1" />
                              {category.label}
                            </Badge>
                          </div>

                          <div className="bg-white rounded-lg p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600 text-sm">Agendamentos</span>
                              <span className="text-amber-600 font-semibold">{client.total_appointments}</span>
                            </div>
                            
                            {client.last_appointment && (
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Calendar className="h-3 w-3" />
                                Último: {format(new Date(client.last_appointment), 'dd/MM/yyyy', { locale: ptBR })}
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100 hover:border-blue-300 transition-all duration-200"
                              onClick={() => window.open(`tel:${client.whatsapp}`, '_self')}
                            >
                              <Phone className="h-4 w-4 mr-2" />
                              Ligar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-green-200 text-green-600 bg-green-50 hover:bg-green-100 hover:border-green-300 transition-all duration-200"
                              onClick={() => window.open(`https://wa.me/${client.whatsapp.replace(/\D/g, '')}`, '_blank')}
                            >
                              <MessageCircle className="h-4 w-4 mr-2" />
                              WhatsApp
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </BarberLayout>
  );
};

export default BarberClients;
