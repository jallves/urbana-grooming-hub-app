import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, Receipt, Calendar, Clock, User } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { PendingCheckoutItem } from '@/hooks/useClientPendingCheckoutBlock';
import { PENDING_CHECKOUT_BLOCK_DAYS } from '@/hooks/useClientPendingCheckoutBlock';

interface Props {
  open: boolean;
  onClose: () => void;
  items: PendingCheckoutItem[];
  oldestDays: number;
  blocked: boolean;
}

export const PendingCheckoutAlertDialog: React.FC<Props> = ({
  open,
  onClose,
  items,
  oldestDays,
  blocked,
}) => {
  const total = items.reduce((sum, it) => sum + (it.preco || 0), 0);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="max-w-md bg-gradient-to-br from-urbana-black via-[#1a1a1a] to-urbana-black border border-urbana-gold/40 text-urbana-light shadow-[0_8px_40px_rgba(212,175,55,0.25)] rounded-2xl"
      >
        <DialogHeader className="space-y-3">
          <div className="mx-auto w-14 h-14 rounded-full bg-urbana-gold/15 border border-urbana-gold/40 flex items-center justify-center">
            <Receipt className="w-7 h-7 text-urbana-gold" />
          </div>
          <DialogTitle className="text-center text-xl font-playfair text-urbana-gold">
            {blocked ? 'Pagamento pendente' : 'Lembrete de pagamento'}
          </DialogTitle>
          <DialogDescription className="text-center text-urbana-light/80 text-sm leading-relaxed">
            {blocked ? (
              <>
                Identificamos {items.length === 1 ? 'um atendimento' : `${items.length} atendimentos`}{' '}
                seu{items.length > 1 ? 's' : ''} sem checkout finalizado
                {oldestDays > 0 && (
                  <> há <span className="text-urbana-gold font-semibold">{oldestDays} dias</span></>
                )}
                . Por gentileza, regularize na próxima visita para continuar agendando.
              </>
            ) : (
              <>
                Você tem {items.length === 1 ? 'um atendimento' : `${items.length} atendimentos`}{' '}
                aguardando checkout. Passe na recepção da Costa Urbana para finalizarmos juntos.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 space-y-2 max-h-60 overflow-y-auto pr-1">
          {items.map((it) => (
            <div
              key={it.id}
              className="rounded-xl border border-urbana-gold/20 bg-white/[0.03] p-3"
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-sm font-semibold text-urbana-light truncate">
                  {it.servico_nome || 'Atendimento'}
                </span>
                {typeof it.preco === 'number' && (
                  <span className="text-sm font-bold text-urbana-gold whitespace-nowrap">
                    R$ {it.preco.toFixed(2)}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-urbana-light/70">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-urbana-gold" />
                  {format(parseISO(it.data), "dd 'de' MMM", { locale: ptBR })}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-urbana-gold" />
                  {it.hora?.substring(0, 5)}
                </span>
                {it.barbeiro_nome && (
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3 text-urbana-gold" />
                    {it.barbeiro_nome}
                  </span>
                )}
              </div>
              {it.diasPendente >= PENDING_CHECKOUT_BLOCK_DAYS && (
                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-urbana-gold/90">
                  <AlertCircle className="w-3 h-3" />
                  Pendente há {it.diasPendente} dias
                </div>
              )}
            </div>
          ))}
        </div>

        {total > 0 && (
          <div className="flex justify-between items-center px-1 pb-1 text-sm">
            <span className="text-urbana-light/70">Total em aberto</span>
            <span className="text-urbana-gold font-bold text-base">
              R$ {total.toFixed(2)}
            </span>
          </div>
        )}

        <DialogFooter className="sm:justify-center mt-2">
          <Button
            onClick={onClose}
            className="bg-urbana-gold hover:bg-urbana-gold/90 text-urbana-black font-semibold px-8"
          >
            Entendi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PendingCheckoutAlertDialog;