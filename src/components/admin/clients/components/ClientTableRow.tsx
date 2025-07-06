
import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Phone, Mail } from 'lucide-react';
import { Client } from '@/types/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ClientTableRowProps {
  client: Client;
  onEdit: (id: string) => void;
  onDelete: (client: Client) => void;
}

const ClientTableRow: React.FC<ClientTableRowProps> = ({ client, onEdit, onDelete }) => {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return '-';
    }
  };

  const formatPhone = (phone: string | null) => {
    if (!phone) return '-';
    return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  return (
    <TableRow className="hover:bg-white/5">
      {/* Nome - sempre visível */}
      <TableCell className="font-medium text-xs sm:text-sm max-w-[120px] truncate">
        <div className="flex flex-col">
          <span className="truncate">{client.name}</span>
          {/* Mostra email no mobile quando coluna email está oculta */}
          <span className="text-xs text-gray-400 sm:hidden truncate">
            {client.email || 'Sem email'}
          </span>
        </div>
      </TableCell>
      
      {/* E-mail - oculto no mobile */}
      <TableCell className="text-xs sm:text-sm max-w-[140px] truncate hidden sm:table-cell">
        <div className="flex items-center gap-1">
          <Mail className="h-3 w-3 text-gray-400" />
          <span className="truncate">{client.email || '-'}</span>
        </div>
      </TableCell>
      
      {/* Telefone - sempre visível */}
      <TableCell className="text-xs sm:text-sm">
        <div className="flex items-center gap-1">
          <Phone className="h-3 w-3 text-gray-400" />
          <span className="truncate">{formatPhone(client.phone)}</span>
        </div>
      </TableCell>
      
      {/* WhatsApp - oculto no mobile e tablet */}
      <TableCell className="text-xs sm:text-sm hidden md:table-cell">
        {client.whatsapp ? formatPhone(client.whatsapp) : '-'}
      </TableCell>
      
      {/* Data de Nascimento - oculto até desktop */}
      <TableCell className="text-xs sm:text-sm hidden lg:table-cell">
        {formatDate(client.birth_date)}
      </TableCell>
      
      {/* Data de Cadastro - oculto até telas grandes */}
      <TableCell className="text-xs sm:text-sm hidden xl:table-cell">
        {formatDate(client.created_at)}
      </TableCell>
      
      {/* Ações - sempre visível */}
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(client.id)}
            className="h-6 w-6 p-0 sm:h-8 sm:w-8"
          >
            <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(client)}
            className="h-6 w-6 p-0 sm:h-8 sm:w-8 hover:text-red-500"
          >
            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default ClientTableRow;
