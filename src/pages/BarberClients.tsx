
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Search, Phone, MessageCircle, Calendar, User } from 'lucide-react';
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
      // Buscar clientes que já tiveram agendamentos com este barbeiro
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

      // Para cada cliente, buscar informações de agendamentos
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

      // Filtrar apenas clientes que já tiveram agendamentos
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
      <div className="space-y-6">
        {/* Header */}
        <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Users className="h-5 w-5 text-urbana-gold" />
              Meus Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-urbana-gold"
              />
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total de Clientes</p>
                  <p className="text-2xl font-bold text-white">{clients.length}</p>
                </div>
                <Users className="h-8 w-8 text-urbana-gold" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Agendamentos Totais</p>
                  <p className="text-2xl font-bold text-white">
                    {clients.reduce((sum, client) => sum + client.total_appointments, 0)}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-urbana-gold" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Clientes Ativos</p>
                  <p className="text-2xl font-bold text-white">
                    {clients.filter(client => {
                      if (!client.last_appointment) return false;
                      const lastDate = new Date(client.last_appointment);
                      const thirtyDaysAgo = new Date();
                      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                      return lastDate >= thirtyDaysAgo;
                    }).length}
                  </p>
                </div>
                <User className="h-8 w-8 text-urbana-gold" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Clients List */}
        <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
          <CardContent className="p-6">
            {filteredClients.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">
                  {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
                </h3>
                <p className="text-gray-400">
                  {searchTerm 
                    ? 'Tente ajustar o termo de busca'
                    : 'Os clientes aparecerão aqui conforme fizerem agendamentos'
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredClients.map((client) => (
                  <Card key={client.id} className="bg-gray-700/50 border-gray-600/50">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-white truncate">{client.nome}</h4>
                            <p className="text-sm text-gray-400 truncate">{client.email}</p>
                          </div>
                          <Badge className="ml-2 bg-urbana-gold/10 text-urbana-gold border-urbana-gold/50">
                            {client.total_appointments} agendamento{client.total_appointments !== 1 ? 's' : ''}
                          </Badge>
                        </div>

                        {client.last_appointment && (
                          <div className="text-xs text-gray-400">
                            Último agendamento: {format(new Date(client.last_appointment), 'dd/MM/yyyy', { locale: ptBR })}
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 border-blue-600 text-blue-400 bg-gray-800 hover:bg-blue-600/10"
                            onClick={() => window.open(`tel:${client.whatsapp}`, '_self')}
                          >
                            <Phone className="h-3 w-3 mr-1" />
                            Ligar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 border-green-600 text-green-400 bg-gray-800 hover:bg-green-600/10"
                            onClick={() => window.open(`https://wa.me/${client.whatsapp.replace(/\D/g, '')}`, '_blank')}
                          >
                            <MessageCircle className="h-3 w-3 mr-1" />
                            WhatsApp
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </BarberLayout>
  );
};

export default BarberClients;
