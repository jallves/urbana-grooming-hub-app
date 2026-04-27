import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Calendar as CalendarIcon,
  Lock,
  Unlock,
  Loader2,
  AlertTriangle,
  CalendarOff,
  Trash2,
  Users,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ConfirmActionDialog from '../shared/ConfirmActionDialog';

interface ActiveBarber {
  staffTableId: string;
  nome: string;
}

interface ClosedDay {
  date: string;
  reason: string;
  barberCount: number;
  blockIds: string[];
}

const CLOSURE_PREFIX = '[FECHAMENTO]';
const FULL_DAY_START = '00:00:00';
const FULL_DAY_END = '23:59:00';

const BarbershopClosureManager: React.FC = () => {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [reason, setReason] = useState('Feriado');
  const [activeBarbers, setActiveBarbers] = useState<ActiveBarber[]>([]);
  const [closedDays, setClosedDays] = useState<ClosedDay[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<ClosedDay | null>(null);

  // Buscar barbeiros ativos (mapeados para staff.id, que é o barber_id em barber_availability)
  const fetchActiveBarbers = useCallback(async () => {
    const { data: barbersData, error } = await supabase
      .from('painel_barbeiros')
      .select('id, nome, staff_id')
      .eq('ativo', true)
      .order('nome');

    if (error) {
      console.error('Erro ao buscar barbeiros:', error);
      return [];
    }

    const list: ActiveBarber[] = [];
    for (const b of barbersData || []) {
      if (!b.staff_id) continue;
      const { data: staffData } = await supabase
        .from('staff')
        .select('id')
        .eq('staff_id', b.staff_id)
        .maybeSingle();
      if (staffData?.id) {
        list.push({ staffTableId: staffData.id, nome: b.nome });
      }
    }
    setActiveBarbers(list);
    return list;
  }, []);

  // Buscar dias fechados (agrupando por data)
  const fetchClosedDays = useCallback(async () => {
    setLoadingList(true);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('barber_availability')
        .select('id, date, start_time, end_time, is_available')
        .eq('is_available', false)
        .eq('start_time', FULL_DAY_START)
        .gte('date', today)
        .order('date', { ascending: true });

      if (error) throw error;

      // Agrupar por data
      const map = new Map<string, ClosedDay>();
      (data || []).forEach((row: any) => {
        const existing = map.get(row.date);
        if (existing) {
          existing.barberCount += 1;
          existing.blockIds.push(row.id);
        } else {
          map.set(row.date, {
            date: row.date,
            reason: 'Fechamento da Barbearia',
            barberCount: 1,
            blockIds: [row.id],
          });
        }
      });

      setClosedDays(Array.from(map.values()));
    } catch (err) {
      console.error('Erro ao buscar fechamentos:', err);
      toast.error('Erro ao carregar dias fechados');
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    fetchActiveBarbers();
    fetchClosedDays();
  }, [fetchActiveBarbers, fetchClosedDays]);

  const handleConfirmClose = async () => {
    setConfirmOpen(false);
    setSaving(true);
    try {
      const barbers = activeBarbers.length > 0 ? activeBarbers : await fetchActiveBarbers();
      if (barbers.length === 0) {
        toast.error('Nenhum barbeiro ativo encontrado.');
        return;
      }

      // Verificar agendamentos no dia
      const { data: appts } = await supabase
        .from('painel_agendamentos')
        .select('id, hora, painel_barbeiros, barbeiro_id')
        .eq('data', date)
        .not('status', 'in', '("cancelado","ausente")');

      if (appts && appts.length > 0) {
        toast.warning(
          `Atenção: existem ${appts.length} agendamento(s) neste dia. O bloqueio será aplicado, mas os agendamentos existentes permanecem.`,
          { duration: 6000 }
        );
      }

      // Criar bloqueio "dia inteiro" para cada barbeiro
      const inserts = barbers.map((b) => ({
        barber_id: b.staffTableId,
        date,
        start_time: FULL_DAY_START,
        end_time: FULL_DAY_END,
        is_available: false,
      }));

      // Remover bloqueios de dia inteiro existentes para evitar duplicidade
      await supabase
        .from('barber_availability')
        .delete()
        .eq('date', date)
        .eq('is_available', false)
        .eq('start_time', FULL_DAY_START)
        .in('barber_id', barbers.map((b) => b.staffTableId));

      const { error } = await supabase.from('barber_availability').insert(inserts);
      if (error) throw error;

      const formattedDate = format(parseISO(date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
      toast.success(`Barbearia fechada em ${formattedDate} (${barbers.length} barbeiros bloqueados)`);
      await fetchClosedDays();
    } catch (err: any) {
      console.error('Erro ao fechar barbearia:', err);
      toast.error('Erro ao fechar barbearia', { description: err?.message });
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveClosure = async () => {
    if (!confirmRemove) return;
    const day = confirmRemove;
    setConfirmRemove(null);
    setRemoving(day.date);
    try {
      const { error } = await supabase
        .from('barber_availability')
        .delete()
        .in('id', day.blockIds);
      if (error) throw error;

      const formattedDate = format(parseISO(day.date), "dd 'de' MMMM", { locale: ptBR });
      toast.success(`Fechamento de ${formattedDate} removido. Barbearia reaberta.`);
      await fetchClosedDays();
    } catch (err: any) {
      console.error('Erro ao remover fechamento:', err);
      toast.error('Erro ao reabrir o dia', { description: err?.message });
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Aviso */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 sm:p-4">
        <p className="text-xs sm:text-sm text-amber-800 leading-relaxed flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>
            Use esta opção para <strong>feriados ou dias fechados</strong>. Ao confirmar, todos os horários
            de <strong>todos os barbeiros ativos</strong> serão bloqueados para o dia selecionado nas plataformas
            de agendamento (cliente, totem e admin).
          </span>
        </p>
      </div>

      {/* Form de fechamento */}
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader className="p-4 sm:p-5 pb-3">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-gray-900 font-playfair">
            <CalendarOff className="h-5 w-5 text-red-600" />
            Fechar Barbearia (Dia Inteiro)
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm text-gray-600">
            Bloqueia o dia para todos os barbeiros de uma vez.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 pt-0 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="closure-date" className="text-xs sm:text-sm flex items-center gap-2 text-gray-700">
                <CalendarIcon className="h-4 w-4" />
                Data do fechamento
              </Label>
              <Input
                id="closure-date"
                type="date"
                value={date}
                min={format(new Date(), 'yyyy-MM-dd')}
                onChange={(e) => setDate(e.target.value)}
                className="bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="closure-reason" className="text-xs sm:text-sm text-gray-700">
                Motivo (opcional)
              </Label>
              <Input
                id="closure-reason"
                type="text"
                placeholder="Ex: Feriado - Dia do Trabalho"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="bg-white"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Users className="h-4 w-4 text-gray-500" />
            <span>
              {activeBarbers.length} barbeiro(s) ativo(s) serão afetados
            </span>
          </div>

          <Button
            onClick={() => setConfirmOpen(true)}
            disabled={saving || !date || activeBarbers.length === 0}
            className="w-full bg-red-600 hover:bg-red-700 text-white"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Fechando...
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 mr-2" />
                Fechar Barbearia neste dia
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Lista de dias fechados */}
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader className="p-4 sm:p-5 pb-3">
          <CardTitle className="text-base sm:text-lg text-gray-900 font-playfair">
            Próximos Dias Fechados
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm text-gray-600">
            Dias com bloqueio aplicado a todos os barbeiros.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 pt-0">
          {loadingList ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-urbana-gold" />
            </div>
          ) : closedDays.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <CalendarOff className="h-10 w-10 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600 font-medium">Nenhum dia fechado</p>
              <p className="text-xs text-gray-500 mt-1">A barbearia está aberta normalmente.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {closedDays.map((day) => {
                const formattedDate = format(parseISO(day.date), "EEEE, dd 'de' MMMM 'de' yyyy", {
                  locale: ptBR,
                });
                const isRemoving = removing === day.date;
                return (
                  <div
                    key={day.date}
                    className="flex items-center justify-between gap-2 p-3 rounded-lg border border-red-200 bg-red-50"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
                        <CalendarOff className="h-4 w-4 text-red-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 capitalize truncate">
                          {formattedDate}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="secondary" className="text-[10px] bg-red-100 text-red-700 border-red-200">
                            {day.barberCount} barbeiro(s)
                          </Badge>
                          <span className="text-[10px] text-gray-500">Dia inteiro bloqueado</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setConfirmRemove(day)}
                      disabled={isRemoving}
                      className="border-red-300 text-red-700 hover:bg-red-100 flex-shrink-0"
                    >
                      {isRemoving ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <>
                          <Unlock className="h-3.5 w-3.5 sm:mr-1.5" />
                          <span className="hidden sm:inline">Reabrir</span>
                        </>
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmação de fechamento */}
      <ConfirmActionDialog
        open={confirmOpen}
        onOpenChange={(open) => { if (!open) setConfirmOpen(false); }}
        onConfirm={handleConfirmClose}
        type="delete"
        title="Confirmar Fechamento"
        description={`Tem certeza que deseja fechar a barbearia em ${
          date ? format(parseISO(date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : ''
        }? Todos os horários de ${activeBarbers.length} barbeiro(s) serão bloqueados.`}
        entityName={reason || 'Fechamento'}
      />

      {/* Confirmação de reabertura */}
      <ConfirmActionDialog
        open={!!confirmRemove}
        onOpenChange={(open) => { if (!open) setConfirmRemove(null); }}
        onConfirm={handleRemoveClosure}
        type="delete"
        title="Reabrir Barbearia"
        description={
          confirmRemove
            ? `Tem certeza que deseja reabrir o dia ${format(
                parseISO(confirmRemove.date),
                "dd 'de' MMMM",
                { locale: ptBR }
              )}? Os bloqueios de dia inteiro serão removidos para todos os barbeiros.`
            : ''
        }
        entityName="Reabrir"
      />
    </div>
  );
};

export default BarbershopClosureManager;