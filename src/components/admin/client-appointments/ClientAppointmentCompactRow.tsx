import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { MoreHorizontal, Edit, Trash2, Clock } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
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

interface ClientAppointmentCompactRowProps {
  appointment: PainelAgendamento;
  onEdit: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}

const ClientAppointmentCompactRow: React.FC<ClientAppointmentCompactRowProps> = ({
  appointment,
  onEdit,
  onStatusChange,
  onDelete
}) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // LEI PÉTREA: Determinar status didático do agendamento
  const getActualStatus = () => {
    const hasCheckIn = appointment.totem_sessions && 
      appointment.totem_sessions.some((s: any) => s.check_in_time);
    
    const hasCheckOut = appointment.totem_sessions && 
      appointment.totem_sessions.some((s: any) => s.check_out_time);

    // 3 ESTADOS ÚNICOS E IMUTÁVEIS:
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

    // Fallback (nunca deve acontecer)
    return 'agendado';
  };

  const actualStatus = getActualStatus();

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'agendado': { 
        label: 'Agendado',
        sublabel: 'Check-in Pendente',
        className: 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200',
        icon: '📅'
      },
      'check_in_finalizado': {
        label: 'Check-in Finalizado',
        sublabel: 'Checkout Pendente',
        className: 'bg-orange-100 text-orange-700 border-orange-300 hover:bg-orange-200',
        icon: '✅'
      },
      'concluido': { 
        label: 'Concluído',
        sublabel: null,
        className: 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200',
        icon: '🎉'
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.agendado;
    return (
      <Badge className={`text-xs font-semibold px-3 py-1.5 border ${config.className} transition-colors duration-200`}>
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

  // Verificar se pode deletar
  const canDelete = () => {
    const hasCheckIn = appointment.totem_sessions && 
      appointment.totem_sessions.some((s: any) => s.check_in_time);
    
    const hasSales = appointment.vendas && appointment.vendas.length > 0;
    
    const statusUpper = appointment.status?.toUpperCase() || '';
    const isFinalized = statusUpper === 'FINALIZADO' || statusUpper === 'CONCLUIDO';

    return !hasCheckIn && !hasSales && !isFinalized;
  };

  const getDeleteBlockedReason = () => {
    const hasCheckIn = appointment.totem_sessions && 
      appointment.totem_sessions.some((s: any) => s.check_in_time);
    
    const hasSales = appointment.vendas && appointment.vendas.length > 0;
    
    const statusUpper = appointment.status?.toUpperCase() || '';
    const isFinalized = statusUpper === 'FINALIZADO' || statusUpper === 'CONCLUIDO';

    if (hasCheckIn) return 'Este agendamento possui check-in realizado e não pode ser excluído.';
    if (hasSales) return 'Este agendamento possui vendas associadas e não pode ser excluído.';
    if (isFinalized) return 'Este agendamento está finalizado/concluído e não pode ser excluído.';
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
    <TableRow className="hover:bg-gray-50 transition-colors duration-150">
      <TableCell className="py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-urbana-gold to-yellow-600 flex items-center justify-center text-white font-bold text-sm">
            {appointment.painel_clientes?.nome?.charAt(0)?.toUpperCase() || 'C'}
          </div>
          <div>
            <div className="font-semibold text-sm text-gray-900">
              {appointment.painel_clientes?.nome || 'Nome não encontrado'}
            </div>
            <div className="text-xs text-gray-500">{appointment.painel_clientes?.whatsapp}</div>
          </div>
        </div>
      </TableCell>

      <TableCell className="py-4 hidden sm:table-cell">
        <div className="flex flex-col gap-1">
          <div className="text-sm font-medium text-gray-900">
            {format(parseISO(appointment.data + 'T00:00:00'), 'dd/MM/yyyy')}
          </div>
          <div className="text-xs text-gray-500 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {appointment.hora}
          </div>
        </div>
      </TableCell>

      <TableCell className="py-4 hidden md:table-cell">
        <div className="flex flex-col gap-1">
          <div className="text-sm font-medium text-gray-900">
            {appointment.painel_servicos?.nome || 'N/A'}
          </div>
          <div className="text-xs font-semibold text-green-600">
            R$ {appointment.painel_servicos?.preco?.toFixed(2) || '0,00'}
          </div>
        </div>
      </TableCell>

      <TableCell className="py-4 hidden lg:table-cell">
        <div className="flex items-center gap-2">
          {appointment.painel_barbeiros?.image_url && (
            <img 
              src={appointment.painel_barbeiros.image_url} 
              alt={appointment.painel_barbeiros.nome}
              className="w-8 h-8 rounded-full object-cover border-2 border-gray-200"
            />
          )}
          <span className="text-sm font-medium text-gray-900">
            {appointment.painel_barbeiros?.nome || 'N/A'}
          </span>
        </div>
      </TableCell>

      <TableCell className="py-4">
        {getStatusBadge(actualStatus)}
      </TableCell>

      <TableCell className="text-right py-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0 hover:bg-gray-100 rounded-lg transition-colors">
              <MoreHorizontal className="h-5 w-5 text-gray-600" />
              <span className="sr-only">Abrir menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-white border-gray-200 shadow-lg">
            <DropdownMenuItem 
              onClick={() => onEdit(appointment.id)}
              className="cursor-pointer hover:bg-gray-50 focus:bg-gray-50 py-2.5"
            >
              <Edit className="mr-3 h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium">Editar Agendamento</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              className={`cursor-pointer py-2.5 ${canDelete() ? 'hover:bg-red-50 focus:bg-red-50 text-red-600' : 'opacity-50 cursor-not-allowed text-gray-400'}`}
              onClick={handleDeleteClick}
              disabled={!canDelete()}
            >
              <Trash2 className="mr-3 h-4 w-4" />
              <span className="text-sm font-medium">Excluir Permanentemente</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-red-600 font-bold">⚠️ Confirmar Exclusão Permanente</AlertDialogTitle>
              <AlertDialogDescription className="space-y-3">
                <p className="font-semibold text-gray-900">
                  Você está prestes a excluir permanentemente o agendamento de{' '}
                  <strong className="text-red-600">{appointment.painel_clientes?.nome}</strong>
                </p>
                
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
                  <p className="text-sm text-yellow-800 font-medium">
                    <strong>ATENÇÃO:</strong> Esta ação é irreversível e pode:
                  </p>
                  <ul className="text-xs text-yellow-700 mt-2 ml-4 space-y-1 list-disc">
                    <li>Comprometer a integridade dos registros administrativos</li>
                    <li>Dificultar auditorias e relatórios financeiros</li>
                    <li>Causar inconsistências no histórico de atendimentos</li>
                  </ul>
                </div>

                <p className="text-sm text-gray-700 font-medium">
                  💡 <strong>Recomendação:</strong> Em vez de excluir, considere <strong>cancelar</strong> o agendamento para manter o histórico.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-green-50 text-green-700 border-green-300 hover:bg-green-100">
                Cancelar (Recomendado)
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  onDelete(appointment.id);
                  setIsDeleteDialogOpen(false);
                }}
                className="bg-red-600 hover:bg-red-700 text-white font-bold"
              >
                Excluir Permanentemente
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </TableCell>
    </TableRow>
  );
};

export default ClientAppointmentCompactRow;
