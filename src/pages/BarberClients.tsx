
import React, { useState, useEffect } from 'react';
import BarberLayout from '../components/barber/BarberLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Phone, Mail, Calendar } from 'lucide-react';
import ModuleAccessGuard from '@/components/auth/ModuleAccessGuard';

const BarberClients: React.FC = () => {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const { user } = useAuth();

  useEffect(() => {
    const fetchClients = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Primeiro buscar o ID do staff correspondente ao barbeiro logado
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
        
        // Busca apenas os clientes que têm agendamentos com este barbeiro
        const { data: appointments, error: appointmentsError } = await supabase
          .from('appointments')
          .select('client_id')
          .eq('staff_id', staffData.id);
          
        if (appointmentsError) {
          console.error('Erro ao buscar agendamentos:', appointmentsError);
          setLoading(false);
          return;
        }
        
        if (!appointments || appointments.length === 0) {
          setLoading(false);
          return;
        }
        
        // Extrair IDs únicos dos clientes
        const uniqueClientIds = [...new Set(appointments.map(item => item.client_id))];
        
        // Buscar detalhes dos clientes
        const { data: clientsData, error: clientsError } = await supabase
          .from('clients')
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

  // Filtrar clientes pela busca
  const filteredClients = clients.filter(client => 
    client.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <BarberLayout title="Meus Clientes">
      <ModuleAccessGuard moduleId="clients">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Lista de Clientes</h2>
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Buscar clientes..." 
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-primary rounded-full"></div>
            </div>
          ) : filteredClients.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredClients.map((client) => (
                <Card key={client.id} className="overflow-hidden">
                  <CardHeader className="bg-zinc-800 p-4">
                    <CardTitle className="text-lg">{client.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    <div className="flex items-center text-sm">
                      <Phone className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{client.phone || 'Sem telefone'}</span>
                    </div>
                    
                    {client.email && (
                      <div className="flex items-center text-sm">
                        <Mail className="h-4 w-4 mr-2 text-gray-400" />
                        <span>{client.email}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      <span>Cliente desde {new Date(client.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                    
                    <Button variant="outline" className="w-full mt-2" size="sm">
                      Ver histórico
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-2">Nenhum cliente encontrado</p>
              <p className="text-sm text-gray-400">
                Os clientes aparecerão aqui conforme você realizar agendamentos
              </p>
            </div>
          )}
        </div>
      </ModuleAccessGuard>
    </BarberLayout>
  );
};

export default BarberClients;
