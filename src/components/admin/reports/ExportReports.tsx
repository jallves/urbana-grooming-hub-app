
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Download, Calendar as CalendarIcon, FileText, Users, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

type ReportType = 'appointments' | 'clients' | 'revenue' | 'barbers';

interface ExportFilters {
  type: ReportType;
  startDate: Date;
  endDate: Date;
  status?: string;
  barberId?: string;
}

export const ExportReports: React.FC = () => {
  const [filters, setFilters] = useState<ExportFilters>({
    type: 'appointments',
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date()
  });
  const [isExporting, setIsExporting] = useState(false);
  const [barbers, setBarbers] = useState<any[]>([]);
  const { toast } = useToast();

  React.useEffect(() => {
    loadBarbers();
  }, []);

  const loadBarbers = async () => {
    try {
      const { data, error } = await supabase
        .from('barbers')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setBarbers(data || []);
    } catch (error) {
      console.error('Erro ao carregar barbeiros:', error);
    }
  };

  const exportAppointments = async () => {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        id,
        start_time,
        end_time,
        status,
        notes,
        created_at,
        client:clients (name, phone, email),
        service:services (name, duration, price),
        barber:barbers (name)
      `)
      .gte('start_time', filters.startDate.toISOString())
      .lte('start_time', filters.endDate.toISOString())
      .modify((query) => {
        if (filters.status) query.eq('status', filters.status);
        if (filters.barberId) query.eq('staff_id', filters.barberId);
      })
      .order('start_time', { ascending: false });

    if (error) throw error;

    const exportData = data?.map(apt => ({
      'ID': apt.id,
      'Cliente': apt.client?.name || '',
      'Telefone': apt.client?.phone || '',
      'Email': apt.client?.email || '',
      'Serviço': apt.service?.name || '',
      'Barbeiro': apt.barber?.name || '',
      'Data/Hora': new Date(apt.start_time).toLocaleString('pt-BR'),
      'Duração (min)': apt.service?.duration || 0,
      'Valor': apt.service?.price || 0,
      'Status': apt.status,
      'Observações': apt.notes || '',
      'Criado em': new Date(apt.created_at).toLocaleString('pt-BR')
    })) || [];

    return exportData;
  };

  const exportClients = async () => {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .gte('created_at', filters.startDate.toISOString())
      .lte('created_at', filters.endDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;

    const exportData = data?.map(client => ({
      'ID': client.id,
      'Nome': client.name,
      'Email': client.email || '',
      'Telefone': client.phone,
      'WhatsApp': client.whatsapp || '',
      'Data de Nascimento': client.birth_date ? new Date(client.birth_date).toLocaleDateString('pt-BR') : '',
      'Cadastrado em': new Date(client.created_at).toLocaleString('pt-BR')
    })) || [];

    return exportData;
  };

  const exportRevenue = async () => {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        id,
        start_time,
        status,
        client:clients (name),
        service:services (name, price),
        barber:barbers (name)
      `)
      .eq('status', 'completed')
      .gte('start_time', filters.startDate.toISOString())
      .lte('start_time', filters.endDate.toISOString())
      .order('start_time', { ascending: false });

    if (error) throw error;

    const exportData = data?.map(apt => ({
      'ID': apt.id,
      'Data': new Date(apt.start_time).toLocaleDateString('pt-BR'),
      'Cliente': apt.client?.name || '',
      'Serviço': apt.service?.name || '',
      'Barbeiro': apt.barber?.name || '',
      'Valor': apt.service?.price || 0
    })) || [];

    // Add summary row
    const totalRevenue = exportData.reduce((sum, row) => sum + (row.Valor || 0), 0);
    exportData.push({
      'ID': '',
      'Data': '',
      'Cliente': '',
      'Serviço': '',
      'Barbeiro': 'TOTAL:',
      'Valor': totalRevenue
    });

    return exportData;
  };

  const exportBarberPerformance = async () => {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        barber:barbers (id, name),
        service:services (price),
        status,
        start_time
      `)
      .eq('status', 'completed')
      .gte('start_time', filters.startDate.toISOString())
      .lte('start_time', filters.endDate.toISOString());

    if (error) throw error;

    // Group by barber
    const barberStats: Record<string, any> = {};
    
    data?.forEach(apt => {
      const barberId = apt.barber?.id;
      const barberName = apt.barber?.name;
      const revenue = apt.service?.price || 0;

      if (barberId && barberName) {
        if (!barberStats[barberId]) {
          barberStats[barberId] = {
            name: barberName,
            appointments: 0,
            revenue: 0
          };
        }
        barberStats[barberId].appointments++;
        barberStats[barberId].revenue += revenue;
      }
    });

    const exportData = Object.values(barberStats).map((stats: any) => ({
      'Barbeiro': stats.name,
      'Agendamentos Concluídos': stats.appointments,
      'Faturamento': stats.revenue,
      'Ticket Médio': stats.appointments > 0 ? (stats.revenue / stats.appointments).toFixed(2) : '0.00'
    }));

    return exportData;
  };

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      let data;
      let filename;

      switch (filters.type) {
        case 'appointments':
          data = await exportAppointments();
          filename = 'agendamentos';
          break;
        case 'clients':
          data = await exportClients();
          filename = 'clientes';
          break;
        case 'revenue':
          data = await exportRevenue();
          filename = 'faturamento';
          break;
        case 'barbers':
          data = await exportBarberPerformance();
          filename = 'performance-barbeiros';
          break;
        default:
          throw new Error('Tipo de relatório inválido');
      }

      // Create workbook and worksheet
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Relatório');

      // Generate filename with date range
      const startDate = format(filters.startDate, 'dd-MM-yyyy');
      const endDate = format(filters.endDate, 'dd-MM-yyyy');
      const fullFilename = `${filename}_${startDate}_${endDate}.xlsx`;

      // Download file
      XLSX.writeFile(wb, fullFilename);

      toast({
        title: "Relatório exportado com sucesso!",
        description: `Arquivo ${fullFilename} foi baixado.`,
      });
    } catch (error: any) {
      console.error('Erro ao exportar:', error);
      toast({
        title: "Erro na exportação",
        description: error.message || "Não foi possível exportar o relatório.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const reportTypes = [
    { value: 'appointments', label: 'Agendamentos', icon: CalendarIcon, color: 'text-blue-500' },
    { value: 'clients', label: 'Clientes', icon: Users, color: 'text-green-500' },
    { value: 'revenue', label: 'Faturamento', icon: DollarSign, color: 'text-purple-500' },
    { value: 'barbers', label: 'Performance dos Barbeiros', icon: FileText, color: 'text-amber-500' }
  ];

  const selectedReportType = reportTypes.find(type => type.value === filters.type);

  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Download className="h-5 w-5" />
          Exportar Relatórios
        </CardTitle>
        <CardDescription className="text-gray-400">
          Gere e baixe relatórios personalizados em Excel
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tipo de Relatório */}
        <div>
          <label className="text-sm font-medium text-white mb-2 block">
            Tipo de Relatório
          </label>
          <Select value={filters.type} onValueChange={(value: ReportType) => setFilters(prev => ({ ...prev, type: value }))}>
            <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600">
              {reportTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <SelectItem key={type.value} value={type.value} className="text-white hover:bg-gray-700">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${type.color}`} />
                      {type.label}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Período */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-white mb-2 block">
              Data Inicial
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start bg-gray-800 border-gray-600 text-white">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(filters.startDate, "dd/MM/yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={filters.startDate}
                  onSelect={(date) => date && setFilters(prev => ({ ...prev, startDate: date }))}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <label className="text-sm font-medium text-white mb-2 block">
              Data Final
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start bg-gray-800 border-gray-600 text-white">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(filters.endDate, "dd/MM/yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={filters.endDate}
                  onSelect={(date) => date && setFilters(prev => ({ ...prev, endDate: date }))}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Filtros Adicionais */}
        {filters.type === 'appointments' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-white mb-2 block">
                Status (Opcional)
              </label>
              <Select value={filters.status || ''} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value || undefined }))}>
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="">Todos os status</SelectItem>
                  <SelectItem value="scheduled">Agendado</SelectItem>
                  <SelectItem value="confirmed">Confirmado</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-white mb-2 block">
                Barbeiro (Opcional)
              </label>
              <Select value={filters.barberId || ''} onValueChange={(value) => setFilters(prev => ({ ...prev, barberId: value || undefined }))}>
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                  <SelectValue placeholder="Todos os barbeiros" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="">Todos os barbeiros</SelectItem>
                  {barbers.map(barber => (
                    <SelectItem key={barber.id} value={barber.id}>
                      {barber.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Preview */}
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            {selectedReportType && (
              <>
                <selectedReportType.icon className={`h-5 w-5 ${selectedReportType.color}`} />
                <span className="font-medium text-white">{selectedReportType.label}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Badge variant="outline" className="border-gray-600 text-gray-300">
              {format(filters.startDate, "dd/MM/yyyy")} - {format(filters.endDate, "dd/MM/yyyy")}
            </Badge>
            {filters.status && (
              <Badge variant="outline" className="border-gray-600 text-gray-300">
                Status: {filters.status}
              </Badge>
            )}
            {filters.barberId && (
              <Badge variant="outline" className="border-gray-600 text-gray-300">
                Barbeiro: {barbers.find(b => b.id === filters.barberId)?.name}
              </Badge>
            )}
          </div>
        </div>

        {/* Export Button */}
        <Button
          onClick={handleExport}
          disabled={isExporting}
          className="w-full bg-green-600 hover:bg-green-700 text-white"
          size="lg"
        >
          {isExporting ? (
            <>
              <Download className="mr-2 h-4 w-4 animate-spin" />
              Exportando...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Exportar Relatório Excel
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ExportReports;
