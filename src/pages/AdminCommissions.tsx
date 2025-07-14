import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBarbershopAppointments } from '@/hooks/useBarbershopAppointments';
import { Commission } from '@/types/barbershop';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DollarSign, Calendar, Clock, CheckCircle, AlertCircle, Search, Filter, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminCommissions() {
  const { toast } = useToast();
  const { commissions, fetchCommissions, payCommission, barbers, fetchBarbers, isLoading } = useBarbershopAppointments();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [barberFilter, setBarberFilter] = useState('');

  useEffect(() => {
    fetchCommissions();
    fetchBarbers();
  }, [fetchCommissions, fetchBarbers]);

  const handlePayCommission = async (commissionId: string) => {
    try {
      await payCommission(commissionId);
      toast({
        title: "Comissão paga",
        description: "A comissão foi marcada como paga com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível pagar a comissão.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'pending') {
      return <Badge variant="secondary">Pendente</Badge>;
    }
    return <Badge variant="default">Pago</Badge>;
  };

  const filteredCommissions = commissions.filter(commission => {
    const matchesSearch = !searchTerm || 
      commission.barber?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      commission.appointment?.client?.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = !statusFilter || commission.status === statusFilter;
    const matchesBarber = !barberFilter || commission.barber_id === barberFilter;

    return matchesSearch && matchesStatus && matchesBarber;
  });

  const calculateStats = () => {
    const pending = commissions.filter(c => c.status === 'pending');
    const paid = commissions.filter(c => c.status === 'paid');

    return {
      totalPending: pending.reduce((sum, c) => sum + c.amount, 0),
      totalPaid: paid.reduce((sum, c) => sum + c.amount, 0),
      pendingCount: pending.length,
      paidCount: paid.length
    };
  };

  const stats = calculateStats();

  const exportToCSV = () => {
    const csvData = filteredCommissions.map(commission => ({
      'Data': commission.appointment?.scheduled_date ? format(new Date(commission.appointment.scheduled_date), 'dd/MM/yyyy') : '',
      'Barbeiro': commission.barber?.name || '',
      'Cliente': commission.appointment?.client?.name || '',
      'Serviço': commission.appointment?.service?.name || '',
      'Valor do Serviço': commission.appointment?.service?.price || 0,
      'Comissão': commission.amount,
      'Status': commission.status === 'pending' ? 'Pendente' : 'Pago',
      'Data Geração': format(new Date(commission.created_at), 'dd/MM/yyyy HH:mm'),
      'Data Pagamento': commission.paid_at ? format(new Date(commission.paid_at), 'dd/MM/yyyy HH:mm') : ''
    }));

    const csvContent = "data:text/csv;charset=utf-8," 
      + Object.keys(csvData[0]).join(',') + '\n'
      + csvData.map(row => Object.values(row).join(',')).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `comissoes_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderCommissionCard = (commission: Commission) => {
    const appointmentDate = commission.appointment?.scheduled_date ? 
      format(new Date(commission.appointment.scheduled_date), "dd 'de' MMMM", { locale: ptBR }) : 
      'Data não informada';

    return (
      <Card key={commission.id} className="mb-4">
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-semibold text-lg">
                {commission.barber?.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                Cliente: {commission.appointment?.client?.name}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">
                R$ {commission.amount.toFixed(2)}
              </p>
              {getStatusBadge(commission.status)}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{appointmentDate}</span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Serviço</p>
              <p className="text-sm font-medium">{commission.appointment?.service?.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Valor do Serviço</p>
              <p className="text-sm font-medium">R$ {commission.appointment?.service?.price.toFixed(2)}</p>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="text-xs text-muted-foreground">
              <p>Gerado: {format(new Date(commission.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
              {commission.paid_at && (
                <p>Pago: {format(new Date(commission.paid_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
              )}
            </div>

            {commission.status === 'pending' && (
              <Button
                onClick={() => handlePayCommission(commission.id)}
                disabled={isLoading}
                size="sm"
                className="flex items-center gap-2 bg-transparent hover:bg-transparent text-green-400 border border-green-500 transition-none shadow-none"
              >
                <CheckCircle className="h-4 w-4" />
                {isLoading ? 'Pagando...' : 'Marcar como Pago'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Gestão de Comissões</h1>
        <p className="text-muted-foreground">Gerencie pagamentos de comissões para barbeiros</p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-xl font-bold">{stats.pendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Pagas</p>
                <p className="text-xl font-bold">{stats.paidCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Pendente</p>
              <p className="text-xl font-bold text-yellow-600">
                R$ {stats.totalPending.toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Pago</p>
              <p className="text-xl font-bold text-green-600">
                R$ {stats.totalPaid.toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por barbeiro ou cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="paid">Pago</SelectItem>
              </SelectContent>
            </Select>

            <Select value={barberFilter} onValueChange={setBarberFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Barbeiro" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                {barbers.map(barber => (
                  <SelectItem key={barber.id} value={barber.id}>
                    {barber.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              onClick={exportToCSV}
              variant="outline"
              className="flex items-center gap-2 bg-transparent hover:bg-transparent text-blue-400 border border-blue-500 transition-none shadow-none"
            >
              <Download className="h-4 w-4" />
              Exportar CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Comissões */}
      <div>
        {filteredCommissions.length > 0 ? (
          filteredCommissions.map(renderCommissionCard)
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhuma comissão encontrada</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
