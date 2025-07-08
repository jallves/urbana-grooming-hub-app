
import React, { useState, useEffect } from 'react';
import BarberLayout from '../components/barber/BarberLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Phone, Mail, Calendar, User, MessageCircle, Eye } from 'lucide-react';
import ModuleAccessGuard from '@/components/auth/ModuleAccessGuard';

interface ClientData {
  id: string;
  nome: string;
  email: string;
  whatsapp: string;
  created_at: string;
}

const BarberClients: React.FC = () => {
  const [clients, setClients] = useState<ClientData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const { user } = useAuth();

  useEffect(() => {
    const fetchClients = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        const { data: barberData, error: barberError } = await supabase
          .from('painel_barbeiros')
          .select('id')
          .eq('email', user.email)
          .maybeSingle();
          
        if (barberError || !barberData) {
          console.error('Erro ao buscar dados do barbeiro ou registro não encontrado');
          setLoading(false);
          return;
        }
        
        const { data: appointments, error: appointmentsError } = await supabase
          .from('painel_agendamentos')
          .select('cliente_id')
          .eq('barbeiro_id', barberData.id);
          
        if (appointmentsError) {
          console.error('Erro ao buscar agendamentos:', appointmentsError);
          setLoading(false);
          return;
        }
        
        if (!appointments || appointments.length === 0) {
          setLoading(false);
          return;
        }
        
        const uniqueClientIds = [...new Set(appointments.map(item => item.cliente_id))];
        
        const { data: clientsData, error: clientsError } = await supabase
          .from('painel_clientes')
          .select('*')
          .in('id', uniqueClientIds);
          
        if (clientsError) {
          console.error('Erro ao buscar clientes:', clientsError);
        } else {
          setClients(clientsData || []);
        }
      } catch (error) {
        console.error('Erro ao buscar dados de clientes:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchClients();
  }, [user]);

  const filteredClients = clients.filter(client => 
    client.nome?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.whatsapp?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <BarberLayout title="Meus Clientes">
      <ModuleAccessGuard moduleId="clients">
        <div className="space-y-6">
          {/* Search Bar */}
          <div className="max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Buscar clientes..." 
                className="pl-10 bg-gray-800/50 border-gray-700/50 text-white placeholder-gray-400 focus:border-urbana-gold backdrop-blur-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-urbana-gold border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredClients.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredClients.map((client) => (
                <Card key={client.id} className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
                  <CardHeader className="bg-gray-700/50 border-b border-gray-600/50">
                    <CardTitle className="flex items-center gap-3 text-lg text-white">
                      <div className="p-2 bg-urbana-gold/20 rounded-full">
                        <User className="h-4 w-4 text-urbana-gold" />
                      </div>
                      {client.nome}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    {client.whatsapp && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-urbana-gold" />
                        <span className="text-gray-300">{client.whatsapp}</span>
                      </div>
                    )}
                    
                    {client.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-urbana-gold" />
                        <span className="text-gray-300 break-all">{client.email}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-urbana-gold" />
                      <span className="text-gray-300">
                        Cliente desde {new Date(client.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 border-urbana-gold/50 text-urbana-gold hover:bg-urbana-gold/20"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Histórico
                      </Button>
                      
                      {client.whatsapp && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 border-green-500/50 text-green-400 hover:bg-green-500/20"
                        >
                          <MessageCircle className="h-4 w-4 mr-1" />
                          WhatsApp
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <User className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Nenhum cliente encontrado</h3>
                    <p className="text-gray-400 text-center">
                      Os clientes aparecerão aqui conforme você receber agendamentos
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </ModuleAccessGuard>
    </BarberLayout>
  );
};

export default BarberClients;
