
import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle, Trash2, UserX, UserCheck, ShieldAlert } from 'lucide-react';

export type ConfirmActionType = 'delete' | 'deactivate' | 'reactivate' | 'blocked';

interface ConfirmActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm?: () => void;
  type: ConfirmActionType;
  title: string;
  description: string;
  entityName?: string;
  linkedDataMessage?: string;
}

const iconMap: Record<ConfirmActionType, React.ReactNode> = {
  delete: <Trash2 className="h-6 w-6 text-red-500" />,
  deactivate: <UserX className="h-6 w-6 text-orange-500" />,
  reactivate: <UserCheck className="h-6 w-6 text-green-500" />,
  blocked: <ShieldAlert className="h-6 w-6 text-red-500" />,
};

const actionColorMap: Record<ConfirmActionType, string> = {
  delete: 'bg-red-600 hover:bg-red-700 text-white',
  deactivate: 'bg-orange-500 hover:bg-orange-600 text-white',
  reactivate: 'bg-green-600 hover:bg-green-700 text-white',
  blocked: 'bg-muted text-muted-foreground',
};

const actionLabelMap: Record<ConfirmActionType, string> = {
  delete: 'Excluir Permanentemente',
  deactivate: 'Inativar',
  reactivate: 'Reativar',
  blocked: 'Entendido',
};

const ConfirmActionDialog: React.FC<ConfirmActionDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  type,
  title,
  description,
  entityName,
  linkedDataMessage,
}) => {
  const isBlocked = type === 'blocked';

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md border-border bg-background">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2.5 rounded-full ${
              type === 'delete' || type === 'blocked' ? 'bg-red-100' :
              type === 'deactivate' ? 'bg-orange-100' : 'bg-green-100'
            }`}>
              {iconMap[type]}
            </div>
            <AlertDialogTitle className="text-lg font-playfair text-foreground">
              {title}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-sm font-raleway text-muted-foreground leading-relaxed">
            {entityName && (
              <span className="block mb-2 text-foreground font-medium">
                👤 {entityName}
              </span>
            )}
            {description}
            {linkedDataMessage && (
              <span className="block mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs leading-relaxed">
                <AlertTriangle className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />
                {linkedDataMessage}
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-2">
          {!isBlocked && (
            <AlertDialogCancel className="font-raleway">
              Cancelar
            </AlertDialogCancel>
          )}
          <AlertDialogAction
            onClick={() => onConfirm?.()}
            className={`font-raleway ${actionColorMap[type]}`}
          >
            {actionLabelMap[type]}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ConfirmActionDialog;
