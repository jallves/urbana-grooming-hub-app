import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calendar, 
  Clock, 
  Lock, 
  Trash2, 
  Loader2, 
  AlertCircle,
  CalendarRange,
  Users,
  CheckCircle2
} from 'lucide-react';
import { format, addDays, eachDayOfInterval, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Barber {
  id: string;
  nome: string;
  staff_id: string | null;
  staffTableId: string | null;
}

interface BlockedSlot {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  barber_id: string;
}

interface WorkingHours {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

const AdminBarberBlockManager: React.FC = () => {
  // Estados principais
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [selectedBarberId, setSelectedBarberId] = useState<string>('');
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [workingHours, setWorkingHours] = useState<WorkingHours[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  
  // Estados do formulário
  const [blockType, setBlockType] = useState<'single' | 'range' | 'fullday'>('single');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('20:00');
  const [isFullDay, setIsFullDay] = useState(false);
  
  // Estados de loading
  const [loadingBarbers, setLoadingBarbers] = useState(true);
  const [loadingBlocks, setLoadingBlocks] = useState(false);
  const [saving, setSaving] = useState(false);

  // Buscar todos os barbeiros ativos
  useEffect(() => {
    const fetchBarbers = async () => {
      setLoadingBarbers(true);
      try {
        // Buscar barbeiros ativos com seus staff_ids
        const { data: barbersData, error: barbersError } = await supabase
          .from('painel_barbeiros')
          .select('id, nome, staff_id')
          .eq('ativo', true)
          .order('nome');

        if (barbersError) throw barbersError;

        // Para cada barbeiro, resolver o staff.id para usar com working_hours e barber_availability
        const barbersWithStaffTableId: Barber[] = [];
        
        for (const barber of barbersData || []) {
          let staffTableId: string | null = null;
          
          if (barber.staff_id) {
            const { data: staffData } = await supabase
              .from('staff')
              .select('id')
              .eq('staff_id', barber.staff_id)
              .maybeSingle();
            
            staffTableId = staffData?.id || null;
          }
          
          barbersWithStaffTableId.push({
            id: barber.id,
            nome: barber.nome,
            staff_id: barber.staff_id,
            staffTableId
          });
        }

        setBarbers(barbersWithStaffTableId);
      } catch (error) {
        console.error('Erro ao buscar barbeiros:', error);
        toast.error('Erro ao carregar barbeiros');
      } finally {
        setLoadingBarbers(false);
      }
    };

    fetchBarbers();
  }, []);

  // Quando selecionar um barbeiro, buscar seus horários de trabalho e bloqueios existentes
  useEffect(() => {
    const barber = barbers.find(b => b.id === selectedBarberId);
    setSelectedBarber(barber || null);
    
    if (!barber?.staffTableId) {
      setWorkingHours([]);
      setBlockedSlots([]);
      return;
    }

    const fetchBarberData = async () => {
      setLoadingBlocks(true);
      try {
        const [whResult, blocksResult] = await Promise.all([
          supabase
            .from('working_hours')
            .select('day_of_week, start_time, end_time, is_active')
            .eq('staff_id', barber.staffTableId),
          supabase
            .from('barber_availability')
            .select('*')
            .eq('barber_id', barber.staffTableId)
            .eq('is_available', false)
            .gte('date', format(new Date(), 'yyyy-MM-dd'))
            .order('date', { ascending: true })
        ]);

        if (!whResult.error) {
          setWorkingHours(whResult.data || []);
        }

        if (!blocksResult.error) {
          setBlockedSlots(blocksResult.data || []);
        }
      } catch (error) {
        console.error('Erro ao buscar dados do barbeiro:', error);
      } finally {
        setLoadingBlocks(false);
      }
    };

    fetchBarberData();
  }, [selectedBarberId, barbers]);

  // Gerar slots de tempo disponíveis para um dia específico
  const getTimeSlotsForDay = useCallback((date: Date): string[] => {
    const dayOfWeek = getDay(date);
    const daySchedule = workingHours.find(wh => wh.day_of_week === dayOfWeek && wh.is_active);
    
    if (!daySchedule) return [];

    const slots: string[] = [];
    const [startHour, startMin] = daySchedule.start_time.split(':').map(Number);
    const [endHour, endMin] = daySchedule.end_time.split(':').map(Number);
    
    const startTotalMinutes = startHour * 60 + startMin;
    const endTotalMinutes = endHour * 60 + endMin;

    for (let minutes = startTotalMinutes; minutes < endTotalMinutes; minutes += 30) {
      const hour = Math.floor(minutes / 60);
      const min = minutes % 60;
      slots.push(`${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`);
    }

    return slots;
  }, [workingHours]);

  // Criar bloqueios
  const handleCreateBlocks = async () => {
    if (!selectedBarber?.staffTableId) {
      toast.error('Selecione um barbeiro');
      return;
    }

    setSaving(true);
    try {
      const blocksToInsert: Array<{
        barber_id: string;
        date: string;
        start_time: string;
        end_time: string;
        is_available: boolean;
      }> = [];

      // Determinar o intervalo de datas
      const dates = blockType === 'range' 
        ? eachDayOfInterval({ 
            start: new Date(startDate + 'T12:00:00'), 
            end: new Date(endDate + 'T12:00:00') 
          })
        : [new Date(startDate + 'T12:00:00')];

      for (const date of dates) {
        const dateStr = format(date, 'yyyy-MM-dd');
        const dayOfWeek = getDay(date);
        const daySchedule = workingHours.find(wh => wh.day_of_week === dayOfWeek && wh.is_active);
        
        // Pular dias que não são de trabalho
        if (!daySchedule) continue;

        if (isFullDay || blockType === 'fullday') {
          // Bloquear o dia inteiro
          blocksToInsert.push({
            barber_id: selectedBarber.staffTableId,
            date: dateStr,
            start_time: daySchedule.start_time,
            end_time: daySchedule.end_time,
            is_available: false
          });
        } else {
          // Bloquear faixa de horário específica
          // Gerar slots de 30 em 30 minutos dentro da faixa selecionada
          const [startH, startM] = startTime.split(':').map(Number);
          const [endH, endM] = endTime.split(':').map(Number);
          const startTotal = startH * 60 + startM;
          const endTotal = endH * 60 + endM;

          for (let minutes = startTotal; minutes < endTotal; minutes += 30) {
            const slotStart = `${Math.floor(minutes / 60).toString().padStart(2, '0')}:${(minutes % 60).toString().padStart(2, '0')}:00`;
            const slotEnd = `${Math.floor((minutes + 30) / 60).toString().padStart(2, '0')}:${((minutes + 30) % 60).toString().padStart(2, '0')}:00`;
            
            blocksToInsert.push({
              barber_id: selectedBarber.staffTableId,
              date: dateStr,
              start_time: slotStart,
              end_time: slotEnd,
              is_available: false
            });
          }
        }
      }

      if (blocksToInsert.length === 0) {
        toast.error('Nenhum horário para bloquear. Verifique se as datas selecionadas são dias de trabalho.');
        return;
      }

      // Inserir bloqueios
      const { error } = await supabase
        .from('barber_availability')
        .insert(blocksToInsert);

      if (error) throw error;

      toast.success(`${blocksToInsert.length} bloqueio(s) criado(s) com sucesso!`);
      
      // Recarregar bloqueios
      const { data: newBlocks } = await supabase
        .from('barber_availability')
        .select('*')
        .eq('barber_id', selectedBarber.staffTableId)
        .eq('is_available', false)
        .gte('date', format(new Date(), 'yyyy-MM-dd'))
        .order('date', { ascending: true });
      
      setBlockedSlots(newBlocks || []);

    } catch (error: any) {
      console.error('Erro ao criar bloqueios:', error);
      toast.error('Erro ao criar bloqueios');
    } finally {
      setSaving(false);
    }
  };

  // Remover bloqueio
  const handleDeleteBlock = async (blockId: string) => {
    try {
      const { error } = await supabase
        .from('barber_availability')
        .delete()
        .eq('id', blockId);

      if (error) throw error;

      setBlockedSlots(prev => prev.filter(b => b.id !== blockId));
      toast.success('Bloqueio removido com sucesso!');
    } catch (error) {
      console.error('Erro ao remover bloqueio:', error);
      toast.error('Erro ao remover bloqueio');
    }
  };

  // Remover todos os bloqueios de uma data
  const handleDeleteAllBlocksForDate = async (date: string) => {
    if (!selectedBarber?.staffTableId) return;
    
    try {
      const { error } = await supabase
        .from('barber_availability')
        .delete()
        .eq('barber_id', selectedBarber.staffTableId)
        .eq('date', date)
        .eq('is_available', false);

      if (error) throw error;

      setBlockedSlots(prev => prev.filter(b => b.date !== date));
      toast.success('Todos os bloqueios do dia foram removidos!');
    } catch (error) {
      console.error('Erro ao remover bloqueios:', error);
      toast.error('Erro ao remover bloqueios');
    }
  };

  // Agrupar bloqueios por data
  const groupedBlocks = blockedSlots.reduce((acc, block) => {
    if (!acc[block.date]) {
      acc[block.date] = [];
    }
    acc[block.date].push(block);
    return acc;
  }, {} as Record<string, BlockedSlot[]>);

  return (
    <Card className="bg-white border-gray-200 shadow-sm">
      <CardHeader className="p-4 sm:p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 rounded-xl">
            <Lock className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <CardTitle className="text-base sm:text-lg text-gray-900 font-playfair">
              Gerenciar Bloqueios de Horários
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-gray-600">
              Bloqueie horários específicos ou dias inteiros para os barbeiros
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-6">
        {/* Seleção de Barbeiro */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Selecionar Barbeiro
          </Label>
          
          {loadingBarbers ? (
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando barbeiros...
            </div>
          ) : (
            <Select value={selectedBarberId} onValueChange={setSelectedBarberId}>
              <SelectTrigger className="w-full bg-white border-gray-300">
                <SelectValue placeholder="Selecione um barbeiro" />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200 z-50">
                {barbers.map(barber => (
                  <SelectItem key={barber.id} value={barber.id}>
                    {barber.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {selectedBarber && (
          <>
            {/* Alerta informativo */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs sm:text-sm text-amber-800 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>
                  Os bloqueios criados aqui serão refletidos no painel do barbeiro e impedirão 
                  agendamentos nestes horários em todas as plataformas (Totem, Painel Cliente, Admin).
                </span>
              </p>
            </div>

            {/* Formulário de Bloqueio */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-4">
              <h3 className="font-medium text-gray-900 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-urbana-gold" />
                Criar Novo Bloqueio
              </h3>

              {/* Tipo de Bloqueio */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Tipo de Bloqueio</Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={blockType === 'single' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setBlockType('single')}
                    className={cn(
                      blockType === 'single' 
                        ? 'bg-urbana-gold hover:bg-urbana-gold/90 text-black' 
                        : 'border-gray-300'
                    )}
                  >
                    Data Única
                  </Button>
                  <Button
                    type="button"
                    variant={blockType === 'range' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setBlockType('range')}
                    className={cn(
                      blockType === 'range' 
                        ? 'bg-urbana-gold hover:bg-urbana-gold/90 text-black' 
                        : 'border-gray-300'
                    )}
                  >
                    <CalendarRange className="h-4 w-4 mr-1" />
                    Período
                  </Button>
                  <Button
                    type="button"
                    variant={blockType === 'fullday' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => { setBlockType('fullday'); setIsFullDay(true); }}
                    className={cn(
                      blockType === 'fullday' 
                        ? 'bg-red-600 hover:bg-red-700 text-white' 
                        : 'border-gray-300'
                    )}
                  >
                    Dia Inteiro
                  </Button>
                </div>
              </div>

              {/* Seleção de Datas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    {blockType === 'range' ? 'Data Inicial' : 'Data'}
                  </Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    className="bg-white border-gray-300"
                  />
                </div>

                {blockType === 'range' && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Data Final</Label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate}
                      className="bg-white border-gray-300"
                    />
                  </div>
                )}
              </div>

              {/* Seleção de Horários (se não for dia inteiro) */}
              {blockType !== 'fullday' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={isFullDay}
                      onCheckedChange={setIsFullDay}
                      id="fullday-switch"
                    />
                    <Label htmlFor="fullday-switch" className="text-sm text-gray-700 cursor-pointer">
                      Bloquear dia inteiro
                    </Label>
                  </div>

                  {!isFullDay && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          Hora Inicial
                        </Label>
                        <Input
                          type="time"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          className="bg-white border-gray-300"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          Hora Final
                        </Label>
                        <Input
                          type="time"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          className="bg-white border-gray-300"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Botão de Criar */}
              <Button
                onClick={handleCreateBlocks}
                disabled={saving || !selectedBarberId}
                className="w-full bg-red-600 hover:bg-red-700 text-white"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Criando bloqueios...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Criar Bloqueio
                  </>
                )}
              </Button>
            </div>

            {/* Lista de Bloqueios Existentes */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-600" />
                Bloqueios Ativos - {selectedBarber.nome}
              </h3>

              {loadingBlocks ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : Object.keys(groupedBlocks).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-400" />
                  <p>Nenhum bloqueio ativo para este barbeiro.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(groupedBlocks).map(([date, blocks]) => (
                    <div 
                      key={date} 
                      className="border border-gray-200 rounded-lg p-4 bg-white"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-red-500" />
                          <span className="font-medium text-gray-900">
                            {format(new Date(date + 'T12:00:00'), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                          </span>
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                            {blocks.length} slot(s)
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAllBlocksForDate(date)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Remover todos
                        </Button>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {blocks.map(block => (
                          <div 
                            key={block.id}
                            className="flex items-center gap-1 bg-red-50 border border-red-200 rounded-md px-2 py-1 text-sm"
                          >
                            <Clock className="h-3 w-3 text-red-500" />
                            <span className="text-red-700">
                              {block.start_time.substring(0, 5)} - {block.end_time.substring(0, 5)}
                            </span>
                            <button
                              onClick={() => handleDeleteBlock(block.id)}
                              className="ml-1 text-red-400 hover:text-red-600"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {!selectedBarberId && !loadingBarbers && (
          <div className="text-center py-12 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>Selecione um barbeiro para gerenciar seus bloqueios de horário.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminBarberBlockManager;
