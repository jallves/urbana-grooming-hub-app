
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Users, Search, Phone, Mail, Calendar, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import StandardCard from './layouts/StandardCard';

interface Client {
  id: string;
  nome: string;
  email: string;
  whatsapp: string;
  data_nascimento?: string;
  created_at: string;
}

interface AppointmentHistory {
  id: string;
  data: string;
  hora: string;
  status: string;
  servico_nome: string;
  servico_preco: number;
}

const BarberClients: React.FC = () => {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [appointmentHistory, setAppointmentHistory] = useState<{ [clientId: string]: AppointmentHistory[] }>({});

  useEffect(() => {
    const fetchClientsAndHistory = async () => {
      if (!user?.email) return;

      try {
        setLoading(true);

        const { data: barberData, error: barberError } = await supabase
          .from('painel_barbeiros')
          .select('id')
          .eq('email', user.email)
          .single();

        if (barberError || !barberData) {
          console.error('Erro ao buscar barbeiro:', barberError);
          return;
        }

        const { data: appointmentsData, error: appointmentsError } = await supabase
          .from('painel_agendamentos')
          .select(`
            *,
            painel_clientes!inner(id, nome, email, whatsapp, data_nascimento, created_at),
            painel_servicos!inner(nome, preco)
          `)
          .eq('barbeiro_id', barberData.id)
          .order('data', { ascending: false });

        if (appointmentsError) {
          console.error('Erro ao buscar agendamentos:', appointmentsError);
          return;
        }

        const clientsMap = new Map<string, Client>();
        const historyMap: { [clientId: string]: AppointmentHistory[] } = {};

        appointmentsData?.forEach((appointment) => {
          const client = appointment.painel_clientes;
          const service = appointment.painel_servicos;

          if (client && !clientsMap.has(client.id)) {
            clientsMap.set(client.id, {
              id: client.id,
              nome: client.nome,
              email: client.email,
              whatsapp: client.whatsapp,
              data_nascimento: client.data_nascimento,
              created_at: client.created_at
            });
          }

          if (client && service) {
            if (!historyMap[client.id]) {
              historyMap[client.id] = [];
            }

            historyMap[client.id].push({
              id: appointment.id,
              data: appointment.data,
              hora: appointment.hora,
              status: appointment.status,
              servico_nome: service.nome,
              servico_preco: service.preco
            });
          }
        });

        setClients(Array.from(clientsMap.values()));
        setAppointmentHistory(historyMap);
      } catch (error) {
        console.error('Erro ao carregar clientes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClientsAndHistory();
  }, [user?.email]);

  const filteredClients = useMemo(() => {
    return clients.filter(client => 
      client.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.whatsapp.includes(searchTerm)
    );
  }, [clients, searchTerm]);

  const getStatusBadge = (status: string) => {
    const configs = {
      'confirmado': { label: 'Confirmado', className: 'bg-blue-500/20 text-blue-300' },
      'concluido': { label: 'Concluído', className: 'bg-green-500/20 text-green-300' },
      'cancelado': { label: 'Cancelado', className: 'bg-red-500/20 text-red-300' }
    };
    
    const config = configs[status as keyof typeof configs] || configs.confirmado;
    return <Badge className={`text-xs ${config.className}`}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="w-full h-full flex justify-center items-center min-h-screen">
        <div className="w-8 h-8 border-2 border-urbana-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-screen">
      <div className="w-full space-y-3 p-2 sm:p-3 lg:p-4">
        {/* Header */}
        <StandardCard>
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500/10 to-blue-600/5 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white">Meus Clientes</h2>
                <p className="text-xs sm:text-sm text-gray-400">{clients.length} clientes atendidos</p>
              </div>
            </div>
            
            <div className="w-full sm:w-auto sm:min-w-[250px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-800/50 border-gray-700/50 text-white placeholder-gray-400 h-10"
                />
              </div>
            </div>
          </div>
        </StandardCard>

        {/* Clients Grid */}
        {filteredClients.length === 0 ? (
          <StandardCard>
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">
                {clients.length === 0 ? 'Nenhum cliente encontrado' : 'Nenhum resultado'}
              </h3>
              <p className="text-sm text-gray-400">
                {clients.length === 0 
                  ? 'Os clientes aparecerão aqui conforme você realizar atendimentos'
                  : 'Tente ajustar sua busca'
                }
              </p>
            </div>
          </StandardCard>
        ) : (
          <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3">
            {filteredClients.map((client) => {
              const history = appointmentHistory[client.id] || [];
              const totalAppointments = history.length;
              const completedAppointments = history.filter(h => h.status === 'concluido').length;
              const totalSpent = history
                .filter(h => h.status === 'concluido')
                .reduce((sum, h) => sum + h.servico_preco, 0);

              return (
                <StandardCard key={client.id}>
                  <div className="space-y-3">
                    {/* Client Info */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white text-sm sm:text-base truncate">
                          {client.nome}
                        </h3>
                        <div className="space-y-1 mt-2">
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <Mail className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{client.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <Phone className="h-3 w-3 flex-shrink-0" />
                            <span>{client.whatsapp}</span>
                          </div>
                          {client.data_nascimento && (
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                              <Calendar className="h-3 w-3 flex-shrink-0" />
                              <span>
                                {format(parseISO(client.data_nascimento), 'dd/MM/yyyy', { locale: ptBR })}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 py-2 border-t border-gray-700/50">
                      <div className="text-center">
                        <div className="text-sm font-bold text-white">{totalAppointments}</div>
                        <div className="text-xs text-gray-400">Total</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-bold text-green-400">{completedAppointments}</div>
                        <div className="text-xs text-gray-400">Concluídos</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-bold text-urbana-gold">
                          R$ {totalSpent.toFixed(0)}
                        </div>
                        <div className="text-xs text-gray-400">Gasto</div>
                      </div>
                    </div>

                    {/* Recent History */}
                    {history.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-medium text-gray-300">Últimos atendimentos</h4>
                        <div className="space-y-1 max-h-24 overflow-y-auto">
                          {history.slice(0, 2).map((appointment) => (
                            <div key={appointment.id} className="flex items-center justify-between p-2 bg-gray-700/30 rounded text-xs">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-3 w-3 text-gray-400 flex-shrink-0" />
                                  <span className="text-white truncate">{appointment.servico_nome}</span>
                                </div>
                                <div className="text-gray-400 mt-1">
                                  {format(parseISO(appointment.data), 'dd/MM/yyyy', { locale: ptBR })} às {appointment.hora}
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-1 ml-2">
                                {getStatusBadge(appointment.status)}
                                <span className="text-urbana-gold font-medium">
                                  R$ {appointment.servico_preco.toFixed(0)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </StandardCard>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default BarberClients;
