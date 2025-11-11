import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { MoreHorizontal, Edit, Trash2, CheckCircle, Calendar, Clock, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';

interface PainelAgendamento {
  id: string;
  cliente_id: string;
  barbeiro_id: string;
  servico_id: string;
  data: string;
  hora: string;
  status: string;
  status_totem: string | null;
  created_at: string;
  updated_at: string;
  painel_clientes: {
    nome: string;
    email: string;
    whatsapp: string;
  };
  painel_barbeiros: {
    nome: string;
    email: string;
    telefone: string;
    image_url: string;
    specialties: string;
    experience: string;
    commission_rate: number;
    is_active: boolean;
    role: string;
    staff_id: string;
  };
  painel_servicos: {
    nome: string;
    preco: number;
    duracao: number;
  };
  totem_sessions?: {
    check_in_time: string | null;
    check_out_time: string | null;
    status: string;
  }[];
  vendas?: {
    id: string;
    status: string;
  }[];
}

interface ClientAppointmentMobileCardProps {
  appointment: PainelAgendamento;
  onEdit: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}

const ClientAppointmentMobileCard: React.FC<ClientAppointmentMobileCardProps> = ({
  appointment,
  onEdit,
  onStatusChange,
  onDelete
}) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // LEI PÉTREA: Determinar status didático do agendamento
  const getActualStatus = () => {
    // Verificar se foi cancelado manualmente
    const statusUpper = appointment.status?.toUpperCase() || '';
    if (statusUpper === 'CANCELADO') {
      return 'cancelado';
    }

    const hasCheckIn = appointment.totem_sessions && 
      appointment.totem_sessions.some((s: any) => s.check_in_time);
    
    const hasCheckOut = appointment.totem_sessions && 
      appointment.totem_sessions.some((s: any) => s.check_out_time);

    // 3 ESTADOS AUTOMÁTICOS:
    if (!hasCheckIn) {
      return 'agendado';
    }

    if (hasCheckIn && !hasCheckOut) {
      return 'check_in_finalizado';
    }

    if (hasCheckIn && hasCheckOut) {
      return 'concluido';
    }

    return 'agendado';
  };

  const actualStatus = getActualStatus();

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'agendado': { 
        label: 'Agendado',
        sublabel: 'Check-in Pendente',
        className: 'bg-blue-100 text-blue-700 border-blue-300',
        icon: '📅'
      },
      'check_in_finalizado': {
        label: 'Check-in Finalizado',
        sublabel: 'Checkout Pendente',
        className: 'bg-orange-100 text-orange-700 border-orange-300',
        icon: '✅'
      },
      'concluido': { 
        label: 'Concluído',
        sublabel: null,
        className: 'bg-green-100 text-green-700 border-green-300',
        icon: '🎉'
      },
      'cancelado': {
        label: 'Cancelado',
        sublabel: null,
        className: 'bg-red-100 text-red-700 border-red-300',
        icon: '❌'
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.agendado;
    return (
      <Badge className={`text-xs font-semibold px-3 py-1.5 border ${config.className}`}>
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1">
            <span>{config.icon}</span>
            <span>{config.label}</span>
          </div>
          {config.sublabel && (
            <span className="text-[10px] font-normal opacity-80">{config.sublabel}</span>
          )}
        </div>
      </Badge>
    );
  };

  // Verificar se o agendamento pode ser excluído
  const canDelete = () => {
    const hasCheckIn = appointment.totem_sessions && 
      appointment.totem_sessions.some((s: any) => s.check_in_time);
    
    const hasSales = appointment.vendas && appointment.vendas.length > 0;
    
    const statusUpper = appointment.status?.toUpperCase() || '';
    const isFinalized = statusUpper === 'FINALIZADO' || statusUpper === 'CONCLUIDO';
    const isCancelled = statusUpper === 'CANCELADO';

    return !hasCheckIn && !hasSales && !isFinalized && !isCancelled;
  };

  // Verificar se pode cancelar
  const canCancel = () => {
    const currentStatus = actualStatus;
    return currentStatus === 'agendado' || currentStatus === 'check_in_finalizado';
  };

  const getDeleteBlockedReason = () => {
    const hasCheckIn = appointment.totem_sessions && 
      appointment.totem_sessions.some((s: any) => s.check_in_time);
    
    const hasSales = appointment.vendas && appointment.vendas.length > 0;
    
    const statusUpper = appointment.status?.toUpperCase() || '';
    const isFinalized = statusUpper === 'FINALIZADO' || statusUpper === 'CONCLUIDO';
    const isCancelled = statusUpper === 'CANCELADO';

    if (hasCheckIn) return 'Este agendamento possui check-in realizado e não pode ser excluído.';
    if (hasSales) return 'Este agendamento possui vendas associadas e não pode ser excluído.';
    if (isFinalized) return 'Este agendamento está finalizado/concluído e não pode ser excluído.';
    if (isCancelled) return 'Agendamentos cancelados devem ser mantidos para auditoria.';
    return null;
  };

  const handleDeleteClick = () => {
    if (!canDelete()) {
      toast.error('Não é possível excluir', {
        description: getDeleteBlockedReason()
      });
      return;
    }
    setIsDeleteDialogOpen(true);
  };

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-urbana-gold to-yellow-600 flex items-center justify-center text-white font-bold text-base flex-shrink-0">
              {appointment.painel_clientes?.nome?.charAt(0)?.toUpperCase() || 'C'}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-base text-gray-900 truncate">
                {appointment.painel_clientes?.nome || 'Nome não encontrado'}
              </h4>
              <p className="text-xs text-gray-500">{appointment.painel_clientes?.whatsapp}</p>
            </div>
          </div>
          {getStatusBadge(actualStatus)}
        </div>

        <div className="space-y-2 bg-gray-50 rounded-lg p-3 mb-3">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span className="font-medium text-gray-900">{format(parseISO(appointment.data + 'T00:00:00'), 'dd/MM/yyyy')}</span>
            <Clock className="h-4 w-4 text-gray-400 ml-2 flex-shrink-0" />
            <span className="font-medium text-gray-900">{appointment.hora}</span>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <CheckCircle className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-medium text-gray-900">{appointment.painel_servicos?.nome || 'N/A'}</span>
              <span className="ml-2 font-bold text-green-600">
                R$ {appointment.painel_servicos?.preco?.toFixed(2) || '0,00'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            {appointment.painel_barbeiros?.image_url && (
              <img 
                src={appointment.painel_barbeiros.image_url} 
                alt={appointment.painel_barbeiros.nome}
                className="w-6 h-6 rounded-full object-cover border border-gray-200"
              />
            )}
            <span className="font-medium truncate">{appointment.painel_barbeiros?.nome || 'N/A'}</span>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-lg">
                <MoreHorizontal className="h-5 w-5 text-gray-600" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem 
                onClick={() => onEdit(appointment.id)}
                className="cursor-pointer py-2.5"
              >
                <Edit className="mr-3 h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium">Editar</span>
              </DropdownMenuItem>

              {canCancel() && (
                <DropdownMenuItem
                  className="cursor-pointer text-orange-600 py-2.5"
                  onClick={() => {
                    if (window.confirm('Tem certeza que deseja cancelar este agendamento?')) {
                      onStatusChange(appointment.id, 'cancelado');
                    }
                  }}
                >
                  <X className="mr-3 h-4 w-4" />
                  <span className="text-sm font-medium">Cancelar</span>
                </DropdownMenuItem>
              )}

              <DropdownMenuItem
                className={`cursor-pointer py-2.5 ${canDelete() ? 'text-red-600' : 'opacity-50 cursor-not-allowed text-gray-400'}`}
                onClick={handleDeleteClick}
                disabled={!canDelete()}
              >
                <Trash2 className="mr-3 h-4 w-4" />
                <span className="text-sm font-medium">Excluir</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 font-bold">⚠️ Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p className="font-semibold text-gray-900">
                Excluir agendamento de <strong className="text-red-600">{appointment.painel_clientes?.nome}</strong>?
              </p>
              
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
                <p className="text-sm text-yellow-800 font-medium">
                  <strong>ATENÇÃO:</strong> Esta ação é irreversível
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete(appointment.id);
                setIsDeleteDialogOpen(false);
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ClientAppointmentMobileCard;
