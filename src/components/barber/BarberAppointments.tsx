
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Filter, Search } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Status badge component for appointments
const AppointmentStatusBadge = ({ status }: { status: string }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
      {status === 'confirmed' && 'Confirmado'}
      {status === 'pending' && 'Pendente'}
      {status === 'cancelled' && 'Cancelado'}
      {status === 'completed' && 'Concluído'}
      {!['confirmed', 'pending', 'cancelled', 'completed'].includes(status) && status}
    </span>
  );
};

const BarberAppointments = () => {
  const { user } = useAuth();
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Fetch appointments for the current barber
  const { data: appointmentsData, isLoading } = useQuery({
    queryKey: ['barber-appointments', user?.id, filter],
    queryFn: async () => {
      // First find the barber record associated with this user
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('id, name')
        .eq('email', user?.email)
        .single();
        
      if (staffError) throw new Error(staffError.message);
      
      let query = supabase
        .from('appointments')
        .select(`
          *,
          client:client_id(name, phone, email),
          service:service_id(name, price, duration)
        `)
        .eq('staff_id', staffData.id)
        .order('start_time', { ascending: true });
      
      // Apply status filter if not "all"
      if (filter !== 'all') {
        query = query.eq('status', filter);
      }
      
      const { data, error } = await query;
      
      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: !!user?.email,
  });
  
  // Filter appointments by search query
  const filteredAppointments = appointmentsData?.filter(appointment => {
    if (!searchQuery) return true;
    
    const clientName = appointment.client?.name?.toLowerCase() || '';
    const clientPhone = appointment.client?.phone?.toLowerCase() || '';
    const serviceName = appointment.service?.name?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    
    return clientName.includes(query) || 
           clientPhone.includes(query) || 
           serviceName.includes(query);
  });

  // Format the date and time
  const formatAppointmentTime = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, "dd 'de' MMMM', às' HH:mm", { locale: ptBR });
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Meus Agendamentos</CardTitle>
            
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="confirmed">Confirmados</SelectItem>
                  <SelectItem value="completed">Concluídos</SelectItem>
                  <SelectItem value="cancelled">Cancelados</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="relative w-full sm:w-[200px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
                <Input
                  type="search"
                  placeholder="Buscar..."
                  className="pl-8 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <CardDescription>
            Visualize e gerencie seus agendamentos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-urbana-gold"></div>
            </div>
          ) : filteredAppointments && filteredAppointments.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data e Hora</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Serviço</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAppointments.map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell className="whitespace-nowrap font-medium">
                        {formatAppointmentTime(appointment.start_time)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div>{appointment.client?.name}</div>
                          <div className="text-sm text-gray-500">{appointment.client?.phone}</div>
                        </div>
                      </TableCell>
                      <TableCell>{appointment.service?.name}</TableCell>
                      <TableCell>
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(appointment.service?.price || 0)}
                      </TableCell>
                      <TableCell>
                        <AppointmentStatusBadge status={appointment.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center p-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500">Nenhum agendamento encontrado</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BarberAppointments;
