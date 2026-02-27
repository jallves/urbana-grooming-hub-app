
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Edit, Trash2, Mail, MessageCircle, Calendar, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
}

const ClientCard: React.FC<ClientCardProps> = ({ client, onEdit, onDelete }) => {
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
            <span className="text-sm font-mono">
              {formatPhone(client.whatsapp)}
            </span>
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
