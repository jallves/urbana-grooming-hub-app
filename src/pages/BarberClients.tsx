
import React, { useState, useEffect } from 'react';
import BarberLayout from '../components/barber/BarberLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Phone, Mail, Calendar, User, MessageCircle, Eye } from 'lucide-react';
import ModuleAccessGuard from '@/components/auth/ModuleAccessGuard';
import { motion } from 'framer-motion';

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
        
        // Primeiro buscar o ID do barbeiro correspondente ao barbeiro logado da tabela painel_barbeiros
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
        
        console.log('Barber ID found:', barberData.id);
        
        // Busca apenas os clientes que têm agendamentos com este barbeiro na tabela painel_agendamentos
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
          console.log('No appointments found for this barber');
          setLoading(false);
          return;
        }
        
        // Extrair IDs únicos dos clientes
        const uniqueClientIds = [...new Set(appointments.map(item => item.cliente_id))];
        
        console.log('Unique client IDs:', uniqueClientIds);
        
        // Buscar detalhes dos clientes na tabela painel_clientes
        const { data: clientsData, error: clientsError } = await supabase
          .from('painel_clientes')
          .select('*')
          .in('id', uniqueClientIds);
          
        if (clientsError) {
          console.error('Erro ao buscar clientes:', clientsError);
        } else {
          console.log('Clients found:', clientsData?.length || 0);
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
    client.nome?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.whatsapp?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <BarberLayout title="Meus Clientes">
      <ModuleAccessGuard moduleId="clients">
        <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
          {/* Background Elements */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-20 right-10 w-64 h-64 bg-urbana-gold rounded-full blur-3xl"></div>
            <div className="absolute bottom-32 left-10 w-80 h-80 bg-urbana-gold rounded-full blur-3xl"></div>
          </div>

          <div className="relative z-10 p-4 sm:p-6 lg:p-8 space-y-8">
            {/* Header */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-8"
            >
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-playfair font-bold mb-4">
                <span className="bg-gradient-to-r from-white via-urbana-gold to-white bg-clip-text text-transparent">
                  Meus Clientes
                </span>
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Gerencie o relacionamento com seus clientes
              </p>
            </motion.div>

            {/* Search Bar */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="max-w-md mx-auto mb-8"
            >
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-urbana-gold" />
                <Input 
                  placeholder="Buscar clientes..." 
                  className="pl-10 bg-gray-900/50 backdrop-blur-lg border border-gray-700/50 text-white placeholder-gray-400 focus:border-urbana-gold focus:ring-urbana-gold/20"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </motion.div>
            
            {loading ? (
              <div className="flex justify-center py-12">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-8 h-8 border-2 border-urbana-gold border-t-transparent rounded-full"
                />
              </div>
            ) : filteredClients.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredClients.map((client, index) => (
                  <motion.div
                    key={client.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <Card className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-lg border border-gray-700/50 hover:border-urbana-gold/50 transition-all duration-300 overflow-hidden">
                      <CardHeader className="bg-gradient-to-r from-urbana-gold/10 to-yellow-500/10 border-b border-gray-700/50">
                        <CardTitle className="flex items-center gap-3 text-lg text-white">
                          <div className="p-2 bg-urbana-gold/20 rounded-full">
                            <User className="h-5 w-5 text-urbana-gold" />
                          </div>
                          {client.nome}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6 space-y-4">
                        {client.whatsapp && (
                          <div className="flex items-center gap-3 text-sm">
                            <Phone className="h-4 w-4 text-urbana-gold" />
                            <span className="text-gray-300">{client.whatsapp}</span>
                          </div>
                        )}
                        
                        {client.email && (
                          <div className="flex items-center gap-3 text-sm">
                            <Mail className="h-4 w-4 text-urbana-gold" />
                            <span className="text-gray-300 break-all">{client.email}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-3 text-sm">
                          <Calendar className="h-4 w-4 text-urbana-gold" />
                          <span className="text-gray-300">
                            Cliente desde {new Date(client.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-2 pt-4">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1 border-urbana-gold/50 text-urbana-gold hover:bg-urbana-gold/10 hover:border-urbana-gold"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Histórico
                          </Button>
                          
                          {client.whatsapp && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1 border-green-500/50 text-green-400 hover:bg-green-500/10 hover:border-green-400"
                            >
                              <MessageCircle className="h-4 w-4 mr-2" />
                              WhatsApp
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <div className="max-w-md mx-auto">
                  <div className="p-6 bg-gray-900/50 backdrop-blur-lg rounded-2xl border border-gray-700/50">
                    <User className="h-16 w-16 text-gray-600 mx-auto mb-6" />
                    <h3 className="text-xl font-bold text-white mb-2">Nenhum cliente encontrado</h3>
                    <p className="text-gray-400 text-center">
                      Os clientes aparecerão aqui conforme você receber agendamentos do painel do cliente
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </ModuleAccessGuard>
    </BarberLayout>
  );
};

export default BarberClients;
