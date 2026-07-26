
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Mail, MessageCircle, Calendar, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
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

interface ClientCardProps {
  client: PainelClient;
  onEdit: (id: string) => void;
  onDelete: (client: PainelClient) => void;
  customWhatsappMessage?: string;
}

const ClientCard: React.FC<ClientCardProps> = ({ client, onEdit, onDelete, customWhatsappMessage }) => {
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

  const handleOpenWhatsapp = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = buildClientReengagementWhatsappUrl(client.whatsapp, client.nome, customWhatsappMessage);
    if (!url) {
      toast.error('Cliente sem WhatsApp cadastrado');
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 space-y-3">
        {/* Header: nome + contato + status */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold truncate">{client.nome}</h3>
            <p className="text-xs text-muted-foreground truncate">
              {formatPhone(client.whatsapp) || client.email || '—'}
            </p>
          </div>
          {client.ultimo_agendamento ? (
            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 shrink-0">
              Ativo
            </Badge>
          ) : (
            <Badge variant="outline" className="text-orange-600 border-orange-300 shrink-0">
              Sem agenda
            </Badge>
          )}
        </div>

        {/* Grid de dados */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-muted/50 rounded p-2">
            <div className="text-muted-foreground">Cadastro</div>
            <div className="font-medium">{formatDate(client.created_at)}</div>
          </div>
          <div className="bg-muted/50 rounded p-2">
            <div className="text-muted-foreground">Nascimento</div>
            <div className="font-medium">
              {client.data_nascimento ? formatDate(client.data_nascimento, true) : '—'}
            </div>
          </div>
          <div className="bg-muted/50 rounded p-2 col-span-2">
            <div className="text-muted-foreground">Último agendamento</div>
            <div className="font-medium">
              {client.ultimo_agendamento
                ? formatDate(client.ultimo_agendamento.data, true)
                : 'Nunca agendou'}
            </div>
          </div>
        </div>

        {/* E-mail (se houver) */}
        {client.email && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 rounded p-2">
            <Mail className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{client.email}</span>
          </div>
        )}

        {/* Ações — sticky visual, padrão nas 3 abas */}
        <div className="flex items-center gap-1 pt-1 border-t">
          {client.whatsapp && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleOpenWhatsapp}
              className="h-8 gap-1 text-green-700 hover:bg-green-50 hover:text-green-800 flex-1"
              aria-label="Chamar no WhatsApp"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="text-xs">WhatsApp</span>
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(client.id)}
            className="h-8 w-8 p-0"
            title="Editar cliente"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(client)}
            className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
            title="Excluir cliente"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClientCard;
