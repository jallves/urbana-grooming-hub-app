
import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Phone, Mail, MessageCircle } from 'lucide-react';
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
    <TableRow className="hover:bg-gray-50 transition-colors border-b border-gray-100">
      {/* Nome - sempre visível com informações empilhadas no mobile */}
      <TableCell className="font-medium text-sm px-4 py-3">
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-gray-900 truncate">
            {client.name}
          </span>
          {/* Mostra email empilhado no mobile quando coluna está oculta */}
          <div className="sm:hidden">
            {client.email && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Mail className="h-3 w-3" />
                <span className="truncate">{client.email}</span>
              </div>
            )}
          </div>
        </div>
      </TableCell>
      
      {/* E-mail - oculto no mobile */}
      <TableCell className="text-sm px-4 py-3 hidden sm:table-cell">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <span className="truncate text-gray-700">
            {client.email || '-'}
          </span>
        </div>
      </TableCell>
      
      {/* Telefone - sempre visível */}
      <TableCell className="text-sm px-4 py-3">
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <span className="text-gray-700 font-mono text-sm">
            {formatPhone(client.phone)}
          </span>
        </div>
      </TableCell>
      
      {/* WhatsApp - oculto no mobile e tablet */}
      <TableCell className="text-sm px-4 py-3 hidden md:table-cell">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
          <span className="text-gray-700 font-mono text-sm">
            {client.whatsapp ? formatPhone(client.whatsapp) : '-'}
          </span>
        </div>
      </TableCell>
      
      {/* Data de Nascimento - oculto até desktop */}
      <TableCell className="text-sm px-4 py-3 hidden lg:table-cell text-gray-700">
        {formatDate(client.birth_date)}
      </TableCell>
      
      {/* Data de Cadastro - oculto até telas grandes */}
      <TableCell className="text-sm px-4 py-3 hidden xl:table-cell text-gray-700">
        {formatDate(client.created_at)}
      </TableCell>
      
      {/* Ações - sempre visível */}
      <TableCell className="text-right px-4 py-3">
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(client.id)}
            className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 transition-colors"
            title="Editar cliente"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(client)}
            className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 transition-colors"
            title="Excluir cliente"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default ClientTableRow;
