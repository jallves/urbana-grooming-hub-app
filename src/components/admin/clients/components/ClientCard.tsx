
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
    <Card className="panel-card-responsive hover:shadow-lg transition-all duration-200">
      <CardContent className="p-4">
        {/* Header do Card */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base truncate mb-1">
              {client.nome}
            </h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Cadastrado em {formatDate(client.created_at)}</span>
            </div>
          </div>
          
          {/* Ações */}
          <div className="flex gap-1 ml-2">
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
        </div>

        {/* Informações do Cliente */}
        <div className="space-y-3">
          {/* Email */}
          {client.email && (
            <div className="flex items-center gap-3 p-2 bg-muted rounded-lg">
              <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm truncate">
                {client.email}
              </span>
            </div>
          )}
          
          {/* WhatsApp */}
          <div className="flex items-center gap-3 p-2 bg-muted rounded-lg">
            <MessageCircle className="h-4 w-4 text-primary flex-shrink-0" />
            <span className="text-sm font-mono flex-1 truncate">
              {formatPhone(client.whatsapp)}
            </span>
            {client.whatsapp && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleOpenWhatsapp}
                className="h-8 w-8 p-0 text-green-600 hover:bg-green-100 hover:text-green-700 ml-auto flex-shrink-0"
                title="Chamar no WhatsApp"
                aria-label="Chamar no WhatsApp"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                  <path d="M20.52 3.48A11.86 11.86 0 0 0 12.04 0C5.5 0 .2 5.3.2 11.84c0 2.09.55 4.13 1.6 5.93L0 24l6.4-1.68a11.83 11.83 0 0 0 5.64 1.44h.01c6.54 0 11.84-5.3 11.84-11.84 0-3.16-1.23-6.13-3.37-8.44ZM12.05 21.3h-.01a9.45 9.45 0 0 1-4.82-1.32l-.34-.2-3.8 1 .99-3.7-.22-.38a9.43 9.43 0 1 1 8.2 4.6Zm5.46-7.08c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.22 3.08.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.34Z"/>
                </svg>
              </Button>
            )}
          </div>
          
          {/* Data de Nascimento */}
          {client.data_nascimento && (
            <div className="flex items-center gap-3 p-2 bg-muted rounded-lg">
              <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm">
                Nascimento: {formatDate(client.data_nascimento, true)}
              </span>
            </div>
          )}

          {/* Último Agendamento */}
          <div className="flex items-center gap-3 p-2 bg-muted rounded-lg">
            <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-sm">
              Último agendamento: {client.ultimo_agendamento 
                ? formatDate(client.ultimo_agendamento.data, true) 
                : 'Nunca'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClientCard;
