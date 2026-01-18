import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Calendar, Clock, User, Scissors, Info, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PainelClienteCard, PainelClienteCardHeader, PainelClienteCardTitle, PainelClienteCardDescription, PainelClienteCardContent } from '@/components/painel-cliente/PainelClienteCard';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

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
  const navigate = useNavigate();
  const formattedDate = format(appointmentDetails.date, "EEEE, dd 'de' MMMM", { locale: ptBR });
  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-[95vw] sm:max-w-[600px] p-0 overflow-hidden bg-transparent border-none max-h-[90vh] overflow-y-auto" aria-describedby="success-dialog-description">
        <VisuallyHidden>
          <DialogTitle>Agendamento Confirmado</DialogTitle>
          <DialogDescription id="success-dialog-description">
            Seu agendamento foi confirmado com sucesso
          </DialogDescription>
        </VisuallyHidden>
        <PainelClienteCard variant="success" className="w-full">
          {/* Header com ícone de sucesso */}
          <PainelClienteCardHeader className="text-center pb-2 sm:pb-4">
            <div className="flex justify-center mb-2 sm:mb-4">
              <div className="bg-green-500/20 rounded-full p-2 sm:p-4 backdrop-blur-sm">
                <CheckCircle2 className="h-10 w-10 sm:h-16 sm:w-16 text-green-400" />
              </div>
            </div>
            <PainelClienteCardTitle className="text-xl sm:text-3xl text-urbana-light">
              Agendamento Confirmado!
            </PainelClienteCardTitle>
            <PainelClienteCardDescription className="text-urbana-light/80 text-sm sm:text-base">
              Obrigado pela sua preferência 💈
            </PainelClienteCardDescription>
          </PainelClienteCardHeader>

          <PainelClienteCardContent className="space-y-4 sm:space-y-6 px-3 sm:px-6">
            {/* Detalhes do agendamento */}
            <div className="bg-urbana-black/30 backdrop-blur-sm rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3 border border-urbana-gold/20">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="bg-urbana-gold/20 rounded-full p-1.5 sm:p-2">
                  <Scissors className="h-4 w-4 sm:h-5 sm:w-5 text-urbana-gold" />
                </div>
                <div className="flex-1">
                  <p className="text-xs sm:text-sm text-urbana-light/70">Serviço</p>
                  <p className="font-semibold text-sm sm:text-base text-urbana-light">{appointmentDetails.serviceName}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <div className="bg-urbana-gold/20 rounded-full p-1.5 sm:p-2">
                  <User className="h-4 w-4 sm:h-5 sm:w-5 text-urbana-gold" />
                </div>
                <div className="flex-1">
                  <p className="text-xs sm:text-sm text-urbana-light/70">Profissional</p>
                  <p className="font-semibold text-sm sm:text-base text-urbana-light">{appointmentDetails.barberName}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <div className="bg-urbana-gold/20 rounded-full p-1.5 sm:p-2">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-urbana-gold" />
                </div>
                <div className="flex-1">
                  <p className="text-xs sm:text-sm text-urbana-light/70">Data</p>
                  <p className="font-semibold text-sm sm:text-base text-urbana-light">{capitalizedDate}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <div className="bg-urbana-gold/20 rounded-full p-1.5 sm:p-2">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-urbana-gold" />
                </div>
                <div className="flex-1">
                  <p className="text-xs sm:text-sm text-urbana-light/70">Horário</p>
                  <p className="font-semibold text-sm sm:text-base text-urbana-light">{appointmentDetails.time}</p>
                </div>
              </div>
            </div>

            {/* Orientações importantes - mais compactas no mobile */}
            <div className="space-y-2 sm:space-y-3">
              <div className="flex gap-2 sm:gap-3 p-2 sm:p-3 bg-blue-500/10 rounded-lg border border-blue-400/20 backdrop-blur-sm">
                <Info className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm">
                  <p className="font-semibold text-blue-300 mb-0.5 sm:mb-1">
                    Importante
                  </p>
                  <p className="text-urbana-light/80">
                    Chegue com <strong className="text-urbana-light">10 min de antecedência</strong>.
                  </p>
                </div>
              </div>

              <div className="flex gap-2 sm:gap-3 p-2 sm:p-3 bg-amber-500/10 rounded-lg border border-amber-400/20 backdrop-blur-sm">
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm">
                  <p className="font-semibold text-amber-300 mb-0.5 sm:mb-1">
                    Cancelamento
                  </p>
                  <p className="text-urbana-light/80">
                    Cancele <strong className="text-urbana-light">até 3h antes</strong> pelo painel.
                  </p>
                </div>
              </div>
            </div>

            {/* Botões de ação */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
              <Button 
                onClick={() => {
                  onClose();
                  navigate('/painel-cliente');
                }}
                variant="outline"
                className="flex-1 border-urbana-gold/30 bg-transparent text-urbana-light hover:bg-urbana-gold/10 hover:text-urbana-light hover:border-urbana-gold/50 text-sm sm:text-base py-2 sm:py-2.5"
              >
                Voltar ao Início
              </Button>
              <Button 
                onClick={() => {
                  onClose();
                  navigate('/painel-cliente/agendamentos');
                }}
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-sm sm:text-base py-2 sm:py-2.5"
              >
                Ver Meus Agendamentos
              </Button>
            </div>
          </PainelClienteCardContent>
        </PainelClienteCard>
      </DialogContent>
    </Dialog>
  );
};

export default SuccessConfirmationDialog;
