import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Calendar, Clock, User, Scissors, Info, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SuccessConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentDetails: {
    serviceName: string;
    barberName: string;
    date: Date;
    time: string;
    price: number;
  };
}

const SuccessConfirmationDialog: React.FC<SuccessConfirmationDialogProps> = ({
  isOpen,
  onClose,
  appointmentDetails
}) => {
  const formattedDate = format(appointmentDetails.date, "EEEE, dd 'de' MMMM", { locale: ptBR });
  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
        {/* Header com fundo verde */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 p-8 text-center text-white">
          <div className="flex justify-center mb-4">
            <div className="bg-white/20 rounded-full p-3 backdrop-blur-sm">
              <CheckCircle2 className="h-16 w-16 text-white" />
            </div>
          </div>
          <DialogTitle className="text-2xl font-bold text-white mb-2">
            Agendamento Confirmado!
          </DialogTitle>
          <DialogDescription className="text-white/90 text-base">
            Obrigado pela sua preferência 💈
          </DialogDescription>
        </div>

        {/* Detalhes do agendamento */}
        <div className="p-6 space-y-4">
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 rounded-full p-2">
                <Scissors className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Serviço</p>
                <p className="font-semibold">{appointmentDetails.serviceName}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-primary/10 rounded-full p-2">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Profissional</p>
                <p className="font-semibold">{appointmentDetails.barberName}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-primary/10 rounded-full p-2">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Data</p>
                <p className="font-semibold">{capitalizedDate}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-primary/10 rounded-full p-2">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Horário</p>
                <p className="font-semibold">{appointmentDetails.time}</p>
              </div>
            </div>
          </div>

          {/* Orientações importantes */}
          <div className="space-y-3 pt-2">
            <div className="flex gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  Importante
                </p>
                <p className="text-blue-800 dark:text-blue-200">
                  Por favor, chegue com <strong>10 minutos de antecedência</strong> para garantir 
                  que seu atendimento comece no horário agendado.
                </p>
              </div>
            </div>

            <div className="flex gap-3 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-900">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                  Política de Cancelamento
                </p>
                <p className="text-amber-800 dark:text-amber-200">
                  Você pode cancelar seu agendamento <strong>até 3 horas antes</strong> pelo próprio painel. 
                  Cancelamentos com menos de 3 horas de antecedência devem ser feitos por contato direto 
                  com a barbearia.
                </p>
              </div>
            </div>
          </div>

          {/* Botões de ação */}
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              Voltar ao Início
            </Button>
            <Button 
              onClick={() => {
                onClose();
                window.location.href = '/painel-cliente/agendamentos';
              }}
              className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
            >
              Ver Meus Agendamentos
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SuccessConfirmationDialog;
