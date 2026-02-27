import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { MoreHorizontal, Edit, Check, X, Trash2, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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

interface PainelAgendamento {
  id: string;
  cliente_id: string;
  barbeiro_id: string;
  servico_id: string;
  data: string;
  hora: string;
  status: string;
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
}

interface ClientAppointmentRowProps {
  appointment: PainelAgendamento;
  onEdit: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}

const ClientAppointmentRow: React.FC<ClientAppointmentRowProps> = ({ 
  appointment, 
  onEdit, 
  onStatusChange, 
  onDelete 
}) => {
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'confirmado': { variant: 'default' as const, label: 'Confirmado' },
      'concluido': { variant: 'outline' as const, label: 'Concluído' },
      'cancelado': { variant: 'destructive' as const, label: 'Cancelado' },
      'agendado': { variant: 'outline' as const, label: 'Agendado' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.confirmado;
    return <Badge variant={config.variant} className="text-[10px] sm:text-xs">{config.label}</Badge>;
  };

  return (
    <TableRow className="text-xs sm:text-sm">
      <TableCell className="font-medium px-2 sm:px-4 py-2 sm:py-3 max-w-[100px] sm:max-w-none">
        <div className="flex flex-col space-y-1 truncate">
          <span className="truncate">
            {appointment.painel_clientes?.nome || 'Nome não encontrado'}
          </span>
          <div className="sm:hidden text-[10px] text-muted-foreground space-y-0.5 truncate">
            <div>{appointment.painel_clientes?.whatsapp || 'N/A'}</div>
            <div className="md:hidden truncate">{appointment.painel_servicos?.nome || 'Serviço N/A'}</div>
            <div className="lg:hidden truncate">{appointment.painel_barbeiros?.nome || 'Barbeiro N/A'}</div>
          </div>
        </div>
      </TableCell>

      <TableCell className="px-2 sm:px-4 py-2 sm:py-3 hidden sm:table-cell max-w-[120px] truncate">
        <span className="truncate">
          {appointment.painel_clientes?.whatsapp || 'Não informado'}
        </span>
      </TableCell>

      <TableCell className="px-2 sm:px-4 py-2 sm:py-3 max-w-[70px] truncate">
        <div className="text-[10px] sm:text-xs truncate">
          {format(parseISO(appointment.data), 'dd/MM')}
          <div className="sm:hidden text-[9px] text-muted-foreground truncate">
            {format(parseISO(appointment.data), 'yyyy')}
          </div>
        </div>
      </TableCell>

      <TableCell className="px-2 sm:px-4 py-2 sm:py-3 max-w-[50px] truncate">
        <div className="text-[10px] sm:text-xs truncate">
          {appointment.hora}
        </div>
      </TableCell>

      <TableCell className="px-2 sm:px-4 py-2 sm:py-3 hidden md:table-cell max-w-[150px] truncate">
        <span className="truncate block">
          {appointment.painel_servicos?.nome || 'Serviço não encontrado'}
        </span>
      </TableCell>

      <TableCell className="px-2 sm:px-4 py-2 sm:py-3 hidden lg:table-cell max-w-[120px] truncate">
        <span className="truncate block">
          {appointment.painel_barbeiros?.nome || 'Barbeiro não encontrado'}
        </span>
      </TableCell>

      <TableCell className="px-2 sm:px-4 py-2 sm:py-3 max-w-[90px] whitespace-nowrap">
        {getStatusBadge(appointment.status)}
      </TableCell>

      <TableCell className="text-right px-2 sm:px-4 py-2 sm:py-3 max-w-[60px] whitespace-nowrap">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 sm:h-8 sm:w-8">
              <MoreHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="sr-only">Abrir menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => onEdit(appointment.id)}>
              <Edit className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm">Editar</span>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            {appointment.status !== 'agendado' && (
              <DropdownMenuItem onClick={() => onStatusChange(appointment.id, 'agendado')}>
                <Clock className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">Marcar como Agendado</span>
              </DropdownMenuItem>
            )}
            
            {appointment.status !== 'confirmado' && (
              <DropdownMenuItem onClick={() => onStatusChange(appointment.id, 'confirmado')}>
                <Check className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">Confirmar</span>
              </DropdownMenuItem>
            )}
            
            {appointment.status !== 'concluido' && (
              <DropdownMenuItem onClick={() => onStatusChange(appointment.id, 'concluido')}>
                <CheckCircle className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">Concluir</span>
              </DropdownMenuItem>
            )}
            
            {appointment.status !== 'cancelado' && (
              <DropdownMenuItem onClick={() => setIsCancelDialogOpen(true)}>
                <X className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">Cancelar</span>
              </DropdownMenuItem>
            )}
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem 
              className="text-destructive"
              onClick={() => onDelete(appointment.id)}
            >
              <Trash2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm">Excluir</span>
            </DropdownMenuItem>
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
                    <li><strong>Data:</strong> {format(parseISO(appointment.data), 'dd/MM/yyyy')} às {appointment.hora}</li>
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
      </TableCell>
    </TableRow>
  );
};

export default ClientAppointmentRow;
