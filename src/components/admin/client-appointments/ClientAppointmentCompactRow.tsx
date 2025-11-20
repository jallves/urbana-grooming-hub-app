import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { MoreHorizontal, Edit, Clock, X } from 'lucide-react';
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
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);

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
      'cancelado': {
        label: 'Cancelado',
        sublabel: null,
        className: 'bg-red-100 text-red-700 border-red-300 hover:bg-red-200',
        icon: '❌'
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

  // Verificar se pode cancelar (Lei Pétrea: apenas 'agendado' e 'check_in_finalizado')
  const canCancel = () => {
    const currentStatus = actualStatus;
    return currentStatus === 'agendado' || currentStatus === 'check_in_finalizado';
  };

  const handleCancelClick = () => {
    setIsCancelDialogOpen(true);
  };

  const handleConfirmCancel = () => {
    onStatusChange(appointment.id, 'cancelado');
    setIsCancelDialogOpen(false);
    toast.success('Agendamento cancelado', {
      description: 'O agendamento foi cancelado com sucesso.'
    });
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

            {canCancel() && (
              <DropdownMenuItem
                className="cursor-pointer hover:bg-orange-50 focus:bg-orange-50 text-orange-600 py-2.5"
                onClick={handleCancelClick}
              >
                <X className="mr-3 h-4 w-4" />
                <span className="text-sm font-medium">Cancelar Agendamento</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

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
                onClick={handleConfirmCancel}
                className="bg-orange-600 hover:bg-orange-700 text-white font-semibold"
              >
                Confirmar Cancelamento
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </TableCell>
    </TableRow>
  );
};

export default ClientAppointmentCompactRow;
