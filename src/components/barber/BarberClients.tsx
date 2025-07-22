
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Users, Search, Phone, Mail, Calendar, UserPlus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Client {
  id: string;
  nome: string;
  email: string | null;
  whatsapp: string;
  data_nascimento: string | null;
  created_at: string;
  total_appointments?: number;
  last_appointment?: string;
}

const BarberClients: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch clients
  useEffect(() => {
    const fetchClients = async () => {
      setLoading(true);
      try {
        // Buscar clientes do painel
        const { data: painelClients, error: painelError } = await supabase
          .from('painel_clientes')
          .select('*')
          .order('nome');

        if (painelError) {
          console.error('Error fetching painel clients:', painelError);
        }

        // Buscar clientes do sistema novo
        const { data: newClients, error: newError } = await supabase
          .from('clients')
          .select('*')
          .order('name');

        if (newError) {
          console.error('Error fetching new clients:', newError);
        }

        // Combinar e transformar dados
        const allClients: Client[] = [];

        // Adicionar clientes do painel
        if (painelClients) {
          painelClients.forEach(client => {
            allClients.push({
              id: `painel-${client.id}`,
              nome: client.nome,
              email: client.email,
              whatsapp: client.whatsapp,
              data_nascimento: client.data_nascimento,
              created_at: client.created_at
            });
          });
        }

        // Adicionar clientes do sistema novo
        if (newClients) {
          newClients.forEach(client => {
            allClients.push({
              id: `new-${client.id}`,
              nome: client.name,
              email: client.email,
              whatsapp: client.phone,
              data_nascimento: client.date_of_birth,
              created_at: client.created_at
            });
          });
        }

        setClients(allClients);
        setFilteredClients(allClients);
      } catch (error) {
        console.error('Error fetching clients:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os clientes.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, [toast]);

  // Filter clients based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredClients(clients);
      return;
    }

    const filtered = clients.filter(client =>
      client.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.whatsapp.includes(searchTerm)
    );
    setFilteredClients(filtered);
  }, [searchTerm, clients]);

  const formatPhoneNumber = (phone: string) => {
    // Remove tudo que não é número
    const numbers = phone.replace(/\D/g, '');
    
    // Formata como (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
    if (numbers.length === 11) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    } else if (numbers.length === 10) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
    }
    return phone;
  };

  if (loading) {
    return (
      <div className="w-full h-full flex justify-center items-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-urbana-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-screen flex flex-col">
      <div className="w-full flex-1 space-y-4 sm:space-y-6 p-2 sm:p-4 lg:p-6">
        {/* Header com Busca - Totalmente Responsivo */}
        <div className="w-full space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-urbana-gold/10 rounded-lg flex-shrink-0">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-urbana-gold" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white truncate">Meus Clientes</h1>
                <p className="text-xs sm:text-sm text-gray-400">
                  {filteredClients.length} cliente{filteredClients.length !== 1 ? 's' : ''} encontrado{filteredClients.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>

          {/* Barra de Busca - Responsiva */}
          <div className="w-full max-w-md">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Buscar cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-800/50 border-gray-700/50 text-white placeholder:text-gray-400"
              />
            </div>
          </div>
        </div>

        {/* Lista de Clientes - Totalmente Responsivo */}
        <Card className="w-full bg-gray-800/50 border-gray-700/50 backdrop-blur-sm transition-none">
          <CardHeader className="p-3 sm:p-4 lg:p-6">
            <CardTitle className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-urbana-gold flex-shrink-0" />
              <span className="truncate">Lista de Clientes</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
            {filteredClients.length === 0 ? (
              <div className="w-full text-center py-8 sm:py-12">
                <Users className="h-12 w-12 sm:h-16 sm:w-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
                  {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
                </h3>
                <p className="text-sm sm:text-base text-gray-400">
                  {searchTerm 
                    ? 'Tente alterar os termos da busca.'
                    : 'Os clientes aparecerão aqui conforme você atender novos clientes.'
                  }
                </p>
              </div>
            ) : (
              <div className="w-full space-y-4">
                {/* Mobile View - Cards Responsivos */}
                <div className="w-full lg:hidden space-y-3 sm:space-y-4">
                  {filteredClients.map((client) => (
                    <Card key={client.id} className="w-full bg-gray-700/50 border-gray-600/50 transition-none">
                      <CardContent className="p-3 sm:p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-white text-sm sm:text-base truncate">
                                {client.nome}
                              </h4>
                              <div className="flex items-center gap-1 mt-1">
                                <Badge variant="outline" className="text-xs border-urbana-gold/30 text-urbana-gold">
                                  {client.id.startsWith('painel-') ? 'Painel' : 'Sistema Novo'}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2 text-xs sm:text-sm">
                            {client.email && (
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                <span className="text-white truncate">{client.email}</span>
                              </div>
                            )}
                            
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                              <span className="text-white">{formatPhoneNumber(client.whatsapp)}</span>
                            </div>

                            {client.data_nascimento && (
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                <span className="text-white">
                                  {format(new Date(client.data_nascimento), 'dd/MM/yyyy', { locale: ptBR })}
                                </span>
                              </div>
                            )}

                            <div className="flex items-center gap-2">
                              <UserPlus className="h-4 w-4 text-gray-400 flex-shrink-0" />
                              <span className="text-gray-400">
                                Cliente desde {format(new Date(client.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Desktop View - Tabela Responsiva */}
                <div className="w-full hidden lg:block">
                  <div className="w-full overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-700/50 transition-none">
                          <TableHead className="text-gray-300 whitespace-nowrap">Nome</TableHead>
                          <TableHead className="text-gray-300 whitespace-nowrap">Email</TableHead>
                          <TableHead className="text-gray-300 whitespace-nowrap">WhatsApp</TableHead>
                          <TableHead className="text-gray-300 whitespace-nowrap">Data Nascimento</TableHead>
                          <TableHead className="text-gray-300 whitespace-nowrap">Cliente desde</TableHead>
                          <TableHead className="text-gray-300 whitespace-nowrap">Origem</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredClients.map((client) => (
                          <TableRow key={client.id} className="border-gray-700/50 transition-none">
                            <TableCell className="text-white font-medium">
                              {client.nome}
                            </TableCell>
                            <TableCell className="text-gray-300">
                              {client.email || '-'}
                            </TableCell>
                            <TableCell className="text-gray-300 whitespace-nowrap">
                              {formatPhoneNumber(client.whatsapp)}
                            </TableCell>
                            <TableCell className="text-gray-300 whitespace-nowrap">
                              {client.data_nascimento
                                ? format(new Date(client.data_nascimento), 'dd/MM/yyyy', { locale: ptBR })
                                : '-'
                              }
                            </TableCell>
                            <TableCell className="text-gray-300 whitespace-nowrap">
                              {format(new Date(client.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="border-urbana-gold/30 text-urbana-gold whitespace-nowrap">
                                {client.id.startsWith('painel-') ? 'Painel' : 'Sistema Novo'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BarberClients;
