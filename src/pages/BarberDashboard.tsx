
import React, { useState, useEffect } from 'react';
import BarberLayout from '../components/barber/BarberLayout';
import { Button } from '@/components/ui/button';
import { Calendar } from "@/components/ui/calendar";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  CardDescription
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { format, isSameDay, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, Clock, Info, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';

// Define types for appointments
interface Appointment {
  id: string;
  clientName: string;
  service: string;
  time: string;
  fullTime?: Date;
  status: 'confirmado' | 'concluído' | 'cancelado' | 'reagendamento';
  notes?: string;
}

const BarberDashboard: React.FC = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBlockingDialog, setIsBlockingDialog] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [blockNote, setBlockNote] = useState('');
  const [blockTime, setBlockTime] = useState('09:00');
  const [blockReason, setBlockReason] = useState('folga');
  const [isLoading, setIsLoading] = useState(false);

  // Mock data for appointments (in a real app, this would come from the database)
  const mockAppointments = [
    {
      id: '1',
      clientName: 'João Silva',
      service: 'Corte Degradê',
      time: '09:00',
      fullTime: new Date(new Date().setHours(9, 0, 0, 0)),
      status: 'confirmado' as const,
      notes: 'Cliente prefere degradê alto'
    },
    {
      id: '2',
      clientName: 'Pedro Almeida',
      service: 'Barba',
      time: '10:30',
      fullTime: new Date(new Date().setHours(10, 30, 0, 0)),
      status: 'confirmado' as const,
      notes: ''
    },
    {
      id: '3',
      clientName: 'Carlos Mendes',
      service: 'Corte + Barba',
      time: '14:00',
      fullTime: new Date(new Date().setHours(14, 0, 0, 0)),
      status: 'concluído' as const,
      notes: 'Cliente tem cabelo fino'
    },
    {
      id: '4',
      clientName: 'Lucas Ferreira',
      service: 'Corte Tesoura',
      time: '16:30',
      fullTime: new Date(new Date().setHours(16, 30, 0, 0)),
      status: 'cancelado' as const,
      notes: ''
    }
  ];

  useEffect(() => {
    // In a real app, fetch appointments from the database for the selected date
    // For now, we'll use the mock data
    const filteredAppointments = mockAppointments.filter(appointment => {
      // Filter by date for daily view
      if (viewMode === 'daily' && selectedDate) {
        return appointment.fullTime && isSameDay(appointment.fullTime, selectedDate);
      }
      
      // For weekly view, include all appointments
      return true;
    });
    
    setAppointments(filteredAppointments);
  }, [selectedDate, viewMode]);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'confirmado':
        return 'bg-blue-500';
      case 'concluído':
        return 'bg-green-500';
      case 'cancelado':
        return 'bg-red-500';
      case 'reagendamento':
        return 'bg-amber-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsDialogOpen(true);
  };

  const handleStatusChange = async (status: 'confirmado' | 'concluído' | 'cancelado' | 'reagendamento') => {
    if (!selectedAppointment) return;
    
    setIsLoading(true);
    
    // In a real app, this would update the status in the database
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update the appointment in the local state
      setAppointments(prev => 
        prev.map(app => 
          app.id === selectedAppointment.id 
            ? { ...app, status } 
            : app
        )
      );
      
      // Update the selected appointment state
      setSelectedAppointment({
        ...selectedAppointment,
        status
      });
      
      // Show success message
      toast.success(`Status alterado para ${status}`);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBlockTimeSubmit = async () => {
    if (!selectedDate) return;
    
    setIsLoading(true);
    
    try {
      // In a real app, this would create a blocked time in the database
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast.success('Horário bloqueado com sucesso');
      setIsBlockingDialog(false);
      setBlockNote('');
      
      // In a real app, refresh the calendar or appointments list
    } catch (error) {
      console.error('Erro ao bloquear horário:', error);
      toast.error('Erro ao bloquear horário');
    } finally {
      setIsLoading(false);
    }
  };

  const renderAppointments = () => {
    if (appointments.length === 0) {
      return (
        <div className="text-center py-8 flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <Calendar className="h-12 w-12 text-muted-foreground opacity-50" />
          <p>Nenhum agendamento para esta data</p>
          <Button variant="outline" onClick={() => setIsBlockingDialog(true)} className="mt-2">
            Bloquear Horário
          </Button>
        </div>
      );
    }

    return appointments.map(appointment => (
      <Card 
        key={appointment.id} 
        className="mb-3 cursor-pointer bg-zinc-900 border-zinc-800 hover:bg-zinc-800"
        onClick={() => handleAppointmentClick(appointment)}
      >
        <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-white text-base">{appointment.time} - {appointment.clientName}</CardTitle>
          </div>
          <Badge className={`${getStatusColor(appointment.status)}`}>
            {appointment.status}
          </Badge>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <p className="text-gray-400 text-sm">Serviço: {appointment.service}</p>
          {appointment.notes && (
            <p className="text-gray-400 text-xs mt-1">Obs: {appointment.notes}</p>
          )}
        </CardContent>
      </Card>
    ));
  };

  return (
    <BarberLayout title="Agenda de Atendimentos">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 order-2 lg:order-1">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Calendário</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="p-3 pointer-events-auto rounded-md bg-zinc-900 text-white"
                classNames={{
                  day_selected: "bg-white text-black hover:bg-gray-200 hover:text-black",
                  day_today: "bg-zinc-800 text-white",
                }}
              />
              <div className="mt-4 flex justify-between">
                <Button 
                  variant="outline" 
                  className="border-zinc-700 text-white hover:bg-zinc-800"
                  onClick={() => setIsBlockingDialog(true)}
                >
                  Bloquear Horário
                </Button>
                <Select value={viewMode} onValueChange={(value) => setViewMode(value as 'daily' | 'weekly')}>
                  <SelectTrigger className="w-[120px] bg-zinc-800 border-zinc-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                    <SelectItem value="daily">Diário</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 order-1 lg:order-2">
          <Tabs defaultValue="appointments" className="w-full">
            <TabsList className="bg-zinc-900 border-zinc-800">
              <TabsTrigger value="appointments" className="text-white data-[state=active]:bg-white data-[state=active]:text-black">
                Agendamentos
              </TabsTrigger>
              <TabsTrigger value="availableTimes" className="text-white data-[state=active]:bg-white data-[state=active]:text-black">
                Horários Disponíveis
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="appointments">
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-white">
                    {viewMode === 'daily' ? (
                      <span>Agenda para {selectedDate ? format(selectedDate, 'dd/MM/yyyy', { locale: ptBR }) : ''}</span>
                    ) : (
                      <span>Agenda Semanal</span>
                    )}
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    {viewMode === 'daily' 
                      ? 'Visualize e gerencie seus agendamentos do dia'
                      : 'Visualize uma visão geral da semana'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {renderAppointments()}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="availableTimes">
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-white">Horários Disponíveis</CardTitle>
                  <CardDescription className="text-gray-400">
                    Horários disponíveis para {selectedDate ? format(selectedDate, 'dd/MM/yyyy', { locale: ptBR }) : ''}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'].map(time => {
                      const isBooked = appointments.some(app => app.time === time);
                      return (
                        <Button 
                          key={time} 
                          variant={isBooked ? "secondary" : "outline"} 
                          disabled={isBooked}
                          className={isBooked 
                            ? "bg-zinc-700 text-gray-400 cursor-not-allowed" 
                            : "border-zinc-700 text-white hover:bg-zinc-800"
                          }
                        >
                          {time} {isBooked ? '(Ocupado)' : ''}
                        </Button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Appointment Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Detalhes do Agendamento</DialogTitle>
          </DialogHeader>
          {selectedAppointment && (
            <>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <p className="text-gray-400">Cliente:</p>
                  <p className="col-span-3">{selectedAppointment.clientName}</p>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <p className="text-gray-400">Serviço:</p>
                  <p className="col-span-3">{selectedAppointment.service}</p>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <p className="text-gray-400">Horário:</p>
                  <p className="col-span-3">{selectedAppointment.time}</p>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <p className="text-gray-400">Status:</p>
                  <div className="col-span-3">
                    <Badge className={`${getStatusColor(selectedAppointment.status)}`}>
                      {selectedAppointment.status}
                    </Badge>
                  </div>
                </div>
                {selectedAppointment.notes && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <p className="text-gray-400">Observações:</p>
                    <p className="col-span-3">{selectedAppointment.notes}</p>
                  </div>
                )}
              </div>
              <DialogFooter className="flex flex-col sm:flex-row gap-2">
                {selectedAppointment.status === 'confirmado' && (
                  <>
                    <Button 
                      className="bg-green-500 hover:bg-green-600 text-white" 
                      onClick={() => handleStatusChange('concluído')}
                      disabled={isLoading}
                    >
                      Finalizar Atendimento
                    </Button>
                    <Button 
                      variant="outline" 
                      className="border-zinc-700 text-white" 
                      onClick={() => handleStatusChange('reagendamento')}
                      disabled={isLoading}
                    >
                      Solicitar Reagendamento
                    </Button>
                  </>
                )}
                <Button 
                  variant="outline" 
                  className="border-zinc-700 text-white" 
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isLoading}
                >
                  Fechar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Block Time Dialog */}
      <Dialog open={isBlockingDialog} onOpenChange={setIsBlockingDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Bloquear Horário</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <p className="text-gray-400">Data:</p>
              <p className="col-span-3">{selectedDate ? format(selectedDate, 'dd/MM/yyyy', { locale: ptBR }) : ''}</p>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <p className="text-gray-400">Horário:</p>
              <Select value={blockTime} onValueChange={setBlockTime}>
                <SelectTrigger className="col-span-3 bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue placeholder="Selecione o horário" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                  {['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'].map(time => (
                    <SelectItem key={time} value={time}>{time}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <p className="text-gray-400">Motivo:</p>
              <Select value={blockReason} onValueChange={setBlockReason}>
                <SelectTrigger className="col-span-3 bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue placeholder="Selecione o motivo" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectItem value="folga">Folga</SelectItem>
                  <SelectItem value="almoco">Almoço</SelectItem>
                  <SelectItem value="pessoal">Motivo Pessoal</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {blockReason === 'outro' && (
              <div className="grid grid-cols-4 items-center gap-4">
                <p className="text-gray-400">Detalhes:</p>
                <Textarea 
                  value={blockNote} 
                  onChange={(e) => setBlockNote(e.target.value)}
                  placeholder="Detalhe o motivo do bloqueio..."
                  className="col-span-3 bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              className="border-zinc-700 text-white" 
              onClick={() => setIsBlockingDialog(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button 
              className="bg-white text-black hover:bg-gray-200" 
              onClick={handleBlockTimeSubmit}
              disabled={isLoading}
            >
              {isLoading ? 'Processando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </BarberLayout>
  );
};

export default BarberDashboard;
