import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useBarberData } from '@/hooks/barber/useBarberData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Calendar, AlertCircle } from 'lucide-react';
import { format, parseISO, isFuture, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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

interface TimeOff {
  id: string;
  start_date: string;
  end_date: string;
  reason: string;
  type: string;
}

const TimeOffManager: React.FC = () => {
  const { barberData } = useBarberData();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [timeOffList, setTimeOffList] = useState<TimeOff[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    start_date: '',
    end_date: '',
    reason: '',
    type: 'folga',
  });

  useEffect(() => {
    if (barberData?.staff_id) {
      fetchTimeOff();
    }
  }, [barberData?.staff_id]);

  const fetchTimeOff = async () => {
    if (!barberData?.staff_id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('time_off')
        .select('*')
        .eq('staff_id', barberData.staff_id)
        .order('start_date', { ascending: false });

      if (error) throw error;
      setTimeOffList(data || []);
    } catch (error) {
      console.error('Erro ao buscar ausências:', error);
      toast.error('Erro ao carregar ausências');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!barberData?.staff_id) {
      toast.error('Dados do barbeiro não encontrados');
      return;
    }

    // Validação básica
    if (!formData.start_date || !formData.end_date) {
      toast.error('Preencha as datas de início e fim');
      return;
    }

    if (new Date(formData.start_date) > new Date(formData.end_date)) {
      toast.error('Data de início não pode ser maior que a data de fim');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('time_off')
        .insert({
          staff_id: barberData.staff_id,
          start_date: formData.start_date,
          end_date: formData.end_date,
          reason: formData.reason || 'Não especificado',
          type: formData.type,
          is_recurring: false,
        });

      if (error) throw error;

      toast.success('✅ Ausência registrada!', {
        description: 'Você não aparecerá como disponível neste período',
      });

      // Resetar form
      setFormData({
        start_date: '',
        end_date: '',
        reason: '',
        type: 'folga',
      });
      setShowForm(false);
      fetchTimeOff();
    } catch (error: any) {
      console.error('Erro ao registrar ausência:', error);
      toast.error('Erro ao registrar ausência', {
        description: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('time_off')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Ausência removida com sucesso');
      fetchTimeOff();
    } catch (error: any) {
      console.error('Erro ao remover ausência:', error);
      toast.error('Erro ao remover ausência', {
        description: error.message,
      });
    } finally {
      setDeleteId(null);
    }
  };

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      folga: 'Folga',
      ferias: 'Férias',
      doenca: 'Doença',
      outro: 'Outro',
    };
    return types[type] || type;
  };

  const getTypeBadgeClass = (type: string) => {
    const classes: Record<string, string> = {
      folga: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      ferias: 'bg-green-500/20 text-green-400 border-green-500/30',
      doenca: 'bg-red-500/20 text-red-400 border-red-500/30',
      outro: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    };
    return classes[type] || classes.outro;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-urbana-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="backdrop-blur-sm bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
        <p className="text-xs sm:text-sm text-orange-300">
          <AlertCircle className="h-4 w-4 inline mr-2" />
          Registre seus períodos de ausência. Durante esses períodos, você não aparecerá 
          como disponível para agendamentos.
        </p>
      </div>

      {!showForm ? (
        <Button
          onClick={() => setShowForm(true)}
          className="w-full bg-urbana-gold text-urbana-black hover:bg-urbana-gold/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Registrar Nova Ausência
        </Button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 p-4 backdrop-blur-sm bg-urbana-black/30 border border-urbana-gold/20 rounded-xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-urbana-light/70">Data de Início</Label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                min={format(new Date(), 'yyyy-MM-dd')}
                className="bg-urbana-black/40 border-urbana-gold/20 text-urbana-light"
                required
              />
            </div>
            <div>
              <Label className="text-urbana-light/70">Data de Fim</Label>
              <Input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                min={formData.start_date || format(new Date(), 'yyyy-MM-dd')}
                className="bg-urbana-black/40 border-urbana-gold/20 text-urbana-light"
                required
              />
            </div>
          </div>

          <div>
            <Label className="text-urbana-light/70">Tipo de Ausência</Label>
            <select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
              className="w-full px-3 py-2 bg-urbana-black/40 border border-urbana-gold/20 rounded-md text-urbana-light"
            >
              <option value="folga">Folga</option>
              <option value="ferias">Férias</option>
              <option value="doenca">Doença</option>
              <option value="outro">Outro</option>
            </select>
          </div>

          <div>
            <Label className="text-urbana-light/70">Motivo (opcional)</Label>
            <Textarea
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="Descreva o motivo da ausência..."
              className="bg-urbana-black/40 border-urbana-gold/20 text-urbana-light"
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowForm(false);
                setFormData({ start_date: '', end_date: '', reason: '', type: 'folga' });
              }}
              className="flex-1 border-urbana-gold/20 text-urbana-light hover:bg-urbana-gold/10"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="flex-1 bg-urbana-gold text-urbana-black hover:bg-urbana-gold/90"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Salvando...
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4 mr-2" />
                  Registrar
                </>
              )}
            </Button>
          </div>
        </form>
      )}

      {/* Lista de ausências */}
      <div className="space-y-3">
        {timeOffList.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma ausência registrada</p>
          </div>
        ) : (
          timeOffList.map((timeOff) => {
            const startDate = parseISO(timeOff.start_date);
            const endDate = parseISO(timeOff.end_date);
            const isFutureTimeOff = isFuture(startDate);

            return (
              <div
                key={timeOff.id}
                className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg hover:border-gray-600 transition-all"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getTypeBadgeClass(timeOff.type)}`}>
                        {getTypeLabel(timeOff.type)}
                      </span>
                      {!isFutureTimeOff && (
                        <span className="px-3 py-1 rounded-full text-xs font-medium border bg-gray-500/20 text-gray-400 border-gray-500/30">
                          Passado
                        </span>
                      )}
                    </div>
                    <p className="text-white font-medium mb-1">
                      {format(startDate, "dd 'de' MMMM", { locale: ptBR })} até{' '}
                      {format(endDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                    {timeOff.reason && (
                      <p className="text-sm text-gray-400">{timeOff.reason}</p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteId(timeOff.id)}
                    className="border-red-600 text-red-400 hover:bg-red-600/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-gray-800 border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Remover ausência?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Esta ação removerá o registro de ausência e você voltará a aparecer como disponível 
              para agendamentos neste período.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-700 text-white hover:bg-gray-600">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TimeOffManager;
