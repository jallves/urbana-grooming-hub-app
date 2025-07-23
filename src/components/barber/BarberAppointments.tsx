import React, { useState, useMemo } from 'react';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Clock, User, Phone, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBarberAppointments } from '@/hooks/useBarberAppointments';
import BarberLayout from './BarberLayout';
import StandardBarberLayout from './layouts/StandardBarberLayout';
import StandardCard from './layouts/StandardCard';

const BarberAppointments: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('today');
  
  const { appointments, loading, updateAppointmentStatus } = useBarberAppointments();

  const filteredAppointments = useMemo(() => {
    return appointments.filter(appointment => {
      const matchesSearch = appointment.painel_clientes?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           appointment.painel_servicos?.nome?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter;
      
      const appointmentDate = new Date(appointment.data);
      const matchesTab = 
        (activeTab === 'today' && isToday(appointmentDate)) ||
        (activeTab === 'tomorrow' && isTomorrow(appointmentDate)) ||
        (activeTab === 'upcoming' && !isPast(appointmentDate) && !isToday(appointmentDate) && !isTomorrow(appointmentDate)) ||
        (activeTab === 'past' && isPast(appointmentDate)) ||
        (activeTab === 'all');

      return matchesSearch && matchesStatus && matchesTab;
    });
  }, [appointments, searchTerm, statusFilter, activeTab]);

  const getStatusBadge = (status: string) => {
    const configs = {
      'confirmado': { 
        label: 'Confirmado', 
        className: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
        icon: CheckCircle
      },
      'concluido': { 
        label: 'Concluído', 
        className: 'bg-green-500/20 text-green-300 border-green-500/40',
        icon: CheckCircle
      },
      'cancelado': { 
        label: 'Cancelado', 
        className: 'bg-red-500/20 text-red-300 border-red-500/40',
        icon: XCircle
      }
    };
    
    const config = configs[status as keyof typeof configs] || configs.confirmado;
    const Icon = config.icon;
    
    return (
      <Badge className={`text-xs ${config.className} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getDateLabel = (date: string) => {
    const appointmentDate = new Date(date);
    if (isToday(appointmentDate)) return 'Hoje';
    if (isTomorrow(appointmentDate)) return 'Amanhã';
    return format(appointmentDate, 'dd/MM/yyyy', { locale: ptBR });
  };

  const tabCounts = useMemo(() => {
    const today = appointments.filter(apt => isToday(new Date(apt.data))).length;
    const tomorrow = appointments.filter(apt => isTomorrow(new Date(apt.data))).length;
    const upcoming = appointments.filter(apt => {
      const date = new Date(apt.data);
      return !isPast(date) && !isToday(date) && !isTomorrow(date);
    }).length;
    const past = appointments.filter(apt => isPast(new Date(apt.data))).length;
    
    return { today, tomorrow, upcoming, past };
  }, [appointments]);

  return (
    <BarberLayout title="Meus Agendamentos">
      <StandardBarberLayout>
        {/* Header com filtros */}
        <div className="w-full space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por cliente ou serviço..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-800/50 border-gray-700/50 text-white placeholder-gray-400"
              />
            </div>
            <div className="w-full sm:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full bg-gray-800/50 border-gray-700/50 text-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="confirmado">Confirmado</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Tabs para filtrar por período */}
        <div className="w-full flex-1 min-h-0 flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col">
            <TabsList className="w-full grid grid-cols-2 sm:grid-cols-5 bg-gray-800/50 border border-gray-700/50">
              <TabsTrigger value="today" className="text-xs sm:text-sm data-[state=active]:bg-urbana-gold data-[state=active]:text-black">
                Hoje {tabCounts.today > 0 && `(${tabCounts.today})`}
              </TabsTrigger>
              <TabsTrigger value="tomorrow" className="text-xs sm:text-sm data-[state=active]:bg-urbana-gold data-[state=active]:text-black">
                Amanhã {tabCounts.tomorrow > 0 && `(${tabCounts.tomorrow})`}
              </TabsTrigger>
              <TabsTrigger value="upcoming" className="text-xs sm:text-sm data-[state=active]:bg-urbana-gold data-[state=active]:text-black">
                Próximos {tabCounts.upcoming > 0 && `(${tabCounts.upcoming})`}
              </TabsTrigger>
              <TabsTrigger value="past" className="text-xs sm:text-sm data-[state=active]:bg-urbana-gold data-[state=active]:text-black">
                Passados {tabCounts.past > 0 && `(${tabCounts.past})`}
              </TabsTrigger>
              <TabsTrigger value="all" className="text-xs sm:text-sm data-[state=active]:bg-urbana-gold data-[state=active]:text-black">
                Todos
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="w-full flex-1 mt-4 sm:mt-6 min-h-0 flex flex-col">
              {loading ? (
                <div className="w-full flex-1 flex justify-center items-center">
                  <div className="w-8 h-8 border-2 border-urbana-gold border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filteredAppointments.length === 0 ? (
                <div className="w-full flex-1 flex items-center justify-center">
                  <StandardCard>
                    <div className="flex flex-col items-center justify-center py-8 sm:py-12">
                      <Calendar className="w-12 h-12 text-gray-500 mb-4" />
                      <p className="text-gray-400 text-center">Nenhum agendamento encontrado</p>
                    </div>
                  </StandardCard>
                </div>
              ) : (
                <div className="w-full flex-1 min-h-0 overflow-auto">
                  {/* Desktop: Grid de cards */}
                  <div className="hidden sm:grid sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                    {filteredAppointments.map((appointment) => (
                      <StandardCard key={appointment.id}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-sm font-medium text-white flex items-center gap-2">
                            <User className="w-4 h-4 text-urbana-gold" />
                            {appointment.painel_clientes?.nome || 'Cliente não encontrado'}
                          </div>
                          {getStatusBadge(appointment.status)}
                        </div>
                        
                        <div className="space-y-2 text-sm mb-4">
                          <div className="flex items-center gap-2 text-gray-300">
                            <Calendar className="w-4 h-4 text-blue-400" />
                            <span>{getDateLabel(appointment.data)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-300">
                            <Clock className="w-4 h-4 text-green-400" />
                            <span>{appointment.hora}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-300">
                            <Phone className="w-4 h-4 text-purple-400" />
                            <span>{appointment.painel_clientes?.whatsapp || 'Não informado'}</span>
                          </div>
                        </div>
                        
                        <div className="pt-2 border-t border-gray-700/50">
                          <p className="text-sm font-medium text-white mb-1">
                            {appointment.painel_servicos?.nome || 'Serviço não encontrado'}
                          </p>
                          <p className="text-xs text-urbana-gold">
                            R$ {appointment.painel_servicos?.preco?.toFixed(2) || '0,00'}
                          </p>
                        </div>

                        {appointment.status === 'confirmado' && (
                          <div className="flex gap-2 pt-3">
                            <Button
                              size="sm"
                              onClick={() => updateAppointmentStatus(appointment.id, 'concluido')}
                              className="flex-1 bg-green-600 text-white"
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Concluir
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateAppointmentStatus(appointment.id, 'cancelado')}
                              className="flex-1 border-red-500/50 text-red-400"
                            >
                              <XCircle className="w-3 h-3 mr-1" />
                              Cancelar
                            </Button>
                          </div>
                        )}
                      </StandardCard>
                    ))}
                  </div>

                  {/* Mobile: Lista compacta */}
                  <div className="sm:hidden space-y-3">
                    {filteredAppointments.map((appointment) => (
                      <StandardCard key={appointment.id}>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-medium text-white text-sm truncate">
                            {appointment.painel_clientes?.nome || 'Cliente não encontrado'}
                          </h3>
                          {getStatusBadge(appointment.status)}
                        </div>
                        
                        <div className="space-y-2 text-sm text-gray-300 mb-3">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2">
                              <Calendar className="w-3 h-3 text-blue-400" />
                              {getDateLabel(appointment.data)}
                            </span>
                            <span className="flex items-center gap-2">
                              <Clock className="w-3 h-3 text-green-400" />
                              {appointment.hora}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs truncate">{appointment.painel_servicos?.nome}</span>
                            <span className="text-xs text-urbana-gold font-medium">
                              R$ {appointment.painel_servicos?.preco?.toFixed(2) || '0,00'}
                            </span>
                          </div>
                        </div>

                        {appointment.status === 'confirmado' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => updateAppointmentStatus(appointment.id, 'concluido')}
                              className="flex-1 bg-green-600 text-white text-xs"
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Concluir
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateAppointmentStatus(appointment.id, 'cancelado')}
                              className="flex-1 border-red-500/50 text-red-400 text-xs"
                            >
                              <XCircle className="w-3 h-3 mr-1" />
                              Cancelar
                            </Button>
                          </div>
                        )}
                      </StandardCard>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </StandardBarberLayout>
    </BarberLayout>
  );
};

export default BarberAppointments;
