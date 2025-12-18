import React from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Trash2, Mail, MessageCircle, Calendar, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
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
  const formatDate = (dateString: string | null, isDateOnly = false) => {
    if (!dateString) return '-';
    try {
      // Para datas apenas (YYYY-MM-DD), usar parseISO para evitar problemas de timezone
      const date = isDateOnly ? parseISO(dateString) : new Date(dateString);
      return format(date, 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return '-';
    }
  };

  const formatPhone = (phone: string | null) => {
    if (!phone) return '-';
    return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table className={cn(compact && 'text-sm')}>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className={cn(
              "font-semibold text-foreground w-[180px] lg:w-[220px]",
              compact ? "px-3 py-2" : "px-4 py-3"
            )}>
              Nome
            </TableHead>
            <TableHead className={cn(
              "font-semibold text-foreground min-w-[200px]",
              compact ? "px-3 py-2" : "px-4 py-3"
            )}>
              Email
            </TableHead>
            <TableHead className={cn(
              "font-semibold text-foreground w-[150px]",
              compact ? "px-3 py-2" : "px-4 py-3"
            )}>
              WhatsApp
            </TableHead>
            <TableHead className={cn(
              "font-semibold text-foreground hidden lg:table-cell w-[120px]",
              compact ? "px-3 py-2" : "px-4 py-3"
            )}>
              Nascimento
            </TableHead>
            <TableHead className={cn(
              "font-semibold text-foreground hidden xl:table-cell w-[120px]",
              compact ? "px-3 py-2" : "px-4 py-3"
            )}>
              Cadastro
            </TableHead>
            <TableHead className={cn(
              "font-semibold text-foreground text-right w-[100px]",
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
                  <span className="truncate max-w-[140px] lg:max-w-[180px]" title={client.nome}>
                    {client.nome}
                  </span>
                </div>
              </TableCell>
              <TableCell className={compact ? "px-3 py-2" : "px-4 py-3"}>
                {client.email ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4 flex-shrink-0 text-primary/60" />
                    <a 
                      href={`mailto:${client.email}`}
                      className="text-foreground hover:text-primary hover:underline transition-colors break-all"
                      title={client.email}
                    >
                      {client.email}
                    </a>
                  </div>
                ) : (
                  <span className="text-muted-foreground italic">Não informado</span>
                )}
              </TableCell>
              <TableCell className={compact ? "px-3 py-2" : "px-4 py-3"}>
                <div className="flex items-center gap-2">
                  <MessageCircle className={cn(
                    "text-green-600 flex-shrink-0",
                    compact ? "h-3.5 w-3.5" : "h-4 w-4"
                  )} />
                  <a 
                    href={`https://wa.me/55${client.whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "font-mono hover:text-green-600 hover:underline transition-colors",
                      compact ? "text-xs" : "text-sm"
                    )}
                  >
                    {formatPhone(client.whatsapp)}
                  </a>
                </div>
              </TableCell>
              <TableCell className={cn(
                "hidden lg:table-cell",
                compact ? "px-3 py-2" : "px-4 py-3"
              )}>
                {client.data_nascimento ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4 flex-shrink-0" />
                    <span className={compact ? "text-xs" : "text-sm"}>{formatDate(client.data_nascimento, true)}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground italic text-sm">-</span>
                )}
              </TableCell>
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
