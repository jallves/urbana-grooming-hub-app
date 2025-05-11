
import React, { useState } from 'react';
import BarberLayout from '../components/barber/BarberLayout';
import { Button } from '@/components/ui/button';
import { Calendar } from "@/components/ui/calendar";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent 
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
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';

// Mock data for appointments
const mockAppointments = [
  {
    id: '1',
    clientName: 'João Silva',
    service: 'Corte Degradê',
    time: '09:00',
    status: 'confirmado',
    notes: 'Cliente prefere degradê alto'
  },
  {
    id: '2',
    clientName: 'Pedro Almeida',
    service: 'Barba',
    time: '10:30',
    status: 'confirmado',
    notes: ''
  },
  {
    id: '3',
    clientName: 'Carlos Mendes',
    service: 'Corte + Barba',
    time: '14:00',
    status: 'concluído',
    notes: 'Cliente tem cabelo fino'
  },
  {
    id: '4',
    clientName: 'Lucas Ferreira',
    service: 'Corte Tesoura',
    time: '16:30',
    status: 'cancelado',
    notes: ''
  }
];

const BarberDashboard: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily');
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBlockingDialog, setIsBlockingDialog] = useState(false);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'confirmado':
        return 'bg-blue-500';
      case 'concluído':
        return 'bg-green-500';
      case 'cancelado':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handleAppointmentClick = (appointment: any) => {
    setSelectedAppointment(appointment);
    setIsDialogOpen(true);
  };

  const handleStatusChange = (status: string) => {
    // In a real app, this would call an API to update the appointment status
    console.log(`Alterando status do agendamento ${selectedAppointment?.id} para ${status}`);
    setSelectedAppointment({
      ...selectedAppointment,
      status: status
    });
    // Don't close dialog so user can see the status change
  };

  const handleBlockTime = () => {
    setIsBlockingDialog(true);
  };

  const renderAppointments = () => {
    return mockAppointments.map(appointment => (
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
                  onClick={handleBlockTime}
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
                </CardHeader>
                <CardContent>
                  {renderAppointments()}

                  {mockAppointments.length === 0 && (
                    <div className="text-center py-10">
                      <p className="text-gray-400">Nenhum agendamento para esta data</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="availableTimes">
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-white">Horários Disponíveis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'].map(time => (
                      <Button 
                        key={time} 
                        variant="outline" 
                        className="border-zinc-700 text-white hover:bg-zinc-800"
                      >
                        {time}
                      </Button>
                    ))}
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
                    <Button className="bg-green-500 hover:bg-green-600 text-white" onClick={() => handleStatusChange('concluído')}>
                      Finalizar Atendimento
                    </Button>
                    <Button variant="outline" className="border-zinc-700 text-white" onClick={() => handleStatusChange('reagendamento')}>
                      Solicitar Reagendamento
                    </Button>
                  </>
                )}
                <Button variant="outline" className="border-zinc-700 text-white" onClick={() => setIsDialogOpen(false)}>
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
              <Select>
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
              <Select>
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
          </div>
          <DialogFooter>
            <Button variant="outline" className="border-zinc-700 text-white" onClick={() => setIsBlockingDialog(false)}>
              Cancelar
            </Button>
            <Button className="bg-white text-black hover:bg-gray-200" onClick={() => setIsBlockingDialog(false)}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </BarberLayout>
  );
};

export default BarberDashboard;
