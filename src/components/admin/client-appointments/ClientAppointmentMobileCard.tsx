import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { MoreHorizontal, Edit, Trash2, CheckCircle, Calendar, Clock, X, UserX } from 'lucide-react';
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
import { isPastInBrazil } from '@/lib/brazilTimezone';

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
    email: string | null;
    whatsapp: string | null;
  } | null;
  painel_barbeiros: {
    nome: string;
    email: string | null;
    telefone: string | null;
    image_url: string | null;
    specialties: string[] | null;
    experience: string | null;
    commission_rate: number | null;
    is_active: boolean | null;
    role: string | null;
    staff_id: string | null;
  } | null;
  painel_servicos: {
    nome: string;
    preco: number;
    duracao: number;
  } | null;
  // CORRIGIDO: Usar appointment_totem_sessions (tabela correta)
  appointment_totem_sessions?: Array<{
    totem_session_id: string | null;
    status: string | null;
    totem_sessions: {
      id: string;
      created_at: string | null;
    } | null;
  }>;
  vendas?: Array<{
    id: string;
    status: string | null;
  }>;
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
  const [isAbsentDialogOpen, setIsAbsentDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);

  // LEI PÉTREA: Determinar status didático do agendamento (ALINHADO com ClientAppointmentCompactRow)
  const getActualStatus = () => {
    const statusLower = appointment.status?.toLowerCase() || '';
    
    // PRIORIDADE 1: Status finais do banco (concluido, ausente, cancelado)
    if (statusLower === 'concluido') {
      return 'concluido';
    }
    
    if (statusLower === 'ausente') {
      return 'ausente';
    }
    
    if (statusLower === 'cancelado') {
      return 'cancelado';
    }

    // PRIORIDADE 2: Verificar venda paga (checkout foi feito pelo Totem)
    const hasPaidSale = appointment.vendas && 
      Array.isArray(appointment.vendas) &&
      appointment.vendas.some((v: any) => v.status === 'pago');
    
    if (hasPaidSale) {
      return 'concluido';
    }

    // PRIORIDADE 3: Status baseado em appointment_totem_sessions (check-in/check-out)
    const hasCheckIn = appointment.appointment_totem_sessions && 
      Array.isArray(appointment.appointment_totem_sessions) &&
      appointment.appointment_totem_sessions.length > 0;
    
    const hasCheckOut = hasCheckIn && 
      appointment.appointment_totem_sessions?.some((s: any) => 
        s.status === 'completed' || s.status === 'checkout_completed'
      );

    // 3 ESTADOS AUTOMÁTICOS:
    // 1. Cliente agendou, não fez check-in ainda
    if (!hasCheckIn) {
      return 'agendado'; // "Agendado / Check-in Pendente"
    }

    // 2. Cliente fez check-in, mas não fez checkout ainda
    if (hasCheckIn && !hasCheckOut) {
      return 'check_in_finalizado'; // "Check-in Finalizado / Checkout Pendente"
    }

    // 3. Cliente fez checkout (processo completo)
    if (hasCheckIn && hasCheckOut) {
      return 'concluido'; // "Concluído"
    }

    // Fallback
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
      'ausente': {
        label: 'Ausente',
        sublabel: 'Não Compareceu',
        className: 'bg-gray-100 text-gray-700 border-gray-300',
        icon: '👻'
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
    // CORRIGIDO: Usar appointment_totem_sessions
    const hasCheckIn = appointment.appointment_totem_sessions && 
      Array.isArray(appointment.appointment_totem_sessions) &&
      appointment.appointment_totem_sessions.length > 0;
    
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

  // Verificar se pode marcar como ausente (horário já passou e status apropriado)
  const canMarkAsAbsent = () => {
    const currentStatus = actualStatus;
    
    // Só pode marcar como ausente se status for agendado ou check_in_finalizado
    if (currentStatus !== 'agendado' && currentStatus !== 'check_in_finalizado') {
      return false;
    }

    // Verificar se o horário já passou (usando timezone do Brasil)
    try {
      const appointmentDateTime = `${appointment.data}T${appointment.hora}`;
      return isPastInBrazil(appointmentDateTime);
    } catch (error) {
      console.error('Erro ao validar horário para ausente:', error);
      return false;
    }
  };

  const handleAbsentClick = () => {
    setIsAbsentDialogOpen(true);
  };

  const handleConfirmAbsent = () => {
    onStatusChange(appointment.id, 'ausente');
    setIsAbsentDialogOpen(false);
    toast.warning('Cliente marcado como ausente', {
      description: 'Este agendamento não gerará receita ou comissão.'
    });
  };

  const getDeleteBlockedReason = () => {
    // CORRIGIDO: Usar appointment_totem_sessions
    const hasCheckIn = appointment.appointment_totem_sessions && 
      Array.isArray(appointment.appointment_totem_sessions) &&
      appointment.appointment_totem_sessions.length > 0;
    
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
                  onClick={() => setIsCancelDialogOpen(true)}
                >
                  <X className="mr-3 h-4 w-4" />
                  <span className="text-sm font-medium">Cancelar</span>
                </DropdownMenuItem>
              )}

              {canMarkAsAbsent() && (
                <DropdownMenuItem
                  className="cursor-pointer text-gray-700 py-2.5"
                  onClick={handleAbsentClick}
                >
                  <UserX className="mr-3 h-4 w-4" />
                  <span className="text-sm font-medium">Marcar Ausente</span>
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

      {/* Dialog de Cancelamento */}
      <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <AlertDialogContent className="bg-white border-2 border-gray-200 shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-orange-600 font-bold text-xl flex items-center gap-2">
              ⚠️ Confirmar Cancelamento
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4 pt-2">
              <p className="text-base text-gray-900">
                Você está prestes a cancelar o agendamento de{' '}
                <strong className="text-orange-600">{appointment.painel_clientes?.nome}</strong>
              </p>
              
              <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded-r">
                <p className="text-sm text-orange-800 font-medium mb-2">
                  📋 Detalhes do Agendamento:
                </p>
                <ul className="text-sm text-orange-700 space-y-1">
                  <li><strong>Serviço:</strong> {appointment.painel_servicos?.nome}</li>
                  <li><strong>Data:</strong> {format(parseISO(appointment.data + 'T00:00:00'), 'dd/MM/yyyy')} às {appointment.hora}</li>
                  <li><strong>Barbeiro:</strong> {appointment.painel_barbeiros?.nome}</li>
                </ul>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r">
                <p className="text-sm text-blue-800">
                  ℹ️ <strong>Importante:</strong> O agendamento será marcado como cancelado e mantido no histórico do sistema para fins de auditoria.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200">
              Voltar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onStatusChange(appointment.id, 'cancelado');
                setIsCancelDialogOpen(false);
              }}
              className="bg-orange-600 hover:bg-orange-700 text-white font-semibold"
            >
              Confirmar Cancelamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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

      {/* Dialog de Marcar como Ausente */}
      <AlertDialog open={isAbsentDialogOpen} onOpenChange={setIsAbsentDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-700 font-bold">👻 Marcar Cliente como Ausente</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p className="font-semibold text-gray-900">
                Marcar <strong className="text-gray-700">{appointment.painel_clientes?.nome}</strong> como ausente?
              </p>
              
              <div className="bg-gray-50 border-l-4 border-gray-400 p-3 rounded">
                <p className="text-sm text-gray-800 font-medium mb-2">📋 Detalhes:</p>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li><strong>Serviço:</strong> {appointment.painel_servicos?.nome}</li>
                  <li><strong>Data:</strong> {format(parseISO(appointment.data + 'T00:00:00'), 'dd/MM/yyyy')} às {appointment.hora}</li>
                  <li><strong>Valor:</strong> R$ {appointment.painel_servicos?.preco?.toFixed(2)}</li>
                </ul>
              </div>

              <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded">
                <p className="text-sm text-red-800">
                  ⚠️ <strong>Atenção:</strong> Este agendamento <strong>NÃO gerará receita nem comissão</strong>.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAbsent}
              className="bg-gray-600 hover:bg-gray-700"
            >
              Confirmar Ausência
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ClientAppointmentMobileCard;
