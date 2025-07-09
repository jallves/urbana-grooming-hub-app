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
          <div className="w-8 h-8 border-2 border-urbana-gold border-t-transparent rounded-full animate-spin" />
        </div>
      </BarberLayout>
    );
  }

  return (
    <BarberLayout title="Meus Clientes">
      <div className="w-full max-w-full space-y-6">
        {/* Header Card - Full Width */}
        <Card className="w-full bg-gradient-to-br from-gray-800/80 to-gray-900/80 border-gray-600/50 backdrop-blur-sm shadow-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-white text-2xl font-bold">
              <div className="p-2 bg-gradient-to-r from-urbana-gold to-yellow-500 rounded-lg">
                <Users className="h-6 w-6 text-black" />
              </div>
              Meus Clientes
            </CardTitle>
            <p className="text-gray-300 text-lg">Gerencie sua base de clientes</p>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 bg-gray-700/50 border-gray-500/50 text-white placeholder-gray-400 focus:border-urbana-gold focus:ring-2 focus:ring-urbana-gold/20 rounded-xl text-lg w-full"
              />
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards - Full Width Grid */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-blue-600/25 to-blue-800/25 border-blue-500/40 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-300 uppercase tracking-wide">Total de Clientes</p>
                  <p className="text-3xl font-bold text-white mt-2">{clients.length}</p>
                  <p className="text-xs text-blue-200 mt-1">Base ativa</p>
                </div>
                <div className="p-3 bg-blue-500/20 rounded-2xl">
                  <Users className="h-8 w-8 text-blue-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-600/25 to-green-800/25 border-green-500/40 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-300 uppercase tracking-wide">Agendamentos Totais</p>
                  <p className="text-3xl font-bold text-white mt-2">
                    {clients.reduce((sum, client) => sum + client.total_appointments, 0)}
                  </p>
                  <p className="text-xs text-green-200 mt-1">Atendimentos realizados</p>
                </div>
                <div className="p-3 bg-green-500/20 rounded-2xl">
                  <Calendar className="h-8 w-8 text-green-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-600/25 to-purple-800/25 border-purple-500/40 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-300 uppercase tracking-wide">Clientes Ativos</p>
                  <p className="text-3xl font-bold text-white mt-2">
                    {clients.filter(client => {
                      if (!client.last_appointment) return false;
                      const lastDate = new Date(client.last_appointment);
                      const thirtyDaysAgo = new Date();
                      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                      return lastDate >= thirtyDaysAgo;
                    }).length}
                  </p>
                  <p className="text-xs text-purple-200 mt-1">Últimos 30 dias</p>
                </div>
                <div className="p-3 bg-purple-500/20 rounded-2xl">
                  <TrendingUp className="h-8 w-8 text-purple-300" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Clients Grid - Full Width */}
        <Card className="w-full bg-gradient-to-br from-gray-800/60 to-gray-900/60 border-gray-600/50 backdrop-blur-sm shadow-2xl">
          <CardContent className="p-6">
            {filteredClients.length === 0 ? (
              <div className="text-center py-16">
                <div className="p-6 bg-gray-700/30 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                  <Users className="h-12 w-12 text-gray-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">
                  {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
                </h3>
                <p className="text-gray-400 text-lg max-w-md mx-auto">
                  {searchTerm 
                    ? 'Tente ajustar o termo de busca para encontrar seus clientes'
                    : 'Os clientes aparecerão aqui conforme fizerem agendamentos'
                  }
                </p>
              </div>
            ) : (
              <div className="w-full grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                {filteredClients.map((client) => {
                  const category = getClientCategory(client.total_appointments);
                  const CategoryIcon = category.icon;
                  
                  return (
                    <Card key={client.id} className="bg-gradient-to-br from-gray-700/60 to-gray-800/60 border-gray-500/30 hover:from-gray-600/60 hover:to-gray-700/60 transition-all duration-300 hover:scale-105 hover:shadow-xl group">
                      <CardContent className="p-5">
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-gradient-to-r from-urbana-gold/20 to-yellow-500/20 rounded-lg">
                                  <User className="h-4 w-4 text-urbana-gold" />
                                </div>
                                <div>
                                  <h4 className="font-bold text-white text-lg group-hover:text-urbana-gold transition-colors">{client.nome}</h4>
                                  <p className="text-sm text-gray-400">{client.email}</p>
                                </div>
                              </div>
                            </div>
                            <Badge className={`bg-gradient-to-r ${category.color} text-white border-0 font-semibold px-3 py-1 shadow-lg`}>
                              <CategoryIcon className="h-3 w-3 mr-1" />
                              {category.label}
                            </Badge>
                          </div>

                          <div className="bg-gray-800/50 rounded-lg p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-400 text-sm">Agendamentos</span>
                              <span className="text-urbana-gold font-bold text-lg">{client.total_appointments}</span>
                            </div>
                            
                            {client.last_appointment && (
                              <div className="flex items-center gap-2 text-xs text-gray-400">
                                <Calendar className="h-3 w-3" />
                                Último: {format(new Date(client.last_appointment), 'dd/MM/yyyy', { locale: ptBR })}
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-blue-500/50 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 hover:border-blue-400 transition-all duration-200 font-medium"
                              onClick={() => window.open(`tel:${client.whatsapp}`, '_self')}
                            >
                              <Phone className="h-4 w-4 mr-2" />
                              Ligar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-green-500/50 text-green-400 bg-green-500/10 hover:bg-green-500/20 hover:border-green-400 transition-all duration-200 font-medium"
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
