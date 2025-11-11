import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { MoreHorizontal, Edit, Check, X, Trash2, CheckCircle, Calendar, Clock } from 'lucide-react';
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
  const [isMobile, setIsMobile] = useState(false);

  // Detectar se é mobile
  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Determinar status real do agendamento
  const getActualStatus = () => {
    // Verificar checkout pendente
    const hasCheckIn = appointment.totem_sessions && 
      appointment.totem_sessions.some((s: any) => s.check_in_time);
    
    const hasCheckOut = appointment.totem_sessions && 
      appointment.totem_sessions.some((s: any) => s.check_out_time);
    
    const hasOpenSale = appointment.vendas && 
      appointment.vendas.some((v: any) => v.status === 'ABERTA');
    
    const isInCheckout = appointment.totem_sessions && 
      appointment.totem_sessions.some((s: any) => s.status === 'checkout');

    // Checkout pendente: tem check-in, não tem check-out, e tem venda aberta ou está em checkout
    if (hasCheckIn && !hasCheckOut && (hasOpenSale || isInCheckout)) {
      return 'checkout_pendente';
    }

    // Retornar status do banco
    return appointment.status || 'agendado';
  };

  const actualStatus = getActualStatus();

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'agendado': { 
        label: 'Agendado', 
        className: 'bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-200',
        icon: '⏰'
      },
      'confirmado': { 
        label: 'Confirmado', 
        className: 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200',
        icon: '✓'
      },
      'checkout_pendente': {
        label: 'Checkout Pendente',
        className: 'bg-orange-100 text-orange-700 border-orange-300 hover:bg-orange-200',
        icon: '💳'
      },
      'concluido': { 
        label: 'Concluído', 
        className: 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200',
        icon: '✓'
      },
      'FINALIZADO': { 
        label: 'Finalizado', 
        className: 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200',
        icon: '✓'
      },
      'cancelado': { 
        label: 'Cancelado', 
        className: 'bg-red-100 text-red-700 border-red-300 hover:bg-red-200',
        icon: '✗'
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.agendado;
    return (
      <Badge className={`text-xs font-semibold px-3 py-1 border ${config.className} transition-colors duration-200`}>
        <span className="mr-1">{config.icon}</span>
        {config.label}
      </Badge>
    );
  };

  return (
    <>
      {isMobile ? (
        // MOBILE (Card)
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200">
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
            <ActionMenu
              appointment={appointment}
              onEdit={onEdit}
              onStatusChange={onStatusChange}
              onDelete={onDelete}
            />
          </div>
        </div>
      ) : (
        // DESKTOP (Tabela)
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

          <TableCell className="py-4">
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

          <TableCell className="py-4">
            <div className="flex flex-col gap-1">
              <div className="text-sm font-medium text-gray-900">
                {appointment.painel_servicos?.nome || 'N/A'}
              </div>
              <div className="text-xs font-semibold text-green-600">
                R$ {appointment.painel_servicos?.preco?.toFixed(2) || '0,00'}
              </div>
            </div>
          </TableCell>

          <TableCell className="py-4">
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
            <ActionMenu
              appointment={appointment}
              onEdit={onEdit}
              onStatusChange={onStatusChange}
              onDelete={onDelete}
            />
          </TableCell>
        </TableRow>
      )}
    </>
  );
};

const ActionMenu = ({
  appointment,
  onEdit,
  onStatusChange,
  onDelete,
}: {
  appointment: PainelAgendamento;
  onEdit: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  return (
    <>
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

      {appointment.status !== 'confirmado' && appointment.status !== 'FINALIZADO' && appointment.status !== 'concluido' && (
        <DropdownMenuItem 
          onClick={() => onStatusChange(appointment.id, 'confirmado')}
          className="cursor-pointer hover:bg-blue-50 focus:bg-blue-50 py-2.5"
        >
          <Check className="mr-3 h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-700">Confirmar</span>
        </DropdownMenuItem>
      )}

      {(appointment.status === 'confirmado' || appointment.status === 'agendado') && (
        <DropdownMenuItem 
          onClick={() => onStatusChange(appointment.id, 'FINALIZADO')}
          className="cursor-pointer hover:bg-green-50 focus:bg-green-50 py-2.5"
        >
          <CheckCircle className="mr-3 h-4 w-4 text-green-600" />
          <span className="text-sm font-medium text-green-700">Finalizar Atendimento</span>
        </DropdownMenuItem>
      )}

      {appointment.status !== 'cancelado' && appointment.status !== 'FINALIZADO' && appointment.status !== 'concluido' && (
        <DropdownMenuItem 
          onClick={() => onStatusChange(appointment.id, 'cancelado')}
          className="cursor-pointer hover:bg-orange-50 focus:bg-orange-50 py-2.5"
        >
          <X className="mr-3 h-4 w-4 text-orange-600" />
          <span className="text-sm font-medium text-orange-700">Cancelar</span>
        </DropdownMenuItem>
      )}

      <DropdownMenuItem
        className="cursor-pointer hover:bg-red-50 focus:bg-red-50 py-2.5 text-red-600"
        onClick={() => setIsDeleteDialogOpen(true)}
      >
        <Trash2 className="mr-3 h-4 w-4" />
        <span className="text-sm font-medium">Excluir Permanentemente</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>

  <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
        <AlertDialogDescription>
          Tem certeza que deseja excluir este agendamento de{' '}
          <strong>{appointment.painel_clientes?.nome}</strong>? Esta ação não pode ser desfeita.
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

export default ClientAppointmentCompactRow;
