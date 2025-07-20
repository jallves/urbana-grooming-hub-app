
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Edit, Trash2, Mail, MessageCircle, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PainelClient {
  id: string;
  nome: string;
  email: string | null;
  whatsapp: string;
  data_nascimento: string | null;
  created_at: string;
  updated_at: string;
}

interface ClientCardProps {
  client: PainelClient;
  onEdit: (id: string) => void;
  onDelete: (client: PainelClient) => void;
}

const ClientCard: React.FC<ClientCardProps> = ({ client, onEdit, onDelete }) => {
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
    <Card className="panel-card-responsive hover:shadow-lg transition-all duration-200 border-gray-700 hover:border-urbana-gold/50">
      <CardContent className="p-4">
        {/* Header do Card */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base text-white truncate mb-1">
              {client.nome}
            </h3>
            <div className="flex items-center gap-2 text-xs text-gray-400">
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
              className="h-8 w-8 p-0 hover:bg-blue-500/10 hover:text-blue-400"
              title="Editar cliente"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(client)}
              className="h-8 w-8 p-0 hover:bg-red-500/10 hover:text-red-400"
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
            <div className="flex items-center gap-3 p-2 bg-gray-800/50 rounded-lg">
              <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-300 truncate">
                {client.email}
              </span>
            </div>
          )}
          
          {/* WhatsApp */}
          <div className="flex items-center gap-3 p-2 bg-gray-800/50 rounded-lg">
            <MessageCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
            <span className="text-sm text-gray-300 font-mono">
              {formatPhone(client.whatsapp)}
            </span>
          </div>
          
          {/* Data de Nascimento */}
          {client.data_nascimento && (
            <div className="flex items-center gap-3 p-2 bg-gray-800/50 rounded-lg">
              <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-300">
                Nascimento: {formatDate(client.data_nascimento)}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ClientCard;
