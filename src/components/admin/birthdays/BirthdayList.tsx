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

export interface BirthdayClient {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  birth_date?: string | null;
  whatsapp?: string | null;
  age?: number;
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

    // Limpar número e adicionar DDI +55 se não estiver presente
    let cleanPhoneNumber = phoneNumber.replace(/\D/g, '');
    
    // Se o número não começa com 55 (código do Brasil), adicionar
    if (!cleanPhoneNumber.startsWith('55')) {
      cleanPhoneNumber = '55' + cleanPhoneNumber;
    }
    
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

    const excelData = clients.map(client => {
      const age = client.birth_date 
        ? Math.floor((new Date().getTime() - new Date(client.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
        : 0;
      return {
        'Nome': client.name,
        'E-mail': client.email || '-',
        'Telefone': client.phone || '-',
        'WhatsApp': client.whatsapp || client.phone || '-',
        'Data de Nascimento': client.birth_date ? format(new Date(client.birth_date), 'dd/MM/yyyy') : '-',
        'Idade': `${age} anos`
      };
    });

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
      <div className="p-3 sm:p-4 border-b border-gray-700">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center space-x-2">
            <Cake className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
            <span className="text-base sm:text-lg font-semibold text-white">
              Aniversariantes {filterLabels[filter]} ({clients.length})
            </span>
          </div>
          <Button onClick={exportToExcel} variant="outline" size="sm" className="w-full sm:w-auto bg-gray-700 border-gray-600 text-white hover:bg-gray-600">
            <Download className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Exportar Excel</span>
            <span className="sm:hidden">Exportar</span>
          </Button>
        </div>
      </div>
      
      {/* Layout em Cards para Mobile/Tablet */}
      <div className="block lg:hidden p-3 space-y-3">
        {clients.map((client) => {
          const whatsappNumber = client.whatsapp || client.phone;
          const age = client.birth_date 
            ? Math.floor((new Date().getTime() - new Date(client.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
            : 0;
          
          return (
            <div key={client.id} className="bg-gray-700 border border-gray-600 rounded-lg p-3 space-y-3">
              {/* Header do Card */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white text-sm truncate">{client.name}</h3>
                  <Badge variant="outline" className="border-gray-600 text-white mt-1">
                    {age} anos
                  </Badge>
                </div>
                <Badge className="bg-green-900 text-green-300 border-green-700 flex-shrink-0">
                  <MessageCircle className="h-3 w-3 mr-1" />
                  WhatsApp
                </Badge>
              </div>

              {/* Informações de Contato */}
              <div className="space-y-2 pt-2 border-t border-gray-600">
                {client.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                    <span className="text-xs text-white truncate">{client.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                  <span className="text-xs text-white">{client.phone}</span>
                </div>
                {whatsappNumber && whatsappNumber !== client.phone && (
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-3.5 w-3.5 text-green-400 flex-shrink-0" />
                    <span className="text-xs text-white">{whatsappNumber}</span>
                  </div>
                )}
              </div>

              {/* Data de Nascimento */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-600">
                <div className="flex items-center gap-2">
                  <Cake className="h-3.5 w-3.5 text-blue-400" />
                  <span className="text-xs text-white">
                    {client.birth_date ? format(new Date(client.birth_date), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                  </span>
                </div>
              </div>

              {/* Botão de Ação */}
              <Button
                onClick={() => handleWhatsAppClick(client)}
                size="sm"
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Enviar Felicitação
              </Button>
            </div>
          );
        })}
      </div>

      {/* Layout em Tabela para Desktop */}
      <div className="hidden lg:block p-4 overflow-x-auto">
        <Table className="min-w-full">
          <TableHeader>
            <TableRow className="border-gray-700">
              <TableHead className="text-gray-300 whitespace-nowrap">Nome</TableHead>
              <TableHead className="text-gray-300 whitespace-nowrap">E-mail</TableHead>
              <TableHead className="text-gray-300 whitespace-nowrap">Telefone</TableHead>
              <TableHead className="text-gray-300 whitespace-nowrap">WhatsApp</TableHead>
              <TableHead className="text-gray-300 whitespace-nowrap">Data de Nascimento</TableHead>
              <TableHead className="text-gray-300 whitespace-nowrap">Idade</TableHead>
              <TableHead className="text-right text-gray-300 whitespace-nowrap">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client) => {
              const whatsappNumber = client.whatsapp || client.phone;
              const age = client.birth_date 
                ? Math.floor((new Date().getTime() - new Date(client.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
                : 0;

              return (
                <TableRow key={client.id} className="border-gray-700 hover:bg-gray-700">
                  <TableCell className="font-medium text-white whitespace-nowrap">{client.name}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {client.email ? (
                      <div className="flex items-center space-x-1">
                        <Mail className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-sm text-white truncate max-w-[150px]">{client.email}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
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
                  <TableCell className="whitespace-nowrap">
                    {client.birth_date ? (
                      <span className="text-sm text-white">
                        {format(new Date(client.birth_date), 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Badge variant="outline" className="border-gray-600 text-white">
                      {age} anos
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
