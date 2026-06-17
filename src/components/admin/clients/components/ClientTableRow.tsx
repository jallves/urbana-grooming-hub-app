
import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Mail, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { buildClientReengagementWhatsappUrl } from '@/lib/whatsappGreeting';
import { toast } from 'sonner';

interface PainelClient {
  id: string;
  nome: string;
  email: string | null;
  whatsapp: string;
  data_nascimento: string | null;
  created_at: string;
  updated_at: string;
  ultimo_agendamento: { data: string; hora: string; status: string | null } | null;
}

interface ClientTableRowProps {
  client: PainelClient;
  onEdit: (id: string) => void;
  onDelete: (client: PainelClient) => void;
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

  const handleOpenWhatsapp = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = buildClientReengagementWhatsappUrl(client.whatsapp, client.nome);
    if (!url) {
      toast.error('Cliente sem WhatsApp cadastrado');
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <TableRow className="hover:bg-gray-50 transition-colors border-b border-gray-100">
      {/* Nome - sempre visível com informações empilhadas no mobile */}
      <TableCell className="font-medium text-sm px-4 py-3">
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-gray-900 truncate">
            {client.nome}
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
      
      {/* WhatsApp - sempre visível */}
      <TableCell className="text-sm px-4 py-3">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
          <span className="text-gray-700 font-mono text-sm">
            {formatPhone(client.whatsapp)}
          </span>
          {client.whatsapp && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleOpenWhatsapp}
              className="h-7 w-7 p-0 text-green-600 hover:bg-green-50 hover:text-green-700 transition-colors"
              title="Chamar no WhatsApp"
              aria-label="Chamar no WhatsApp"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                <path d="M20.52 3.48A11.86 11.86 0 0 0 12.04 0C5.5 0 .2 5.3.2 11.84c0 2.09.55 4.13 1.6 5.93L0 24l6.4-1.68a11.83 11.83 0 0 0 5.64 1.44h.01c6.54 0 11.84-5.3 11.84-11.84 0-3.16-1.23-6.13-3.37-8.44ZM12.05 21.3h-.01a9.45 9.45 0 0 1-4.82-1.32l-.34-.2-3.8 1 .99-3.7-.22-.38a9.43 9.43 0 1 1 8.2 4.6Zm5.46-7.08c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.22 3.08.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.34Z"/>
              </svg>
            </Button>
          )}
        </div>
      </TableCell>
      
      {/* Data de Nascimento - oculto até desktop */}
      <TableCell className="text-sm px-4 py-3 hidden lg:table-cell text-gray-700">
        {formatDate(client.data_nascimento)}
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
