
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, FileText, Users, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ExportReports: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [exportType, setExportType] = useState<string>('appointments');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  const fetchAppointments = async () => {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        clients(name, email, phone),
        services(name, price, duration),
        staff(name, email)
      `)
      .gte('start_time', dateFrom ? new Date(dateFrom).toISOString() : new Date(2020, 0, 1).toISOString())
      .lte('start_time', dateTo ? new Date(dateTo).toISOString() : new Date().toISOString())
      .order('start_time', { ascending: false });

    if (error) throw error;
    return data || [];
  };

  const fetchStaff = async () => {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  };

  const fetchClients = async () => {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  };

  const exportToCSV = (data: any[], filename: string, headers: string[]) => {
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const value = row[header] || '';
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExport = async () => {
    try {
      setLoading(true);

      switch (exportType) {
        case 'appointments':
          const appointments = await fetchAppointments();
          const appointmentData = appointments.map(apt => ({
            'Data/Hora': format(new Date(apt.start_time), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
            'Cliente': apt.clients?.name || '',
            'Email do Cliente': apt.clients?.email || '',
            'Telefone do Cliente': apt.clients?.phone || '',
            'Serviço': apt.services?.name || '',
            'Preço': apt.services?.price || 0,
            'Duração (min)': apt.services?.duration || 0,
            'Profissional': apt.staff?.name || '',
            'Status': apt.status,
            'Observações': apt.notes || '',
            'Desconto': apt.discount_amount || 0,
          }));
          
          exportToCSV(
            appointmentData,
            `agendamentos_${format(new Date(), 'yyyy-MM-dd', { locale: ptBR })}`,
            ['Data/Hora', 'Cliente', 'Email do Cliente', 'Telefone do Cliente', 'Serviço', 'Preço', 'Duração (min)', 'Profissional', 'Status', 'Observações', 'Desconto']
          );
          break;

        case 'clients':
          const clients = await fetchClients();
          const clientData = clients.map(client => ({
            'Nome': client.name,
            'Email': client.email || '',
            'Telefone': client.phone || '',
            'Data de Nascimento': client.birth_date ? format(new Date(client.birth_date), 'dd/MM/yyyy', { locale: ptBR }) : '',
            'Data de Cadastro': format(new Date(client.created_at), 'dd/MM/yyyy', { locale: ptBR })
          }));
          
          exportToCSV(
            clientData,
            `clientes_${format(new Date(), 'yyyy-MM-dd', { locale: ptBR })}`,
            ['Nome', 'Email', 'Telefone', 'Data de Nascimento', 'Data de Cadastro']
          );
          break;

        case 'staff':
          const staff = await fetchStaff();
          const staffData = staff.map(member => ({
            'Nome': member.name,
            'Email': member.email || '',
            'Telefone': member.phone || '',
            'Cargo': member.role || '',
            'Especialidades': Array.isArray(member.specialties) ? member.specialties.join(', ') : (member.specialties || ''),
            'Experiência': member.experience || '',
            'Taxa de Comissão': member.commission_rate || 0,
            'Status': member.is_active ? 'Ativo' : 'Inativo',
            'Data de Cadastro': format(new Date(member.created_at || new Date()), 'dd/MM/yyyy', { locale: ptBR })
          }));
          
          exportToCSV(
            staffData,
            `equipe_${format(new Date(), 'yyyy-MM-dd', { locale: ptBR })}`,
            ['Nome', 'Email', 'Telefone', 'Cargo', 'Especialidades', 'Experiência', 'Taxa de Comissão', 'Status', 'Data de Cadastro']
          );
          break;

        case 'financial':
          const financialAppts = await fetchAppointments();
          const financialData = financialAppts
            .filter(apt => apt.status === 'completed')
            .map(apt => ({
              'Data': format(new Date(apt.start_time), 'dd/MM/yyyy', { locale: ptBR }),
              'Cliente': apt.clients?.name || '',
              'Serviço': apt.services?.name || '',
              'Profissional': apt.staff?.name || '',
              'Valor do Serviço': apt.services?.price || 0,
              'Desconto': apt.discount_amount || 0,
              'Valor Final': (apt.services?.price || 0) - (apt.discount_amount || 0),
            }));
          
          exportToCSV(
            financialData,
            `financeiro_${format(new Date(), 'yyyy-MM-dd', { locale: ptBR })}`,
            ['Data', 'Cliente', 'Serviço', 'Profissional', 'Valor do Serviço', 'Desconto', 'Valor Final']
          );
          break;
      }

      toast({
        title: "Sucesso",
        description: "Relatório exportado com sucesso!",
      });
    } catch (error) {
      console.error('Error exporting report:', error);
      toast({
        title: "Erro",
        description: "Não foi possível exportar o relatório.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Exportar Relatórios</h2>
        <p className="text-muted-foreground">
          Exporte dados do sistema em formato CSV
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configurações de Exportação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="export-type">Tipo de Relatório</Label>
            <Select value={exportType} onValueChange={setExportType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="appointments">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Agendamentos
                  </div>
                </SelectItem>
                <SelectItem value="clients">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Clientes
                  </div>
                </SelectItem>
                <SelectItem value="staff">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Equipe
                  </div>
                </SelectItem>
                <SelectItem value="financial">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Financeiro
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(exportType === 'appointments' || exportType === 'financial') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date-from">Data Inicial</Label>
                <Input
                  id="date-from"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="date-to">Data Final</Label>
                <Input
                  id="date-to"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>
          )}

          <Button onClick={handleExport} disabled={loading} className="w-full">
            <Download className="h-4 w-4 mr-2" />
            {loading ? 'Exportando...' : 'Exportar Relatório'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informações sobre os Relatórios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div>
              <strong>Agendamentos:</strong> Inclui todos os agendamentos com informações do cliente, serviço e profissional.
            </div>
            <div>
              <strong>Clientes:</strong> Lista completa de clientes cadastrados com informações de contato.
            </div>
            <div>
              <strong>Equipe:</strong> Informações dos profissionais cadastrados no sistema.
            </div>
            <div>
              <strong>Financeiro:</strong> Relatório de receitas baseado em agendamentos concluídos.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExportReports;
