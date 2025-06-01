
import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Edit, MoreHorizontal, Trash2, Phone, Mail } from 'lucide-react';
import { Client } from '@/types/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ClientTableRowProps {
  client: Client;
  onEdit: (id: string) => void;
  onDelete: (client: Client) => void;
}

const ClientTableRow: React.FC<ClientTableRowProps> = ({ client, onEdit, onDelete }) => {
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
        {client.whatsapp ? (
          <div className="flex items-center space-x-1">
            <Phone className="h-3.5 w-3.5 text-green-600" />
            <span className="text-sm">{client.whatsapp}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
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
        <span className="text-sm">
          {format(new Date(client.created_at || ''), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
        </span>
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(client.id)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(client)} className="text-destructive focus:text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
};

export default ClientTableRow;
