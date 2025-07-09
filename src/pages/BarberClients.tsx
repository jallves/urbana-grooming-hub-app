
import React from 'react';
import BarberLayout from '@/components/barber/BarberLayout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, UserCheck, UserX, Calendar, Phone, Mail } from 'lucide-react';

const BarberClients: React.FC = () => {
  // Mock data for now - in a real app this would come from the database
  const clients = [
    {
      id: '1',
      name: 'João Silva',
      email: 'joao@email.com',
      phone: '(11) 99999-9999',
      lastVisit: '2024-01-15',
      totalAppointments: 8,
      status: 'active'
    },
    {
      id: '2',
      name: 'Maria Santos',
      email: 'maria@email.com',
      phone: '(11) 88888-8888',
      lastVisit: '2024-01-10',
      totalAppointments: 12,
      status: 'active'
    },
    {
      id: '3',
      name: 'Pedro Costa',
      email: 'pedro@email.com',
      phone: '(11) 77777-7777',
      lastVisit: '2023-12-20',
      totalAppointments: 3,
      status: 'inactive'
    }
  ];

  const stats = {
    total: clients.length,
    active: clients.filter(c => c.status === 'active').length,
    inactive: clients.filter(c => c.status === 'inactive').length,
    thisMonth: 5
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="border-green-500/50 text-green-400 bg-green-500/10">Ativo</Badge>;
      case 'inactive':
        return <Badge className="border-gray-500/50 text-gray-400 bg-gray-500/10">Inativo</Badge>;
      default:
        return <Badge className="border-blue-500/50 text-blue-400 bg-blue-500/10">{status}</Badge>;
    }
  };

  return (
    <BarberLayout title="Meus Clientes">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Total de Clientes</CardTitle>
              <Users className="h-4 w-4 text-urbana-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.total}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Clientes Ativos</CardTitle>
              <UserCheck className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.active}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Clientes Inativos</CardTitle>
              <UserX className="h-4 w-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.inactive}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Novos Este Mês</CardTitle>
              <Calendar className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.thisMonth}</div>
            </CardContent>
          </Card>
        </div>

        {/* Clients List */}
        <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-urbana-gold" />
              Lista de Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {clients.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Nenhum cliente encontrado</h3>
                <p className="text-gray-400">
                  Os clientes aparecerão aqui conforme você atende agendamentos
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Mobile View */}
                <div className="lg:hidden space-y-4">
                  {clients.map((client) => (
                    <Card key={client.id} className="bg-gray-700/50 border-gray-600/50">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-white">{client.name}</h4>
                              <p className="text-sm text-gray-400 flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {client.email}
                              </p>
                              <p className="text-sm text-gray-400 flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {client.phone}
                              </p>
                            </div>
                            {getStatusBadge(client.status)}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-400">Última Visita</p>
                              <p className="text-white">{new Date(client.lastVisit).toLocaleDateString('pt-BR')}</p>
                            </div>
                            <div>
                              <p className="text-gray-400">Total de Visitas</p>
                              <p className="text-urbana-gold font-medium">{client.totalAppointments}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Desktop View */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700/50">
                        <th className="text-left py-3 px-4 text-gray-300 font-medium">Cliente</th>
                        <th className="text-left py-3 px-4 text-gray-300 font-medium">Contato</th>
                        <th className="text-left py-3 px-4 text-gray-300 font-medium">Última Visita</th>
                        <th className="text-left py-3 px-4 text-gray-300 font-medium">Total de Visitas</th>
                        <th className="text-left py-3 px-4 text-gray-300 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clients.map((client) => (
                        <tr key={client.id} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium text-white">{client.name}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="space-y-1">
                              <p className="text-sm text-gray-300 flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {client.email}
                              </p>
                              <p className="text-sm text-gray-300 flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {client.phone}
                              </p>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-300">
                            {new Date(client.lastVisit).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-medium text-urbana-gold">{client.totalAppointments}</span>
                          </td>
                          <td className="py-3 px-4">
                            {getStatusBadge(client.status)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </BarberLayout>
  );
};

export default BarberClients;
