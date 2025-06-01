
import React from 'react';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Cake, Phone, Mail, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

interface BirthdayClient {
  id: string;
  name: string;
  email: string;
  phone: string;
  birth_date: string;
  whatsapp: string;
  age: number;
}

interface BirthdayListProps {
  clients: BirthdayClient[];
  isLoading: boolean;
  filter: 'today' | 'week' | 'month';
  onRefresh: () => void;
}

const BirthdayList: React.FC<BirthdayListProps> = ({ clients, isLoading, filter, onRefresh }) => {
  const filterLabels = {
    today: 'hoje',
    week: 'esta semana',
    month: 'este mês'
  };

  const handleWhatsAppClick = (client: BirthdayClient) => {
    // Use WhatsApp number if available, otherwise use phone number
    const phoneNumber = client.whatsapp || client.phone;
    
    if (!phoneNumber) {
      toast.error('Cliente não possui número de telefone cadastrado');
      return;
    }

    const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');
    const message = encodeURIComponent(
      `Olá ${client.name}! 🎉 Feliz aniversário da equipe Urbana Barbearia! 🎂✨ Desejamos um dia repleto de alegria e realizações!`
    );
    const whatsappUrl = `https://wa.me/${cleanPhoneNumber}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  const exportToExcel = () => {
    if (clients.length === 0) {
      toast.error('Não há dados para exportar');
      return;
    }

    const excelData = clients.map(client => ({
      'Nome': client.name,
      'E-mail': client.email || '-',
      'Telefone': client.phone,
      'WhatsApp': client.whatsapp || client.phone,
      'Data de Nascimento': client.birth_date ? format(new Date(client.birth_date), 'dd/MM/yyyy') : '-',
      'Idade': `${client.age} anos`
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Aniversariantes');
    
    const colWidths = [
      { wch: 25 }, // Nome
      { wch: 30 }, // E-mail
      { wch: 15 }, // Telefone
      { wch: 15 }, // WhatsApp
      { wch: 18 }, // Data de Nascimento
      { wch: 12 }  // Idade
    ];
    worksheet['!cols'] = colWidths;

    const fileName = `aniversariantes_${filterLabels[filter]}_${format(new Date(), 'dd-MM-yyyy')}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    toast.success('Arquivo Excel gerado com sucesso!');
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="h-[400px] flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">Carregando aniversariantes...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (clients.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="h-[200px] flex items-center justify-center">
            <div className="text-center">
              <Cake className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">Nenhum aniversariante {filterLabels[filter]}</p>
              <p className="text-sm text-muted-foreground mt-1">Não há clientes fazendo aniversário no período selecionado</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center space-x-2">
            <Cake className="h-5 w-5" />
            <span>Aniversariantes {filterLabels[filter]} ({clients.length})</span>
          </CardTitle>
          <Button onClick={exportToExcel} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar Excel
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead>Data de Nascimento</TableHead>
                <TableHead>Idade</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => {
                const whatsappNumber = client.whatsapp || client.phone;
                
                return (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>
                      {client.email ? (
                        <div className="flex items-center space-x-1">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm">{client.email}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm">{client.phone}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-green-600">
                        {whatsappNumber}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {client.birth_date ? (
                        <span className="text-sm">
                          {format(new Date(client.birth_date), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {client.age} anos
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        onClick={() => handleWhatsAppClick(client)}
                        size="sm"
                        className="bg-green-500 hover:bg-green-600 text-white"
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Felicitar
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default BirthdayList;
