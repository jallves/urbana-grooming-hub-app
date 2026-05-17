import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

import ServiceSelect from '@/components/admin/appointments/form/ServiceSelect';
import StaffSelect from '@/components/admin/appointments/form/StaffSelect';
import NotesField from '@/components/admin/appointments/form/NotesField';
import AppointmentFormActions from '@/components/admin/appointments/form/AppointmentFormActions';
import ClientDateTimePicker from '@/components/client/appointment/ClientDateTimePicker';

import { useClientFormData } from '@/components/client/appointment/useClientFormData';
import { supabase } from '@/integrations/supabase/client';
import ClientBookingExtrasModal, { ClientExtraService } from '@/components/painel-cliente/ClientBookingExtrasModal';

interface EditAgendamentoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  agendamento: {
    id: string;
    data: string;          // 'YYYY-MM-DD'
    hora: string;          // 'HH:mm[:ss]'
    servico_id?: string | null;
    barbeiro_id?: string | null;
    notas?: string | null;
  } | null;
}

const parseDateOnly = (iso: string): Date => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

const EditAgendamentoDialog: React.FC<EditAgendamentoDialogProps> = ({
  isOpen,
  onClose,
  onSaved,
  agendamento,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [extraServices, setExtraServices] = useState<ClientExtraService[]>([]);
  const [showExtrasModal, setShowExtrasModal] = useState(false);
  const defaultDate = useMemo(
    () => (agendamento ? parseDateOnly(agendamento.data) : new Date()),
    [agendamento?.id]
  );

  const {
    form,
    isLoading,
    services,
    staffMembers,
    selectedService,
  } = useClientFormData(defaultDate, agendamento?.id);

  // Pre-popula o form quando abrir
  useEffect(() => {
    if (!isOpen || !agendamento) return;
    form.reset({
      service_id: agendamento.servico_id || '',
      staff_id: agendamento.barbeiro_id || '',
      date: parseDateOnly(agendamento.data),
      time: agendamento.hora?.slice(0, 5) || '',
      notes: agendamento.notas || '',
    });
    // Carrega serviços extras existentes do agendamento e agrupa por id/nome com quantidade
    (async () => {
      const { data } = await supabase
        .from('painel_agendamentos')
        .select('servicos_extras')
        .eq('id', agendamento.id)
        .maybeSingle();
      const raw = Array.isArray(data?.servicos_extras) ? (data!.servicos_extras as any[]) : [];
      const grouped: Record<string, ClientExtraService> = {};
      for (const e of raw) {
        const key = e?.id || e?.nome;
        if (!key) continue;
        if (!grouped[key]) {
          grouped[key] = {
            id: e.id || key,
            nome: e.nome,
            preco: Number(e.preco) || 0,
            duracao: Number(e.duracao) || 0,
            quantidade: 0,
          };
        }
        grouped[key].quantidade = (grouped[key].quantidade || 0) + 1;
      }
      setExtraServices(Object.values(grouped));
    })();
  }, [isOpen, agendamento?.id]);

  const selectedDate = form.watch('date');
  const selectedTime = form.watch('time');
  const selectedStaffId = form.watch('staff_id');
  const selectedServiceId = form.watch('service_id');

  const extrasDuration = extraServices.reduce(
    (s, e) => s + (Number(e.duracao) || 0) * (e.quantidade || 1),
    0
  );
  const extrasTotal = extraServices.reduce(
    (s, e) => s + (Number(e.preco) || 0) * (e.quantidade || 1),
    0
  );
  const effectiveDuration = (selectedService?.duration || 0) + extrasDuration;

  const onSubmit = async (data: any) => {
    if (!agendamento) return;
    if (!selectedService) {
      toast.error('Selecione um serviço válido.');
      return;
    }

    const dataStr = format(data.date, 'yyyy-MM-dd');
    const horaNova = data.time;
    const horaOriginal = (agendamento.hora || '').slice(0, 5);
    const dataOriginal = agendamento.data;
    const servicoOriginal = agendamento.servico_id || '';
    const barbeiroOriginal = agendamento.barbeiro_id || '';
    const notasOriginais = agendamento.notas || '';

    // Expande extras (qtd N => N entradas) para persistência igual ao novo agendamento
    const expandedExtras = extraServices.flatMap((e) => {
      const qty = Math.max(1, e.quantidade || 1);
      return Array.from({ length: qty }, () => ({
        id: e.id,
        nome: e.nome,
        preco: Number(e.preco) || 0,
        duracao: Number(e.duracao) || 0,
      }));
    });

    setIsSaving(true);
    try {
      let result: any = null;
      let invokeError: any = null;
      try {
        const resp = await supabase.functions.invoke('client-update-appointment', {
          body: {
            appointmentId: agendamento.id,
            serviceId: data.service_id,
            barberId: data.staff_id,
            date: dataStr,
            time: horaNova,
            notes: data.notes || null,
            extras: expandedExtras,
          },
        });
        result = resp.data;
        invokeError = resp.error;
      } catch (e: any) {
        invokeError = e;
      }

      // Tenta extrair a mensagem real do corpo da resposta (ex: 409 com { error })
      if (invokeError && !result) {
        try {
          const ctx = invokeError?.context;
          if (ctx && typeof ctx.json === 'function') {
            result = await ctx.json();
          } else if (ctx && typeof ctx.text === 'function') {
            const txt = await ctx.text();
            try { result = JSON.parse(txt); } catch { result = { error: txt }; }
          }
        } catch { /* ignore */ }
      }

      if (!result?.success) {
        console.error('Erro ao atualizar agendamento:', invokeError || result);
        toast.error(result?.error || 'Não foi possível atualizar o agendamento.');
        return;
      }

      toast.success(result.message || `Agendamento atualizado para ${dataStr.split('-').reverse().join('/')} às ${horaNova}.`);
      await onSaved();
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Agendamento</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <ServiceSelect services={services} form={form} />

            <ClientDateTimePicker
              form={form}
              barberId={selectedStaffId}
              serviceDuration={effectiveDuration || selectedService?.duration}
              appointmentId={agendamento?.id}
            />

            <StaffSelect
              staffMembers={staffMembers}
              form={form}
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              serviceDuration={effectiveDuration || selectedService?.duration}
            />

            <NotesField form={form} />

            {/* Serviços Extras */}
            <div className="space-y-2">
              {extraServices.length > 0 && (
                <div className="rounded-lg border p-3 space-y-1">
                  <p className="text-xs text-muted-foreground">Serviços extras</p>
                  {extraServices.map((e) => {
                    const qty = e.quantidade || 1;
                    return (
                      <div key={e.id} className="flex justify-between text-sm">
                        <span className="truncate mr-2">{e.nome}{qty > 1 ? ` x${qty}` : ''}</span>
                        <span>R$ {((Number(e.preco) || 0) * qty).toFixed(2)}</span>
                      </div>
                    );
                  })}
                  <div className="flex justify-between text-sm font-semibold pt-1 border-t">
                    <span>Total extras</span>
                    <span>R$ {extrasTotal.toFixed(2)}</span>
                  </div>
                </div>
              )}
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setShowExtrasModal(true)}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {extraServices.length > 0 ? 'Editar serviços extras' : 'Adicionar serviços extras'}
              </Button>
            </div>

            <AppointmentFormActions
              isLoading={isLoading || isSaving}
              onClose={onClose}
              isEditing={true}
            />
          </form>
        </Form>

        {selectedServiceId && (
          <ClientBookingExtrasModal
            open={showExtrasModal}
            onOpenChange={setShowExtrasModal}
            mainServiceId={selectedServiceId}
            initialExtraServices={extraServices}
            initialProducts={[]}
            onApply={({ extraServices: es }) => setExtraServices(es)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EditAgendamentoDialog;