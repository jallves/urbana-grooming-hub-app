import React from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Trash2, Mail, MessageCircle, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface PainelClient {
  id: string;
  nome: string;
  email: string | null;
  whatsapp: string;
  data_nascimento: string | null;
  created_at: string;
  updated_at: string;
}

interface ClientTableProps {
  clients: PainelClient[];
  onEdit: (id: string) => void;
  onDelete: (client: PainelClient) => void;
  compact?: boolean;
}

const ClientTable: React.FC<ClientTableProps> = ({ clients, onEdit, onDelete, compact = false }) => {
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
    <div className="rounded-lg border border-border overflow-hidden overflow-x-auto">
      <Table className={cn(compact && 'text-sm')}>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className={cn(
              "font-semibold text-foreground",
              compact ? "px-3 py-2" : "px-4 py-3"
            )}>
              Nome
            </TableHead>
            {/* Email - escondido em tablets compactos */}
            <TableHead className={cn(
              "font-semibold text-foreground",
              compact ? "hidden xl:table-cell px-3 py-2" : "px-4 py-3"
            )}>
              Email
            </TableHead>
            <TableHead className={cn(
              "font-semibold text-foreground",
              compact ? "px-3 py-2" : "px-4 py-3"
            )}>
              WhatsApp
            </TableHead>
            {/* Nascimento - escondido em tablets */}
            <TableHead className={cn(
              "font-semibold text-foreground hidden lg:table-cell",
              compact ? "px-3 py-2" : "px-4 py-3"
            )}>
              Nascimento
            </TableHead>
            {/* Cadastrado em - escondido em tablets */}
            <TableHead className={cn(
              "font-semibold text-foreground hidden xl:table-cell",
              compact ? "px-3 py-2" : "px-4 py-3"
            )}>
              Cadastrado em
            </TableHead>
            <TableHead className={cn(
              "font-semibold text-foreground text-right",
              compact ? "px-3 py-2" : "px-4 py-3"
            )}>
              Ações
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => (
            <TableRow 
              key={client.id}
              className="hover:bg-muted/50 transition-colors"
            >
              <TableCell className={cn(
                "font-medium",
                compact ? "px-3 py-2" : "px-4 py-3"
              )}>
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0",
                    compact ? "w-7 h-7" : "w-8 h-8"
                  )}>
                    <span className={cn(
                      "font-semibold text-primary",
                      compact ? "text-xs" : "text-sm"
                    )}>
                      {client.nome.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="truncate max-w-[120px] lg:max-w-[180px]">{client.nome}</span>
                </div>
              </TableCell>
              {/* Email - escondido em tablets compactos */}
              <TableCell className={cn(
                compact ? "hidden xl:table-cell px-3 py-2" : "px-4 py-3"
              )}>
                {client.email ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate max-w-[150px]">{client.email}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className={compact ? "px-3 py-2" : "px-4 py-3"}>
                <div className="flex items-center gap-2">
                  <MessageCircle className={cn(
                    "text-primary flex-shrink-0",
                    compact ? "h-3.5 w-3.5" : "h-4 w-4"
                  )} />
                  <span className={cn(
                    "font-mono",
                    compact ? "text-xs" : "text-sm"
                  )}>
                    {formatPhone(client.whatsapp)}
                  </span>
                </div>
              </TableCell>
              {/* Nascimento - escondido em tablets */}
              <TableCell className={cn(
                "hidden lg:table-cell",
                compact ? "px-3 py-2" : "px-4 py-3"
              )}>
                {client.data_nascimento ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4 flex-shrink-0" />
                    <span className={compact ? "text-xs" : "text-sm"}>{formatDate(client.data_nascimento)}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              {/* Cadastrado em - escondido em tablets */}
              <TableCell className={cn(
                "hidden xl:table-cell",
                compact ? "px-3 py-2" : "px-4 py-3"
              )}>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-3 w-3 flex-shrink-0" />
                  <span className={compact ? "text-xs" : "text-sm"}>{formatDate(client.created_at)}</span>
                </div>
              </TableCell>
              <TableCell className={cn(
                "text-right",
                compact ? "px-3 py-2" : "px-4 py-3"
              )}>
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(client.id)}
                    className={cn(
                      "p-0 hover:bg-primary/10 hover:text-primary",
                      compact ? "h-7 w-7" : "h-8 w-8"
                    )}
                    title="Editar cliente"
                  >
                    <Edit className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(client)}
                    className={cn(
                      "p-0 text-destructive hover:bg-destructive/10",
                      compact ? "h-7 w-7" : "h-8 w-8"
                    )}
                    title="Excluir cliente"
                  >
                    <Trash2 className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ClientTable;
