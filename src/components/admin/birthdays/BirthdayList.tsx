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
      <div className="bg-gray-800 border-gray-700 rounded-lg">
        <div className="h-[400px] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-400">Carregando aniversariantes...</p>
          </div>
        </div>
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <div className="bg-gray-800 border-gray-700 rounded-lg">
        <div className="h-[200px] flex items-center justify-center">
          <div className="text-center">
            <Cake className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-white">Nenhum aniversariante {filterLabels[filter]}</p>
            <p className="text-sm text-gray-400 mt-1">Não há clientes fazendo aniversário no período selecionado</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 border-gray-700 rounded-lg">
      <div className="p-4 border-b border-gray-700">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Cake className="h-5 w-5 text-blue-500" />
            <span className="text-lg font-semibold text-white">
              Aniversariantes {filterLabels[filter]} ({clients.length})
            </span>
          </div>
          <Button onClick={exportToExcel} variant="outline" size="sm" className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600">
            <Download className="h-4 w-4 mr-2" />
            Exportar Excel
          </Button>
        </div>
      </div>
      
      <div className="p-4 overflow-x-auto">
        <Table className="min-w-full">
          <TableHeader>
            <TableRow className="border-gray-700">
              <TableHead className="text-gray-300 whitespace-nowrap">Nome</TableHead>
              <TableHead className="text-gray-300 whitespace-nowrap hidden sm:table-cell">E-mail</TableHead>
              <TableHead className="text-gray-300 whitespace-nowrap hidden sm:table-cell">Telefone</TableHead>
              <TableHead className="text-gray-300 whitespace-nowrap">WhatsApp</TableHead>
              <TableHead className="text-gray-300 whitespace-nowrap hidden md:table-cell">Data de Nascimento</TableHead>
              <TableHead className="text-gray-300 whitespace-nowrap hidden md:table-cell">Idade</TableHead>
              <TableHead className="text-right text-gray-300 whitespace-nowrap">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client) => {
              const whatsappNumber = client.whatsapp || client.phone;

              return (
                <TableRow key={client.id} className="border-gray-700 hover:bg-gray-700">
                  <TableCell className="font-medium text-white whitespace-nowrap">{client.name}</TableCell>
                  <TableCell className="hidden sm:table-cell whitespace-nowrap">
                    {client.email ? (
                      <div className="flex items-center space-x-1">
                        <Mail className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-sm text-white truncate max-w-[150px]">{client.email}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell whitespace-nowrap">
                    <div className="flex items-center space-x-1">
                      <Phone className="h-3.5 w-3.5 text-gray-400" />
                      <span className="text-sm text-white">{client.phone}</span>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Badge variant="secondary" className="bg-green-900 text-green-300 border-green-700">
                      {whatsappNumber}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell whitespace-nowrap">
                    {client.birth_date ? (
                      <span className="text-sm text-white">
                        {format(new Date(client.birth_date), 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell whitespace-nowrap">
                    <Badge variant="outline" className="border-gray-600 text-white">
                      {client.age} anos
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <Button
                      onClick={() => handleWhatsAppClick(client)}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
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
    </div>
  );
};

export default BirthdayList;
