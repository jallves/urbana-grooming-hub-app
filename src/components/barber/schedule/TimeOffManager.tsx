import React, { useState } from 'react';
import { 
  Calendar, 
  CalendarPlus, 
  Coffee, 
  Palmtree, 
  FileText, 
  CalendarHeart, 
  Circle,
  Loader2,
  Trash2,
  CalendarDays,
  Clock,
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react';
import { format, parseISO, differenceInDays, isAfter, isBefore, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { useTimeOff, TIME_OFF_TYPES, TimeOff, CreateTimeOffInput } from '@/hooks/barber/useTimeOff';

const TYPE_ICONS = {
  folga: Coffee,
  ferias: Palmtree,
  licenca: FileText,
  feriado: CalendarHeart,
  outro: Circle,
};

const TYPE_COLORS = {
  folga: 'bg-amber-500/20 border-amber-500/40 text-amber-300',
  ferias: 'bg-blue-500/20 border-blue-500/40 text-blue-300',
  licenca: 'bg-purple-500/20 border-purple-500/40 text-purple-300',
  feriado: 'bg-green-500/20 border-green-500/40 text-green-300',
  outro: 'bg-gray-500/20 border-gray-500/40 text-gray-300',
};

const TYPE_BADGE_COLORS = {
  folga: 'bg-amber-500/30 text-amber-200',
  ferias: 'bg-blue-500/30 text-blue-200',
  licenca: 'bg-purple-500/30 text-purple-200',
  feriado: 'bg-green-500/30 text-green-200',
  outro: 'bg-gray-500/30 text-gray-200',
};

const TimeOffManager: React.FC = () => {
  const { 
    upcomingTimeOffs, 
    loading, 
    saving, 
    stats,
    createTimeOff, 
    deleteTimeOff 
  } = useTimeOff();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<CreateTimeOffInput>({
    start_date: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
    end_date: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
    type: 'folga',
    reason: '',
  });

  const resetForm = () => {
    setFormData({
      start_date: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
      end_date: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
      type: 'folga',
      reason: '',
    });
  };

  const handleSubmit = async () => {
    const success = await createTimeOff(formData);
    if (success) {
      setIsDialogOpen(false);
      resetForm();
    }
  };

  const handleDelete = async (id: string) => {
    await deleteTimeOff(id);
    setDeleteConfirm(null);
  };

  const getDaysCount = (startDate: string, endDate: string) => {
    return differenceInDays(parseISO(endDate), parseISO(startDate)) + 1;
  };

  const getTimeOffStatus = (timeOff: TimeOff) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = parseISO(timeOff.start_date);
    const end = parseISO(timeOff.end_date);

    if (isBefore(end, today)) return 'past';
    if (isAfter(start, today)) return 'upcoming';
    return 'active';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-urbana-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header com estatísticas */}
      <div className="grid grid-cols-2 gap-3">
        <div className="backdrop-blur-sm bg-urbana-gold/10 border border-urbana-gold/30 rounded-xl p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-1">
            <CalendarDays className="h-4 w-4 text-urbana-gold" />
            <span className="text-xs text-urbana-light/60">Próximas</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-urbana-light">{stats.upcoming}</p>
          <p className="text-[10px] sm:text-xs text-urbana-light/50">ausências programadas</p>
        </div>
        <div className="backdrop-blur-sm bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-blue-400" />
            <span className="text-xs text-urbana-light/60">Total Dias</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-urbana-light">{stats.totalDays}</p>
          <p className="text-[10px] sm:text-xs text-urbana-light/50">dias de ausência</p>
        </div>
      </div>

      {/* Botão de adicionar */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button 
            className="w-full bg-urbana-gold hover:bg-urbana-gold/90 text-urbana-black font-semibold py-6"
            onClick={() => {
              resetForm();
              setIsDialogOpen(true);
            }}
          >
            <CalendarPlus className="h-5 w-5 mr-2" />
            Registrar Nova Ausência
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-urbana-black border-urbana-gold/30 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-urbana-light flex items-center gap-2">
              <Calendar className="h-5 w-5 text-urbana-gold" />
              Nova Ausência
            </DialogTitle>
            <DialogDescription className="text-urbana-light/60">
              Registre folgas, férias ou licenças. Agendamentos no período serão bloqueados.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Tipo de ausência */}
            <div className="space-y-2">
              <Label className="text-urbana-light/70 text-sm">Tipo de Ausência</Label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {(Object.keys(TIME_OFF_TYPES) as Array<keyof typeof TIME_OFF_TYPES>).map((type) => {
                  const Icon = TYPE_ICONS[type];
                  const isSelected = formData.type === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, type }))}
                      className={cn(
                        'flex flex-col items-center gap-1 p-2 sm:p-3 rounded-lg border transition-all',
                        isSelected 
                          ? TYPE_COLORS[type]
                          : 'border-urbana-gold/20 text-urbana-light/50 hover:border-urbana-gold/40'
                      )}
                    >
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="text-[10px] sm:text-xs">{TIME_OFF_TYPES[type].label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Datas */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-urbana-light/70 text-sm">Data Início</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => {
                    const newStart = e.target.value;
                    setFormData(prev => ({
                      ...prev,
                      start_date: newStart,
                      end_date: prev.end_date < newStart ? newStart : prev.end_date
                    }));
                  }}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  className="bg-urbana-black/60 border-urbana-gold/30 text-urbana-light"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-urbana-light/70 text-sm">Data Fim</Label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                  min={formData.start_date}
                  className="bg-urbana-black/60 border-urbana-gold/30 text-urbana-light"
                />
              </div>
            </div>

            {/* Preview de dias */}
            <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-urbana-gold/10 border border-urbana-gold/20">
              <CalendarDays className="h-4 w-4 text-urbana-gold" />
              <span className="text-sm text-urbana-light">
                {getDaysCount(formData.start_date, formData.end_date)} dia(s) de ausência
              </span>
            </div>

            {/* Motivo */}
            <div className="space-y-2">
              <Label className="text-urbana-light/70 text-sm">
                Motivo <span className="text-urbana-light/40">(opcional)</span>
              </Label>
              <Textarea
                value={formData.reason || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Ex: Consulta médica, viagem, etc."
                className="bg-urbana-black/60 border-urbana-gold/30 text-urbana-light min-h-[80px] resize-none"
              />
            </div>

            {/* Aviso */}
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <AlertCircle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-300/80">
                Clientes não poderão agendar horários durante sua ausência. 
                Certifique-se de não ter agendamentos pendentes neste período.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              className="border-urbana-gold/30 text-urbana-light hover:bg-urbana-gold/10"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saving}
              className="bg-urbana-gold hover:bg-urbana-gold/90 text-urbana-black"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirmar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lista de ausências */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-urbana-light/70 flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Ausências Programadas
        </h3>

        {upcomingTimeOffs.length === 0 ? (
          <div className="text-center py-8 backdrop-blur-sm bg-urbana-black/30 border border-urbana-gold/10 rounded-xl">
            <Coffee className="h-10 w-10 mx-auto mb-3 text-urbana-light/20" />
            <p className="text-urbana-light/50 text-sm">Nenhuma ausência programada</p>
            <p className="text-urbana-light/30 text-xs mt-1">
              Clique no botão acima para registrar
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {upcomingTimeOffs.map((timeOff) => {
              const Icon = TYPE_ICONS[timeOff.type];
              const daysCount = getDaysCount(timeOff.start_date, timeOff.end_date);
              const status = getTimeOffStatus(timeOff);

              return (
                <div
                  key={timeOff.id}
                  className={cn(
                    'p-3 sm:p-4 rounded-xl border transition-all',
                    TYPE_COLORS[timeOff.type]
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={cn(
                        'p-2 rounded-lg flex-shrink-0',
                        TYPE_BADGE_COLORS[timeOff.type]
                      )}>
                        <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm sm:text-base">
                            {TIME_OFF_TYPES[timeOff.type].label}
                          </span>
                          {status === 'active' && (
                            <span className="px-2 py-0.5 rounded-full bg-green-500/30 text-green-300 text-[10px] font-medium">
                              Em andamento
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 text-xs sm:text-sm opacity-80">
                          <CalendarDays className="h-3.5 w-3.5" />
                          <span>
                            {format(parseISO(timeOff.start_date), "dd/MM/yyyy", { locale: ptBR })}
                            {timeOff.start_date !== timeOff.end_date && (
                              <> até {format(parseISO(timeOff.end_date), "dd/MM/yyyy", { locale: ptBR })}</>
                            )}
                          </span>
                          <span className="opacity-60">({daysCount} dia{daysCount > 1 ? 's' : ''})</span>
                        </div>
                        {timeOff.reason && (
                          <p className="text-xs opacity-60 mt-1.5 truncate">
                            {timeOff.reason}
                          </p>
                        )}
                      </div>
                    </div>

                    {status !== 'active' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteConfirm(timeOff.id)}
                        className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/20 flex-shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirm Delete Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent className="bg-urbana-black border-urbana-gold/30">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-urbana-light">Remover ausência?</AlertDialogTitle>
            <AlertDialogDescription className="text-urbana-light/60">
              Esta ação não pode ser desfeita. Os horários voltarão a ficar disponíveis para agendamento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-urbana-gold/30 text-urbana-light hover:bg-urbana-gold/10">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Remover'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TimeOffManager;
