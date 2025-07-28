
import React, { useState, useMemo } from 'react';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Clock, User, Phone, CheckCircle, XCircle, Edit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBarberAppointments } from '@/hooks/useBarberAppointments';
import StandardCard from './layouts/StandardCard';
import EditAppointmentModal from './appointments/EditAppointmentModal';
import { toast } from 'sonner';

const BarberAppointments: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('today');
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  const [editingAppointmentId, setEditingAppointmentId] = useState<string | null>(null);
  
  const { appointments, loading, updateAppointmentStatus, completeAppointment, refetch } = useBarberAppointments();

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

  const handleStatusUpdate = async (appointmentId: string, newStatus: string) => {
    console.log('Iniciando atualização de status:', { appointmentId, newStatus });
    
    setUpdatingIds(prev => new Set(prev).add(appointmentId));
    
    try {
      const success = await updateAppointmentStatus(appointmentId, newStatus);
      
      if (success) {
        console.log('Status atualizado com sucesso');
      } else {
        console.error('Falha ao atualizar status do agendamento');
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    } finally {
      setUpdatingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(appointmentId);
        return newSet;
      });
    }
  };

  const handleCompleteAppointment = async (appointmentId: string) => {
    console.log('Concluindo agendamento:', appointmentId);
    
    setUpdatingIds(prev => new Set(prev).add(appointmentId));
    
    try {
      const success = await completeAppointment(appointmentId);
      
      if (success) {
        console.log('Agendamento concluído com sucesso');
      } else {
        console.error('Falha ao concluir agendamento');
      }
    } catch (error) {
      console.error('Erro ao concluir agendamento:', error);
    } finally {
      setUpdatingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(appointmentId);
        return newSet;
      });
    }
  };

  const handleEditAppointment = (appointmentId: string) => {
    setEditingAppointmentId(appointmentId);
  };

  const handleCloseEditModal = () => {
    setEditingAppointmentId(null);
  };

  const handleUpdateComplete = () => {
    refetch();
    handleCloseEditModal();
  };

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
    <div className="w-full h-full min-h-screen">
      <div className="w-full space-y-3 p-3 sm:p-4 lg:p-6">
        {/* Header com filtros */}
        <StandardCard>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <div className="flex-1">
              <Input
                placeholder="Buscar por cliente ou serviço..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-800/50 border-gray-700/50 text-white placeholder-gray-400 h-10"
              />
            </div>
            <div className="w-full sm:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full bg-gray-800/50 border-gray-700/50 text-white h-10">
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
        </StandardCard>

        {/* Tabs para filtrar por período */}
        <div className="w-full flex-1 min-h-0 flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col">
            <TabsList className="w-full grid grid-cols-5 bg-gray-800/50 border border-gray-700/50 h-10">
              <TabsTrigger value="today" className="text-xs data-[state=active]:bg-urbana-gold data-[state=active]:text-black px-1">
                Hoje {tabCounts.today > 0 && `(${tabCounts.today})`}
              </TabsTrigger>
              <TabsTrigger value="tomorrow" className="text-xs data-[state=active]:bg-urbana-gold data-[state=active]:text-black px-1">
                Amanhã {tabCounts.tomorrow > 0 && `(${tabCounts.tomorrow})`}
              </TabsTrigger>
              <TabsTrigger value="upcoming" className="text-xs data-[state=active]:bg-urbana-gold data-[state=active]:text-black px-1">
                Próximos {tabCounts.upcoming > 0 && `(${tabCounts.upcoming})`}
              </TabsTrigger>
              <TabsTrigger value="past" className="text-xs data-[state=active]:bg-urbana-gold data-[state=active]:text-black px-1">
                Passados {tabCounts.past > 0 && `(${tabCounts.past})`}
              </TabsTrigger>
              <TabsTrigger value="all" className="text-xs data-[state=active]:bg-urbana-gold data-[state=active]:text-black px-1">
                Todos
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="w-full flex-1 mt-3 min-h-0 flex flex-col">
              {loading ? (
                <div className="w-full flex-1 flex justify-center items-center">
                  <div className="w-8 h-8 border-2 border-urbana-gold border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filteredAppointments.length === 0 ? (
                <div className="w-full flex-1 flex items-center justify-center">
                  <StandardCard>
                    <div className="flex flex-col items-center justify-center py-8">
                      <Calendar className="w-12 h-12 text-gray-500 mb-4" />
                      <p className="text-gray-400 text-center">Nenhum agendamento encontrado</p>
                    </div>
                  </StandardCard>
                </div>
              ) : (
                <div className="w-full flex-1 min-h-0 overflow-auto">
                  <div className="space-y-2 sm:space-y-3">
                    {filteredAppointments.map((appointment) => (
                      <StandardCard key={appointment.id}>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium text-white text-sm flex items-center gap-2">
                              <User className="w-4 h-4 text-urbana-gold" />
                              {appointment.painel_clientes?.nome || 'Cliente não encontrado'}
                            </h3>
                            {getStatusBadge(appointment.status)}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center gap-2 text-gray-300">
                              <Calendar className="w-4 h-4 text-blue-400" />
                              <span>{getDateLabel(appointment.data)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-300">
                              <Clock className="w-4 h-4 text-green-400" />
                              <span>{appointment.hora}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-300 col-span-2">
                              <Phone className="w-4 h-4 text-purple-400" />
                              <span>{appointment.painel_clientes?.whatsapp || 'Não informado'}</span>
                            </div>
                          </div>
                          
                          <div className="pt-2 border-t border-gray-700/50">
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-white truncate">
                                {appointment.painel_servicos?.nome || 'Serviço não encontrado'}
                              </p>
                              <p className="text-sm text-urbana-gold font-medium">
                                R$ {appointment.painel_servicos?.preco?.toFixed(2) || '0,00'}
                              </p>
                            </div>
                          </div>

                          {appointment.status === 'confirmado' && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditAppointment(appointment.id)}
                                disabled={updatingIds.has(appointment.id)}
                                className="border-urbana-gold/50 text-urbana-gold h-8 hover:bg-urbana-gold/10 disabled:opacity-50"
                              >
                                <Edit className="w-3 h-3 mr-1" />
                                Editar
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleCompleteAppointment(appointment.id)}
                                disabled={updatingIds.has(appointment.id)}
                                className="flex-1 bg-green-600 text-white h-8 hover:bg-green-700 disabled:opacity-50"
                              >
                                {updatingIds.has(appointment.id) ? (
                                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                                ) : (
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                )}
                                Concluir
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusUpdate(appointment.id, 'cancelado')}
                                disabled={updatingIds.has(appointment.id)}
                                className="border-red-500/50 text-red-400 h-8 hover:bg-red-500/10 disabled:opacity-50"
                              >
                                {updatingIds.has(appointment.id) ? (
                                  <div className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin mr-1" />
                                ) : (
                                  <XCircle className="w-3 h-3 mr-1" />
                                )}
                                Cancelar
                              </Button>
                            </div>
                          )}
                        </div>
                      </StandardCard>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Modal de edição */}
      <EditAppointmentModal
        isOpen={editingAppointmentId !== null}
        onClose={handleCloseEditModal}
        appointmentId={editingAppointmentId || ''}
        onUpdate={handleUpdateComplete}
      />
    </div>
  );
};

export default BarberAppointments;
